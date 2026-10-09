use tauri::State;
use crate::db::AppState;
use crate::models::auth::AppUser;
use crate::repositories::user_repo::UserRepository;
use crate::auth::{AuthEngine, AuthErrorResponse, AuthError};

#[tauri::command]
pub async fn user_list(state: State<'_, AppState>) -> Result<Vec<AppUser>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let _ctx = engine.require("users.manage").await.map_err(|e| e.to_response())?;
    UserRepository::list(&state.pool)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn user_create(state: State<'_, AppState>, payload: serde_json::Value) -> Result<AppUser, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("users.manage").await.map_err(|e| e.to_response())?;

    let now = chrono::Utc::now().to_rfc3339();
    let id = format!("user_{}", uuid::Uuid::new_v4().simple());
    let username = payload.get("username").and_then(|v| v.as_str()).unwrap_or("user").to_string();
    let first_name = payload.get("firstName").and_then(|v| v.as_str()).unwrap_or("New").to_string();
    let last_name = payload.get("lastName").and_then(|v| v.as_str()).unwrap_or("User").to_string();
    let full_name = crate::models::auth::format_full_name(&first_name, &last_name);
    let role = payload.get("role").and_then(|v| v.as_str()).unwrap_or("staff").to_string();
    let role_preset = payload.get("rolePreset").and_then(|v| v.as_str()).unwrap_or("pharmacist").to_string();

    let user = AppUser {
        id: id.clone(),
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        username,
        first_name,
        last_name,
        full_name,
        phone: payload.get("phone").and_then(|v| v.as_str()).map(String::from),
        role,
        role_preset,
        is_superintendent: 0,
        active: 1,
        owner_id: None,
        must_change_credentials: 1,
        last_login_at: None,
        created_by_user_id: Some(ctx.user_id.clone()),
        created_at: now.clone(),
        updated_at: now.clone(),
    };

    let mut tx = state.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;
    UserRepository::create(&mut tx, &user).await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    let password_hash = crate::security::hashing::hash_password("Temporary123!").map_err(|e| AuthError::InternalError(e.to_string()).to_response())?;
    let cred = crate::models::auth::UserCredential {
        user_id: id.clone(),
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        password_hash,
        pin_hash: None,
        failed_password_attempts: 0,
        failed_pin_attempts: 0,
        locked_until: None,
        password_changed_at: Some(now.clone()),
        pin_changed_at: None,
        created_at: now.clone(),
        updated_at: now.clone(),
    };
    crate::repositories::credential_repo::CredentialRepository::create(&mut tx, &cred).await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;
    tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(user)
}

#[tauri::command]
pub async fn user_update(state: State<'_, AppState>, user_id: String, payload: serde_json::Value) -> Result<AppUser, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let _ctx = engine.require("users.manage").await.map_err(|e| e.to_response())?;

    let now = chrono::Utc::now().to_rfc3339();
    let first_name = payload.get("firstName").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let last_name = payload.get("lastName").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let full_name = crate::models::auth::format_full_name(&first_name, &last_name);
    let phone = payload.get("phone").and_then(|v| v.as_str());
    let role_preset = payload.get("rolePreset").and_then(|v| v.as_str()).unwrap_or("pharmacist");

    let mut tx = state.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;
    UserRepository::update_profile(&mut tx, &user_id, &first_name, &last_name, &full_name, phone, role_preset, &now)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;
    tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    let user = UserRepository::get_by_id(&state.pool, &user_id)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| AuthError::NotFound("User not found".to_string()).to_response())?;

    Ok(user)
}

#[tauri::command]
pub async fn user_set_active(state: State<'_, AppState>, user_id: String, active: bool) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let _ctx = engine.require("users.manage").await.map_err(|e| e.to_response())?;

    let now = chrono::Utc::now().to_rfc3339();
    let active_i64 = if active { 1 } else { 0 };

    let mut tx = state.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;
    UserRepository::update_active(&mut tx, &user_id, active_i64, &now)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;
    tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(())
}

#[tauri::command]
pub async fn user_reset_credentials(state: State<'_, AppState>, user_id: String) -> Result<String, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let _ctx = engine.require("users.manage").await.map_err(|e| e.to_response())?;

    let temp_pass = format!("Temp{}!", uuid::Uuid::new_v4().simple().to_string().chars().take(8).collect::<String>());
    let pwd_hash = crate::security::hashing::hash_password(&temp_pass).map_err(|e| AuthError::InternalError(e.to_string()).to_response())?;
    let now = chrono::Utc::now().to_rfc3339();

    let mut tx = state.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;
    crate::repositories::credential_repo::CredentialRepository::update_password(&mut tx, &user_id, &pwd_hash, &now)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    sqlx::query("UPDATE app_user SET must_change_credentials = 1, updated_at = ? WHERE id = ?")
        .bind(&now)
        .bind(&user_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(temp_pass)
}
