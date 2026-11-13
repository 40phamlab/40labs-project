use crate::{
    auth::{AuthEngine, AuthError, AuthErrorResponse},
    db::AppState,
    sync::engine::{self, SyncRunResult, SyncStatus},
};
use tauri::State;

#[tauri::command]
pub async fn cloud_sync_now(
    state: State<'_, AppState>,
) -> Result<SyncRunResult, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    let api_base_url =
        std::env::var("API_BASE_URL").unwrap_or_else(|_| "http://127.0.0.1:3000".into());
    engine::sync_once(&state.pool, &api_base_url, &state.activation_client)
        .await
        .map_err(|message| AuthError::InternalError(message).to_response())
}

#[tauri::command]
pub async fn cloud_sync_status(
    state: State<'_, AppState>,
) -> Result<SyncStatus, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    engine::status(&state.pool)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())
}
