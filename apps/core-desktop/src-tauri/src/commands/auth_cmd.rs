use tauri::State;
use zeroize::Zeroizing;

use crate::auth::session::ApproverInfo;
use crate::auth::{AuthEngine, AuthErrorResponse};
use crate::AppState;

#[tauri::command]
pub async fn auth_status(state: State<'_, AppState>) -> Result<serde_json::Value, AuthErrorResponse> {
    let session_guard = state.auth_state.session.read().await;
    let session_info = session_guard.as_ref().map(|s| serde_json::json!({
        "userId": s.user_id,
        "role": s.role,
        "locked": s.locked,
    }));

    let business = crate::repositories::business_repo::BusinessRepository::get(&state.pool)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    let bound_device = crate::repositories::device_binding_repo::DeviceBindingRepository::get_active_device(&state.pool)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(serde_json::json!({
        "deviceBound": bound_device.is_some(),
        "business": business,
        "session": session_info,
    }))
}

#[tauri::command]
pub async fn auth_login(state: State<'_, AppState>, username: String, password: String) -> Result<(), AuthErrorResponse> {
    let pwd = Zeroizing::new(password);
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    engine.login(&username, &pwd).await.map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn auth_logout(state: State<'_, AppState>) -> Result<(), AuthErrorResponse> {
    let mut session_guard = state.auth_state.session.write().await;
    *session_guard = None;
    Ok(())
}

#[tauri::command]
pub async fn auth_lock(state: State<'_, AppState>) -> Result<(), AuthErrorResponse> {
    let mut session_guard = state.auth_state.session.write().await;
    if let Some(s) = session_guard.as_mut() {
        s.locked = true;
    }
    Ok(())
}

#[tauri::command]
pub async fn auth_unlock_pin(state: State<'_, AppState>, pin: String) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    engine.unlock_pin(&pin).await.map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn auth_step_up(
    state: State<'_, AppState>,
    permission: String,
    pin: String,
    approver_user_id: Option<String>,
    target: Option<String>,
) -> Result<String, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    engine.step_up(&permission, &pin, approver_user_id, target).await.map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn auth_list_approvers(state: State<'_, AppState>) -> Result<Vec<ApproverInfo>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    engine.list_approvers().await.map_err(|e| e.to_response())
}
