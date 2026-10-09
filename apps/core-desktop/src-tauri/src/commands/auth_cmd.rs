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

    let pin_set = if let Some(ref s) = *session_guard {
        let cred = crate::repositories::credential_repo::CredentialRepository::get_by_user_id(&state.pool, &s.user_id)
            .await
            .ok()
            .flatten();
        cred.and_then(|c| c.pin_hash).map(|h| !h.is_empty()).unwrap_or(false)
    } else {
        false
    };

    let session_with_pin = session_info.map(|mut val| {
        val["pinSet"] = serde_json::json!(pin_set);
        val
    });

    Ok(serde_json::json!({
        "deviceBound": bound_device.is_some(),
        "business": business,
        "session": session_with_pin,
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
pub async fn auth_set_pin(state: State<'_, AppState>, pin: String) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    engine.set_pin(&pin).await.map_err(|e| e.to_response())
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

#[tauri::command]
pub async fn auth_change_password(state: State<'_, AppState>, old_password: String, new_password: String) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    engine.change_password(&old_password, &new_password).await.map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn auth_change_pin(state: State<'_, AppState>, old_pin: String, new_pin: String) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    engine.change_pin(&old_pin, &new_pin).await.map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn auth_reset_own_pin(state: State<'_, AppState>, password: String, new_pin: String) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    engine.reset_own_pin(&password, &new_pin).await.map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn recovery_regenerate(state: State<'_, AppState>, password: String) -> Result<Vec<String>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    engine.recovery_regenerate(&password).await.map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn recovery_generate_initial(state: State<'_, AppState>) -> Result<Vec<String>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    engine.recovery_generate_initial().await.map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn onboarding_advance(state: State<'_, AppState>, state_name: String) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    engine.onboarding_advance(&state_name).await.map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn business_set_idle_lock(state: State<'_, AppState>, minutes: i64) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    engine.business_set_idle_lock(minutes).await.map_err(|e| e.to_response())
}
