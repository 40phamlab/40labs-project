use tauri::State;
use zeroize::Zeroizing;

use crate::auth::session::ApproverInfo;
use crate::auth::{AuthEngine, AuthErrorResponse};
use crate::AppState;

#[tauri::command]
pub async fn auth_status(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, AuthErrorResponse> {
    let session_guard = state.auth_state.session.read().await;
    let session_info = if let Some(ref s) = *session_guard {
        let user = crate::repositories::user_repo::UserRepository::get_by_id(&state.pool, &s.user_id)
            .await
            .ok()
            .flatten();
        let display_name = user.as_ref().map(|u| u.full_name.clone()).unwrap_or_default();
        let must_change = user.as_ref().map(|u| u.must_change_credentials != 0).unwrap_or(false);

        Some(serde_json::json!({
            "userId": s.user_id,
            "displayName": display_name,
            "role": s.role,
            "locked": s.locked,
            "mustChangeCredentials": must_change,
        }))
    } else {
        None
    };

    let business = crate::repositories::business_repo::BusinessRepository::get(&state.pool)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    let bound_device =
        crate::repositories::device_binding_repo::DeviceBindingRepository::get_active_device(
            &state.pool,
        )
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    let (pin_set, has_recovery_codes) = if let Some(ref s) = *session_guard {
        let cred = crate::repositories::credential_repo::CredentialRepository::get_by_user_id(
            &state.pool,
            &s.user_id,
        )
        .await
        .ok()
        .flatten();
        let pin_set = cred
            .and_then(|c| c.pin_hash)
            .map(|h| !h.is_empty())
            .unwrap_or(false);
        let has_recovery_codes =
            crate::repositories::recovery_repo::RecoveryRepository::get_active_by_user(
                &state.pool,
                &s.user_id,
            )
            .await
            .map(|codes| !codes.is_empty())
            .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;
        (pin_set, has_recovery_codes)
    } else {
        (false, false)
    };

    let session_with_pin = session_info.map(|mut val| {
        val["pinSet"] = serde_json::json!(pin_set);
        val["hasRecoveryCodes"] = serde_json::json!(has_recovery_codes);
        val
    });

    Ok(serde_json::json!({
        "deviceBound": bound_device.is_some(),
        "business": business,
        "session": session_with_pin,
    }))
}

#[tauri::command]
pub async fn auth_login(
    state: State<'_, AppState>,
    username: String,
    password: String,
) -> Result<(), AuthErrorResponse> {
    let pwd = Zeroizing::new(password);
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    engine
        .login(&username, &pwd)
        .await
        .map_err(|e| e.to_response())
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
pub async fn auth_unlock_pin(
    state: State<'_, AppState>,
    pin: String,
) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    engine.unlock_pin(&pin).await.map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn auth_set_pin(
    state: State<'_, AppState>,
    pin: String,
) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
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
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    engine
        .step_up(&permission, &pin, approver_user_id, target)
        .await
        .map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn auth_list_approvers(
    state: State<'_, AppState>,
) -> Result<Vec<ApproverInfo>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    engine.list_approvers().await.map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn auth_change_password(
    state: State<'_, AppState>,
    old_password: String,
    new_password: String,
) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    engine
        .change_password(&old_password, &new_password)
        .await
        .map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn auth_change_pin(
    state: State<'_, AppState>,
    old_pin: String,
    new_pin: String,
) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    engine
        .change_pin(&old_pin, &new_pin)
        .await
        .map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn auth_reset_own_pin(
    state: State<'_, AppState>,
    password: String,
    new_pin: String,
) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    engine
        .reset_own_pin(&password, &new_pin)
        .await
        .map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn recovery_regenerate(
    state: State<'_, AppState>,
    password: String,
) -> Result<Vec<String>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    engine
        .recovery_regenerate(&password)
        .await
        .map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn recovery_generate_initial(
    state: State<'_, AppState>,
) -> Result<Vec<String>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    engine
        .recovery_generate_initial()
        .await
        .map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn onboarding_advance(
    state: State<'_, AppState>,
    state_name: String,
) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    engine
        .onboarding_advance(&state_name)
        .await
        .map_err(|e| e.to_response())
}

#[tauri::command]
pub async fn business_set_idle_lock(
    state: State<'_, AppState>,
    minutes: i64,
) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    engine
        .business_set_idle_lock(minutes)
        .await
        .map_err(|e| e.to_response())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::auth::session::{AuthState, RealClock};
    use std::sync::Arc;

    #[tokio::test]
    async fn test_auth_status_session_fields() {
        let pool = crate::db::init_db_pool_with_url("sqlite::memory:")
            .await
            .unwrap();

        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query(
            r#"
            INSERT INTO business (id, workspace_id, branch_id, business_id, name, contact_mobile, idle_lock_minutes, created_at, updated_at)
            VALUES ('bus_1', 'ws_1', 'br_1', 'AFYA-0001', 'Test Pharmacy', '+255712345678', 5, ?, ?)
            "#,
        )
        .bind(&now)
        .bind(&now)
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            r#"
            INSERT INTO app_user (id, workspace_id, branch_id, username, first_name, last_name, full_name, role, role_preset, active, must_change_credentials, created_at, updated_at)
            VALUES ('user_1', 'ws_1', 'br_1', 'testuser', 'Test', 'User', 'Test User', 'staff', 'staff', 1, 1, ?, ?)
            "#,
        )
        .bind(&now)
        .bind(&now)
        .execute(&pool)
        .await
        .unwrap();

        let auth_state = Arc::new(AuthState::new(Arc::new(RealClock)));
        {
            let mut s = auth_state.session.write().await;
            *s = Some(crate::auth::session::Session {
                user_id: "user_1".to_string(),
                workspace_id: "ws_1".to_string(),
                branch_id: "br_1".to_string(),
                role: "staff".to_string(),
                started_at: 0,
                last_activity: 0,
                locked: false,
            });
        }

        let lan_state = Arc::new(crate::services::lan::LanServerState::new(pool.clone(), 0));
        let (otp_client, activation_client) = crate::activation::client::ActivationClientFactory::create_clients(Some("http://localhost".to_string()), None);
        let _state = AppState {
            pool: pool.clone(),
            lan_state,
            auth_state,
            keystore: Arc::new(crate::security::keystore::Keystore::init().unwrap()),
            otp_client,
            activation_client,
        };

        let user = crate::repositories::user_repo::UserRepository::get_by_id(&pool, "user_1")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(user.full_name, "Test User");
        assert_eq!(user.must_change_credentials, 1);

        let business = crate::repositories::business_repo::BusinessRepository::get(&pool)
            .await
            .unwrap();
        assert_eq!(business.unwrap().name, "Test Pharmacy");
    }
}

