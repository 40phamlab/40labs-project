use tauri::{AppHandle, State};
use crate::auth::{AuthEngine, AuthErrorResponse};
use crate::db::AppState;
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

    // Check if draft exists for test_id
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
