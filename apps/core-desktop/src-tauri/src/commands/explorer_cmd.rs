use crate::auth::{AuthEngine, AuthErrorResponse};
use crate::db::AppState;
use crate::services::explorer_service::{self, ExplorerDirectoryContent};
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn explorer_get_default_dir(
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<String, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _session = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    explorer_service::get_default_directory(&app)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn explorer_read_dir(
    state: State<'_, AppState>,
    path: String,
) -> Result<ExplorerDirectoryContent, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _session = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    explorer_service::read_directory(&path)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn explorer_read_file_text(
    state: State<'_, AppState>,
    path: String,
    max_bytes: Option<u64>,
) -> Result<String, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _session = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    explorer_service::read_file_text(&path, max_bytes)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn explorer_create_dir(
    state: State<'_, AppState>,
    parent_path: String,
    name: String,
) -> Result<String, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _session = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    explorer_service::create_directory(&parent_path, &name)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn explorer_rename_path(
    state: State<'_, AppState>,
    old_path: String,
    new_name: String,
) -> Result<String, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _session = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    explorer_service::rename_path(&old_path, &new_name)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn explorer_copy_file(
    state: State<'_, AppState>,
    source_path: String,
    target_dir: String,
) -> Result<String, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _session = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    explorer_service::copy_file(&source_path, &target_dir)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn explorer_delete_path(
    state: State<'_, AppState>,
    path: String,
) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _session = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    explorer_service::delete_path(&path)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn explorer_reveal_in_file_manager(
    state: State<'_, AppState>,
    app: AppHandle,
    path: String,
) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _session = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    explorer_service::reveal_in_file_manager(&app, &path)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}
