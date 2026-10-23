use tauri::{AppHandle, State};
use crate::auth::{AuthEngine, AuthErrorResponse};
use crate::db::AppState;
use crate::models::lab::{LabWorkflowRunDb, LabWorkflowRunStepDb, LabStageAttachmentDb};
use crate::repositories::lab_repo::LabRepository;
use crate::services::workflow_service::{self, WorkflowTemplateFile};

#[tauri::command]
pub async fn get_workflow_templates(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<Vec<WorkflowTemplateFile>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    workflow_service::list_workflows(&app)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn save_workflow_draft(
    app: AppHandle,
    state: State<'_, AppState>,
    test_id: Option<String>,
    graph_json: String,
) -> Result<WorkflowTemplateFile, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.order")
        .await
        .map_err(|e| e.to_response())?;

    let workflows = workflow_service::list_workflows(&app)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())?;

    let now = chrono::Utc::now().to_rfc3339();

    let existing_draft = workflows.iter().find(|w| w.test_id == test_id && w.status == "draft");

    let template = if let Some(draft) = existing_draft {
        WorkflowTemplateFile {
            graph_json,
            updated_at: now,
            ..draft.clone()
        }
    } else {
        let latest_version = workflows
            .iter()
            .filter(|w| w.test_id == test_id)
            .map(|w| w.version)
            .max()
            .unwrap_or(0);

        WorkflowTemplateFile {
            id: format!("wf_{}", uuid::Uuid::new_v4()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            test_id,
            version: latest_version + 1,
            graph_json,
            is_default: false,
            status: "draft".to_string(),
            created_at: now.clone(),
            updated_at: now,
        }
    };

    workflow_service::save_workflow(&app, template)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn publish_workflow_template(
    app: AppHandle,
    state: State<'_, AppState>,
    template_id: String,
) -> Result<WorkflowTemplateFile, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _ctx = engine
        .require("lab.result.enter")
        .await
        .map_err(|e| e.to_response())?;

    workflow_service::publish_workflow(&app, template_id)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn export_workflow_template(
    app: AppHandle,
    state: State<'_, AppState>,
    template_id: String,
    destination_path: String,
) -> Result<bool, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    workflow_service::export_workflow(&app, template_id, destination_path)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())?;
    Ok(true)
}

#[tauri::command]
pub async fn import_workflow_template(
    app: AppHandle,
    state: State<'_, AppState>,
    json_content: String,
) -> Result<WorkflowTemplateFile, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _ctx = engine
        .require("lab.order")
        .await
        .map_err(|e| e.to_response())?;

    workflow_service::import_workflow(&app, json_content)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn start_workflow_execution(
    app: AppHandle,
    state: State<'_, AppState>,
    order_id: String,
    template_id: String,
) -> Result<(LabWorkflowRunDb, Vec<LabWorkflowRunStepDb>), AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.order")
        .await
        .map_err(|e| e.to_response())?;

    workflow_service::start_execution(&app, &state.pool, &ctx.workspace_id, &ctx.branch_id, &order_id, &template_id)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn complete_workflow_step_execution(
    state: State<'_, AppState>,
    run_id: String,
    node_id: String,
    notes: Option<String>,
    measurements_json: Option<String>,
) -> Result<(LabWorkflowRunDb, Vec<LabWorkflowRunStepDb>), AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.result.enter")
        .await
        .map_err(|e| e.to_response())?;

    workflow_service::complete_step(
        &state.pool,
        &ctx.workspace_id,
        &ctx.branch_id,
        &run_id,
        &node_id,
        &ctx.user_id,
        notes,
        measurements_json,
    )
    .await
    .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn get_workflow_execution(
    state: State<'_, AppState>,
    order_id: String,
) -> Result<Option<(LabWorkflowRunDb, Vec<LabWorkflowRunStepDb>)>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    let run = LabRepository::get_workflow_run_by_order(&state.pool, &ctx.workspace_id, &ctx.branch_id, &order_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    if let Some(r) = run {
        let steps = LabRepository::list_workflow_run_steps(&state.pool, &ctx.workspace_id, &ctx.branch_id, &r.id)
            .await
            .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;
        Ok(Some((r, steps)))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn attach_stage_attachment(
    app: AppHandle,
    state: State<'_, AppState>,
    run_id: String,
    node_id: String,
    sample_id: Option<String>,
    original_filename: String,
    mime_type: String,
    file_bytes: Vec<u8>,
) -> Result<LabStageAttachmentDb, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.result.enter")
        .await
        .map_err(|e| e.to_response())?;

    workflow_service::attach_stage_file(
        &app,
        &state.pool,
        &ctx.workspace_id,
        &ctx.branch_id,
        &ctx.user_id,
        &run_id,
        &node_id,
        sample_id,
        original_filename,
        mime_type,
        file_bytes,
    )
    .await
    .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn get_stage_attachments(
    state: State<'_, AppState>,
    run_id: String,
    node_id: String,
) -> Result<Vec<LabStageAttachmentDb>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    LabRepository::list_stage_attachments(&state.pool, &ctx.workspace_id, &ctx.branch_id, &run_id, &node_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn replace_stage_attachment(
    app: AppHandle,
    state: State<'_, AppState>,
    attachment_id: String,
    original_filename: String,
    mime_type: String,
    file_bytes: Vec<u8>,
) -> Result<LabStageAttachmentDb, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.result.enter")
        .await
        .map_err(|e| e.to_response())?;

    workflow_service::replace_stage_file(
        &app,
        &state.pool,
        &ctx.workspace_id,
        &ctx.branch_id,
        &ctx.user_id,
        &attachment_id,
        original_filename,
        mime_type,
        file_bytes,
    )
    .await
    .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn remove_stage_attachment(
    state: State<'_, AppState>,
    attachment_id: String,
) -> Result<bool, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.result.enter")
        .await
        .map_err(|e| e.to_response())?;

    workflow_service::remove_stage_file(
        &state.pool,
        &ctx.workspace_id,
        &ctx.branch_id,
        &ctx.user_id,
        &attachment_id,
    )
    .await
    .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())?;
    Ok(true)
}

#[tauri::command]
pub async fn export_workflow_execution(
    state: State<'_, AppState>,
    run_id: String,
    destination_path: String,
) -> Result<bool, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    workflow_service::export_execution_run(
        &state.pool,
        &ctx.workspace_id,
        &ctx.branch_id,
        &run_id,
        &destination_path,
    )
    .await
    .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())?;
    Ok(true)
}

#[tauri::command]
pub async fn import_workflow_execution(
    state: State<'_, AppState>,
    json_content: String,
    conflict_strategy: String,
) -> Result<LabWorkflowRunDb, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.order")
        .await
        .map_err(|e| e.to_response())?;

    workflow_service::import_execution_commit(
        &state.pool,
        &ctx.workspace_id,
        &ctx.branch_id,
        &ctx.user_id,
        &json_content,
        &conflict_strategy,
    )
    .await
    .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn export_lab_report_record(
    state: State<'_, AppState>,
    report_id: String,
) -> Result<String, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    workflow_service::export_lab_report_record_text(
        &state.pool,
        &ctx.workspace_id,
        &ctx.branch_id,
        &report_id,
    )
    .await
    .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}
