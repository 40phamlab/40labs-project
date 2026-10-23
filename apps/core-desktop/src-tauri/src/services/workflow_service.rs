use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;
use sqlx::SqlitePool;
use crate::models::lab::{
    LabWorkflowRunDb, LabWorkflowRunStepDb, LabStageAttachmentDb,
    WorkflowExecutionExportManifest, LabReport, LabResult
};
use crate::models::audit::AuditLogEntry;
use crate::repositories::lab_repo::LabRepository;
use crate::repositories::audit_repo::AuditRepository;

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

pub fn get_attachments_dir<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<PathBuf, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let att_dir = app_data.join("attachments");
    if !att_dir.exists() {
        fs::create_dir_all(&att_dir).map_err(|e| e.to_string())?;
    }
    Ok(att_dir)
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

// STAGE-LEVEL FILE ATTACHMENTS
pub async fn attach_stage_file<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    pool: &SqlitePool,
    workspace_id: &str,
    branch_id: &str,
    actor_user_id: &str,
    run_id: &str,
    node_id: &str,
    sample_id: Option<String>,
    original_filename: String,
    mime_type: String,
    file_bytes: Vec<u8>,
) -> Result<LabStageAttachmentDb, String> {
    let sanitized_name = Path::new(&original_filename)
        .file_name()
        .and_then(|s| s.to_str())
        .ok_or("Invalid filename")?;

    let att_dir = get_attachments_dir(app)?.join(run_id).join(node_id);
    if !att_dir.exists() {
        fs::create_dir_all(&att_dir).map_err(|e| e.to_string())?;
    }

    let attachment_id = format!("att_{}", uuid::Uuid::new_v4());
    let stored_filename = format!("{}_{}", attachment_id, sanitized_name);
    let file_path = att_dir.join(stored_filename);

    fs::write(&file_path, &file_bytes).map_err(|e| e.to_string())?;
    let file_size = file_bytes.len() as i64;
    let now = chrono::Utc::now().to_rfc3339();

    let attachment = LabStageAttachmentDb {
        id: attachment_id,
        workspace_id: workspace_id.to_string(),
        branch_id: branch_id.to_string(),
        run_id: run_id.to_string(),
        node_id: node_id.to_string(),
        sample_id,
        original_filename: sanitized_name.to_string(),
        storage_path: file_path.to_string_lossy().to_string(),
        mime_type,
        file_size,
        uploaded_by: actor_user_id.to_string(),
        created_at: now.clone(),
        updated_at: now.clone(),
    };

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    LabRepository::create_stage_attachment(&mut *tx, &attachment).await.map_err(|e| e.to_string())?;

    let audit_entry = AuditLogEntry {
        id: format!("audit_{}", uuid::Uuid::new_v4()),
        workspace_id: workspace_id.to_string(),
        branch_id: branch_id.to_string(),
        created_at: now.clone(),
        action: "lab_attachment_added".to_string(),
        performed_by_user_id: Some(actor_user_id.to_string()),
        target_entity_type: "lab_stage_attachment".to_string(),
        target_entity_id: attachment.id.clone(),
        metadata: Some(serde_json::json!({ "filename": sanitized_name, "runId": run_id, "nodeId": node_id }).to_string()),
    };
    AuditRepository::create(pool, &audit_entry).await.map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(attachment)
}

