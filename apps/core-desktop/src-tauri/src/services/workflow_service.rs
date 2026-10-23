use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use sqlx::SqlitePool;
use crate::models::lab::{LabWorkflowRunDb, LabWorkflowRunStepDb};
use crate::repositories::lab_repo::LabRepository;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTemplateFile {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub test_id: Option<String>,
    pub version: i64,
    pub graph_json: String,
    pub is_default: bool,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

pub fn get_workflows_dir<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<PathBuf, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let workflows_dir = app_data.join("workflows");
    if !workflows_dir.exists() {
        fs::create_dir_all(&workflows_dir).map_err(|e| e.to_string())?;
    }
    Ok(workflows_dir)
}

pub fn list_workflows<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<Vec<WorkflowTemplateFile>, String> {
    let dir = get_workflows_dir(app)?;
    let mut list = Vec::new();

    if dir.exists() {
        for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(template) = serde_json::from_str::<WorkflowTemplateFile>(&content) {
                        list.push(template);
                    }
                }
            }
        }
    }

    if list.is_empty() {
        let now = chrono::Utc::now().to_rfc3339();
        let default_graph = serde_json::json!({
            "nodes": [
                {
                    "id": "node_reg",
                    "type": "default",
                    "position": { "x": 100, "y": 150 },
                    "data": { "label": "REGISTRATION", "stepType": "registration", "autoActions": ["advance_on_complete"] }
                },
                {
                    "id": "node_col",
                    "type": "default",
                    "position": { "x": 300, "y": 150 },
                    "data": { "label": "COLLECTION", "stepType": "collection", "autoActions": ["set_expiry_from_catalog", "advance_on_complete"] }
                },
                {
                    "id": "node_res",
                    "type": "default",
                    "position": { "x": 500, "y": 150 },
                    "data": { "label": "RESULT ENTRY", "stepType": "result_entry", "autoActions": ["advance_on_complete"] }
                },
                {
                    "id": "node_rep",
                    "type": "default",
                    "position": { "x": 700, "y": 150 },
                    "data": { "label": "REPORT DRAFT", "stepType": "report_draft", "autoActions": ["create_report_draft", "advance_on_complete"] }
                }
            ],
            "edges": [
                { "id": "e1", "source": "node_reg", "target": "node_col" },
                { "id": "e2", "source": "node_col", "target": "node_res" },
                { "id": "e3", "source": "node_res", "target": "node_rep" }
            ]
        });

        let default_template = WorkflowTemplateFile {
            id: "wf_default".to_string(),
            workspace_id: "workspace_default".to_string(),
            branch_id: "branch_default".to_string(),
            test_id: None,
            version: 1,
            graph_json: default_graph.to_string(),
            is_default: true,
            status: "published".to_string(),
            created_at: now.clone(),
            updated_at: now,
        };

        let _ = save_workflow(app, default_template.clone());
        list.push(default_template);
    }

    Ok(list)
}

pub fn save_workflow<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    template: WorkflowTemplateFile,
) -> Result<WorkflowTemplateFile, String> {
    let dir = get_workflows_dir(app)?;
    let file_path = dir.join(format!("{}.json", template.id));
    let content = serde_json::to_string_pretty(&template).map_err(|e| e.to_string())?;
    fs::write(&file_path, content).map_err(|e| e.to_string())?;
    Ok(template)
}

pub fn publish_workflow<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    template_id: String,
) -> Result<WorkflowTemplateFile, String> {
    let mut workflows = list_workflows(app)?;
    let target_idx = workflows.iter().position(|w| w.id == template_id).ok_or("Workflow template not found")?;
    let now = chrono::Utc::now().to_rfc3339();

    let target_test_id = workflows[target_idx].test_id.clone();

    for w in &mut workflows {
        if w.test_id == target_test_id && w.status == "published" && w.id != template_id {
            w.status = "draft".to_string();
            w.updated_at = now.clone();
            let _ = save_workflow(app, w.clone());
        }
    }

    workflows[target_idx].status = "published".to_string();
    workflows[target_idx].updated_at = now;

    save_workflow(app, workflows[target_idx].clone())
}

