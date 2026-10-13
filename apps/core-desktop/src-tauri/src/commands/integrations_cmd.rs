use crate::auth::{AuthEngine, AuthErrorResponse};
use crate::db::AppState;
use crate::models::integrations::{IntegrationsConfig, UpdateIntegrationsPayload};
use crate::repositories::integrations_repo::IntegrationsRepository;
use tauri::State;

#[tauri::command]
pub async fn get_integrations_config(
    state: State<'_, AppState>,
) -> Result<IntegrationsConfig, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    IntegrationsRepository::get(&state.pool, &ctx.workspace_id, &ctx.branch_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn update_integrations_config(
    state: State<'_, AppState>,
    payload: UpdateIntegrationsPayload,
) -> Result<IntegrationsConfig, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    IntegrationsRepository::update(&state.pool, &ctx.workspace_id, &ctx.branch_id, payload)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}