pub async fn replace_stage_file<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    pool: &SqlitePool,
    workspace_id: &str,
    branch_id: &str,
    actor_user_id: &str,
    attachment_id: &str,
    original_filename: String,
    mime_type: String,
    file_bytes: Vec<u8>,
) -> Result<LabStageAttachmentDb, String> {
    let existing = LabRepository::get_stage_attachment(pool, workspace_id, branch_id, attachment_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Attachment not found")?;

    let sanitized_name = Path::new(&original_filename)
        .file_name()
        .and_then(|s| s.to_str())
        .ok_or("Invalid filename")?;

    let att_dir = get_attachments_dir(app)?.join(&existing.run_id).join(&existing.node_id);
    if !att_dir.exists() {
        fs::create_dir_all(&att_dir).map_err(|e| e.to_string())?;
    }

    let stored_filename = format!("{}_{}", existing.id, sanitized_name);
    let file_path = att_dir.join(stored_filename);

    if Path::new(&existing.storage_path).exists() {
        let _ = fs::remove_file(&existing.storage_path);
    }

    fs::write(&file_path, &file_bytes).map_err(|e| e.to_string())?;
    let file_size = file_bytes.len() as i64;
    let now = chrono::Utc::now().to_rfc3339();

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    LabRepository::delete_stage_attachment(&mut *tx, workspace_id, branch_id, attachment_id).await.map_err(|e| e.to_string())?;

    let updated = LabStageAttachmentDb {
        id: existing.id.clone(),
        workspace_id: workspace_id.to_string(),
        branch_id: branch_id.to_string(),
        run_id: existing.run_id.clone(),
        node_id: existing.node_id.clone(),
        sample_id: existing.sample_id.clone(),
        original_filename: sanitized_name.to_string(),
        storage_path: file_path.to_string_lossy().to_string(),
        mime_type,
        file_size,
        uploaded_by: actor_user_id.to_string(),
        created_at: existing.created_at,
        updated_at: now.clone(),
    };

    LabRepository::create_stage_attachment(&mut *tx, &updated).await.map_err(|e| e.to_string())?;

    let audit_entry = AuditLogEntry {
        id: format!("audit_{}", uuid::Uuid::new_v4()),
        workspace_id: workspace_id.to_string(),
        branch_id: branch_id.to_string(),
        created_at: now.clone(),
        action: "lab_attachment_replaced".to_string(),
        performed_by_user_id: Some(actor_user_id.to_string()),
        target_entity_type: "lab_stage_attachment".to_string(),
        target_entity_id: existing.id.clone(),
        metadata: Some(serde_json::json!({ "filename": sanitized_name }).to_string()),
    };
    AuditRepository::create(pool, &audit_entry).await.map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(updated)
}

pub async fn remove_stage_file(
    pool: &SqlitePool,
    workspace_id: &str,
    branch_id: &str,
    actor_user_id: &str,
    attachment_id: &str,
) -> Result<(), String> {
    let existing = LabRepository::get_stage_attachment(pool, workspace_id, branch_id, attachment_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Attachment not found")?;

    if Path::new(&existing.storage_path).exists() {
        let _ = fs::remove_file(&existing.storage_path);
    }

    let now = chrono::Utc::now().to_rfc3339();
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    LabRepository::delete_stage_attachment(&mut *tx, workspace_id, branch_id, attachment_id).await.map_err(|e| e.to_string())?;

    let audit_entry = AuditLogEntry {
        id: format!("audit_{}", uuid::Uuid::new_v4()),
        workspace_id: workspace_id.to_string(),
        branch_id: branch_id.to_string(),
        created_at: now,
        action: "lab_attachment_removed".to_string(),
        performed_by_user_id: Some(actor_user_id.to_string()),
        target_entity_type: "lab_stage_attachment".to_string(),
        target_entity_id: attachment_id.to_string(),
        metadata: Some(serde_json::json!({ "filename": existing.original_filename }).to_string()),
    };
    AuditRepository::create(pool, &audit_entry).await.map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

// EXECUTION EXPORT & IMPORT
pub async fn export_execution_run(
    pool: &SqlitePool,
    workspace_id: &str,
    branch_id: &str,
    run_id: &str,
    destination_path: &str,
) -> Result<(), String> {
    let run = LabRepository::get_workflow_run(pool, workspace_id, branch_id, run_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Workflow run not found")?;

    let steps = LabRepository::list_workflow_run_steps(pool, workspace_id, branch_id, run_id)
        .await
        .map_err(|e| e.to_string())?;

    let attachments = LabRepository::list_all_stage_attachments_for_run(pool, workspace_id, branch_id, run_id)
        .await
        .map_err(|e| e.to_string())?;

    let reports = sqlx::query_as::<_, LabReport>(
        "SELECT * FROM lab_report WHERE workspace_id = ? AND branch_id = ? AND order_id = ?"
    )
    .bind(workspace_id)
    .bind(branch_id)
    .bind(&run.order_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let results = sqlx::query_as::<_, LabResult>(
        "SELECT * FROM lab_result WHERE workspace_id = ? AND branch_id = ? AND lab_order_id = ?"
    )
    .bind(workspace_id)
    .bind(branch_id)
    .bind(&run.order_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let audit_events = sqlx::query_as::<_, AuditLogEntry>(
        "SELECT * FROM audit_log WHERE workspace_id = ? AND branch_id = ? ORDER BY created_at DESC LIMIT 50"
    )
    .bind(workspace_id)
    .bind(branch_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let manifest = WorkflowExecutionExportManifest {
        format_version: "1.0".to_string(),
        exported_at: chrono::Utc::now().to_rfc3339(),
        workspace_id: workspace_id.to_string(),
        branch_id: branch_id.to_string(),
        run,
        steps,
        attachments,
        reports,
        results,
        audit_events,
    };

    let content = serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?;
    fs::write(destination_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn import_execution_commit(
    pool: &SqlitePool,
    workspace_id: &str,
    branch_id: &str,
    actor_user_id: &str,
    json_content: &str,
    conflict_strategy: &str, // "skip", "overwrite", "create_new"
) -> Result<LabWorkflowRunDb, String> {
    let manifest: WorkflowExecutionExportManifest = serde_json::from_str(json_content).map_err(|e| e.to_string())?;
    if manifest.format_version != "1.0" {
        return Err("Incompatible schema version in execution manifest".into());
    }

    let mut run = manifest.run;
    let existing = LabRepository::get_workflow_run(pool, workspace_id, branch_id, &run.id)
        .await
        .map_err(|e| e.to_string())?;

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();

    if existing.is_some() {
        if conflict_strategy == "skip" {
            return Ok(existing.unwrap());
        } else if conflict_strategy == "create_new" {
            run.id = format!("wfrun_{}", uuid::Uuid::new_v4());
        } else if conflict_strategy == "overwrite" {
            // Delete existing steps and run
            sqlx::query("DELETE FROM lab_workflow_run_step WHERE workspace_id = ? AND branch_id = ? AND run_id = ?")
                .bind(workspace_id).bind(branch_id).bind(&run.id)
                .execute(&mut *tx).await.map_err(|e| e.to_string())?;
            sqlx::query("DELETE FROM lab_workflow_run WHERE workspace_id = ? AND branch_id = ? AND id = ?")
                .bind(workspace_id).bind(branch_id).bind(&run.id)
                .execute(&mut *tx).await.map_err(|e| e.to_string())?;
        }
    }

    run.workspace_id = workspace_id.to_string();
    run.branch_id = branch_id.to_string();

    LabRepository::create_workflow_run(&mut *tx, &run).await.map_err(|e| e.to_string())?;

    for mut step in manifest.steps {
        if conflict_strategy == "create_new" {
            step.id = format!("wfstep_{}_{}", uuid::Uuid::new_v4(), step.node_id);
        }
        step.workspace_id = workspace_id.to_string();
        step.branch_id = branch_id.to_string();
        step.run_id = run.id.clone();
        LabRepository::create_workflow_run_step(&mut *tx, &step).await.map_err(|e| e.to_string())?;
    }

    let audit_entry = AuditLogEntry {
        id: format!("audit_{}", uuid::Uuid::new_v4()),
        workspace_id: workspace_id.to_string(),
        branch_id: branch_id.to_string(),
        created_at: now,
        action: "lab_execution_imported".to_string(),
        performed_by_user_id: Some(actor_user_id.to_string()),
        target_entity_type: "lab_workflow_run".to_string(),
        target_entity_id: run.id.clone(),
        metadata: Some(serde_json::json!({ "strategy": conflict_strategy, "importedRunId": run.id }).to_string()),
    };
    AuditRepository::create(pool, &audit_entry).await.map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(run)
}

// REPORT EXPORT
pub async fn export_lab_report_record_text(
    pool: &SqlitePool,
    workspace_id: &str,
    branch_id: &str,
    report_id: &str,
) -> Result<String, String> {
    let report = sqlx::query_as::<_, LabReport>(
        "SELECT * FROM lab_report WHERE workspace_id = ? AND branch_id = ? AND id = ?"
    )
    .bind(workspace_id)
    .bind(branch_id)
    .bind(report_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?
    .ok_or("Lab report not found")?;

    let results = sqlx::query_as::<_, LabResult>(
        "SELECT r.* FROM lab_result r JOIN lab_report_item i ON r.id = i.result_id WHERE i.report_id = ?"
    )
    .bind(report_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let mut record = format!(
        "========================================\n\
         LABORATORY CLINICAL REPORT RECORD\n\
         ========================================\n\
         Report ID: {}\n\
         Order ID: {}\n\
         Patient ID: {}\n\
         Status: {}\n\
         Version: {}\n\
         Prepared By: {}\n\
         Finalized By: {:?}\n\
         Finalized At: {:?}\n\
         Summary Note: {:?}\n\
         Created At: {}\n\
         ----------------------------------------\n\
         RESULTS:\n",
        report.id, report.order_id, report.patient_id, report.status, report.version,
        report.prepared_by, report.finalized_by, report.finalized_at, report.summary_note, report.created_at
    );

    for res in results {
        record.push_str(&format!(
            "  - Result ID: {}\n    Value: {}\n    Reference Range: {:?}\n    Out of Range: {}\n    Entered By: {}\n    Timestamp: {}\n",
            res.id, res.value, res.reference_range, res.is_out_of_range, res.entered_by_user_id, res.created_at
        ));
    }
    record.push_str("========================================\n");

    Ok(record)
}