pub fn export_workflow<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    template_id: String,
    destination_path: String,
) -> Result<(), String> {
    let workflows = list_workflows(app)?;
    let target = workflows.iter().find(|w| w.id == template_id).ok_or("Workflow template not found")?;
    let content = serde_json::to_string_pretty(target).map_err(|e| e.to_string())?;
    fs::write(destination_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn import_workflow<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    json_content: String,
) -> Result<WorkflowTemplateFile, String> {
    let mut template: WorkflowTemplateFile = serde_json::from_str(&json_content).map_err(|e| e.to_string())?;
    template.id = format!("wf_{}", uuid::Uuid::new_v4());
    template.updated_at = chrono::Utc::now().to_rfc3339();
    save_workflow(app, template)
}

pub async fn start_execution(
    app: &tauri::AppHandle,
    pool: &SqlitePool,
    workspace_id: &str,
    branch_id: &str,
    order_id: &str,
    template_id: &str,
) -> Result<(LabWorkflowRunDb, Vec<LabWorkflowRunStepDb>), String> {
    let workflows = list_workflows(app)?;
    let template = workflows.iter().find(|w| w.id == template_id).ok_or("Workflow template not found")?;

    let now = chrono::Utc::now().to_rfc3339();
    let run_id = format!("wfrun_{}", uuid::Uuid::new_v4());

    let run = LabWorkflowRunDb {
        id: run_id.clone(),
        workspace_id: workspace_id.to_string(),
        branch_id: branch_id.to_string(),
        order_id: order_id.to_string(),
        template_id: template.id.clone(),
        template_version: template.version,
        state: "running".to_string(),
        created_at: now.clone(),
        updated_at: now.clone(),
    };

    let graph: serde_json::Value = serde_json::from_str(&template.graph_json).map_err(|e| e.to_string())?;
    let nodes = graph["nodes"].as_array().ok_or("Invalid graph nodes")?;
    let edges = graph["edges"].as_array().cloned().unwrap_or_default();

    let mut in_degree: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for node in nodes {
        if let Some(id) = node["id"].as_str() {
            in_degree.insert(id.to_string(), 0);
        }
    }
    for edge in &edges {
        if let Some(target) = edge["target"].as_str() {
            *in_degree.entry(target.to_string()).or_insert(0) += 1;
        }
    }

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    LabRepository::create_workflow_run(&mut *tx, &run).await.map_err(|e| e.to_string())?;

    let mut steps = Vec::new();
    for node in nodes {
        let node_id = node["id"].as_str().unwrap_or("").to_string();
        let degree = in_degree.get(&node_id).copied().unwrap_or(0);
        let status = if degree == 0 { "active" } else { "pending" };

        let step = LabWorkflowRunStepDb {
            id: format!("wfstep_{}_{}", uuid::Uuid::new_v4(), node_id),
            workspace_id: workspace_id.to_string(),
            branch_id: branch_id.to_string(),
            run_id: run_id.clone(),
            node_id,
            status: status.to_string(),
            completed_by: None,
            completed_at: None,
            block_reason: None,
            notes: None,
            measurements_json: None,
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        LabRepository::create_workflow_run_step(&mut *tx, &step).await.map_err(|e| e.to_string())?;
        steps.push(step);
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok((run, steps))
}

pub async fn complete_step(
    pool: &SqlitePool,
    workspace_id: &str,
    branch_id: &str,
    run_id: &str,
    node_id: &str,
    actor_user_id: &str,
    notes: Option<String>,
    measurements_json: Option<String>,
) -> Result<(LabWorkflowRunDb, Vec<LabWorkflowRunStepDb>), String> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    LabRepository::update_workflow_run_step(
        &mut *tx,
        workspace_id,
        branch_id,
        run_id,
        node_id,
        "done",
        Some(actor_user_id),
        Some(&now),
        notes.as_deref(),
        measurements_json.as_deref(),
        &now,
    )
    .await
    .map_err(|e| e.to_string())?;

    let steps = LabRepository::list_workflow_run_steps(pool, workspace_id, branch_id, run_id)
        .await
        .map_err(|e| e.to_string())?;

    let all_done = steps.iter().all(|s| s.status == "done" || s.status == "skipped");
    let new_state = if all_done { "completed" } else { "running" };

    LabRepository::update_workflow_run_state(&mut *tx, workspace_id, branch_id, run_id, new_state, &now)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;

    let run = LabRepository::get_workflow_run(pool, workspace_id, branch_id, run_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Workflow run not found")?;

    let updated_steps = LabRepository::list_workflow_run_steps(pool, workspace_id, branch_id, run_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok((run, updated_steps))
}
