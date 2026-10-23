use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

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

    // If empty, create default workflow template file
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

    // Supersede other published workflows for the same test
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
