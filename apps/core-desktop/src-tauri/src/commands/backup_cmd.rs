use crate::auth::{AuthEngine, AuthErrorResponse};
use crate::db::AppState;
use crate::services::disaster_recovery::{
    self, BackupPreview, ExportResult, RestoreResult,
};
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn export_disaster_recovery_pack(
    app: AppHandle,
    state: State<'_, AppState>,
    destination_path: String,
    password: String,
) -> Result<ExportResult, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let session = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    disaster_recovery::export_disaster_recovery_pack(
        &app,
        &state.pool,
        &destination_path,
        &password,
        Some(session.user_id),
    )
    .await
    .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn preview_disaster_recovery_pack(
    state: State<'_, AppState>,
    archive_path: String,
    password: String,
) -> Result<BackupPreview, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _session = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    disaster_recovery::preview_disaster_recovery_pack(&state.pool, &archive_path, &password)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn restore_disaster_recovery_pack(
    app: AppHandle,
    state: State<'_, AppState>,
    archive_path: String,
    password: String,
) -> Result<RestoreResult, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let session = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    disaster_recovery::restore_disaster_recovery_pack(
        &app,
        &state,
        &archive_path,
        &password,
        Some(session.user_id),
    )
    .await
    .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}
