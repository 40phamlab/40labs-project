use crate::auth::{AuthError, AuthErrorResponse};
use crate::auth::totp::{generate_new_totp, encrypt_secret, decrypt_secret, verify_totp};
use crate::repositories::totp_repo::TotpRepository;
use crate::repositories::user_repo::UserRepository;
use crate::repositories::credential_repo::CredentialRepository;
use crate::AppState;
use tauri::State;
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TotpBeginResponse {
    pub uri: String,
    pub secret: String,
}

#[tauri::command]
pub async fn auth_totp_begin(
    state: State<'_, AppState>,
) -> Result<TotpBeginResponse, AuthErrorResponse> {
    let session_guard = state.auth_state.session.read().await;
    let session = session_guard.as_ref().ok_or(AuthError::SessionRequired.to_response())?;
    let user_id = session.user_id.clone();
    drop(session_guard);

    let user = UserRepository::get_by_id(&state.pool, &user_id)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| AuthError::SessionRequired.to_response())?;

    let business = crate::repositories::business_repo::BusinessRepository::get(&state.pool)
        .await
        .ok()
        .flatten();
    let biz_name = business.map(|b| b.name).unwrap_or_else(|| "40Labs".to_string());
    let account_label = format!("{}@{}", user.username, biz_name);

    let (base32_secret, uri, _) = generate_new_totp(&account_label, "40Labs")
        .map_err(|e| AuthError::InternalError(e).to_response())?;

    let encryption_key = state.keystore.derive_key(b"totp_secret_v1");
    let secret_enc = encrypt_secret(&base32_secret, &encryption_key)
        .map_err(|e| AuthError::InternalError(e).to_response())?;

    let now = chrono::Utc::now().to_rfc3339();
    TotpRepository::upsert_pending(
        &state.pool,
        &user_id,
        &user.workspace_id,
        &user.branch_id,
        &secret_enc,
        &now,
    )
    .await
    .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(TotpBeginResponse {
        uri,
        secret: base32_secret,
    })
}

#[tauri::command]
pub async fn auth_totp_confirm(
    state: State<'_, AppState>,
    code: String,
) -> Result<(), AuthErrorResponse> {
    let session_guard = state.auth_state.session.read().await;
    let session = session_guard.as_ref().ok_or(AuthError::SessionRequired.to_response())?;
    let user_id = session.user_id.clone();
    drop(session_guard);

    let totp_rec = TotpRepository::get_by_user_id(&state.pool, &user_id)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| AuthError::PolicyViolation("TOTP setup not initiated".to_string()).to_response())?;

    let encryption_key = state.keystore.derive_key(b"totp_secret_v1");
    let secret_base32 = decrypt_secret(&totp_rec.secret_enc, &encryption_key)
        .map_err(|e| AuthError::InternalError(e).to_response())?;

    let step = verify_totp(&secret_base32, &code, totp_rec.last_used_step as u64)
        .map_err(|_| AuthError::InvalidCredentials { retry_after_secs: None }.to_response())?;

    let now = chrono::Utc::now().to_rfc3339();
    let mut tx = state.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    TotpRepository::confirm(&state.pool, &user_id, &now)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;
    TotpRepository::update_last_used_step(&state.pool, &user_id, step, &now)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    let audit = crate::models::audit::AuditLogEntry {
        id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
        workspace_id: totp_rec.workspace_id,
        branch_id: totp_rec.branch_id,
        created_at: now.clone(),
        action: "totp_enabled".to_string(),
        performed_by_user_id: Some(user_id.clone()),
        target_entity_type: "AppUser".to_string(),
        target_entity_id: user_id.clone(),
        metadata: None,
    };
    crate::repositories::audit_repo::audit::append(&mut tx, &audit)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;
    tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(())
}

#[tauri::command]
pub async fn auth_totp_disable(
    state: State<'_, AppState>,
    password: String,
    code: String,
) -> Result<(), AuthErrorResponse> {
    let session_guard = state.auth_state.session.read().await;
    let session = session_guard.as_ref().ok_or(AuthError::SessionRequired.to_response())?;
    let user_id = session.user_id.clone();
    drop(session_guard);

    let cred = CredentialRepository::get_by_user_id(&state.pool, &user_id)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| AuthError::NotFound("Credentials not found".to_string()).to_response())?;

    if !crate::security::hashing::verify_password(&password, &cred.password_hash) {
        return Err(AuthError::InvalidCredentials { retry_after_secs: None }.to_response());
    }

    let totp_rec = TotpRepository::get_by_user_id(&state.pool, &user_id)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| AuthError::PolicyViolation("TOTP not configured".to_string()).to_response())?;

    let encryption_key = state.keystore.derive_key(b"totp_secret_v1");
    let secret_base32 = decrypt_secret(&totp_rec.secret_enc, &encryption_key)
        .map_err(|e| AuthError::InternalError(e).to_response())?;

    verify_totp(&secret_base32, &code, totp_rec.last_used_step as u64)
        .map_err(|_| AuthError::InvalidCredentials { retry_after_secs: None }.to_response())?;

    let now = chrono::Utc::now().to_rfc3339();
    let mut tx = state.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    TotpRepository::delete(&state.pool, &user_id)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    let audit = crate::models::audit::AuditLogEntry {
        id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
        workspace_id: totp_rec.workspace_id,
        branch_id: totp_rec.branch_id,
        created_at: now.clone(),
        action: "totp_disabled".to_string(),
        performed_by_user_id: Some(user_id.clone()),
        target_entity_type: "AppUser".to_string(),
        target_entity_id: user_id,
        metadata: None,
    };
    crate::repositories::audit_repo::audit::append(&mut tx, &audit)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;
    tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(())
}

#[tauri::command]
pub async fn auth_totp_status(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, AuthErrorResponse> {
    let session_guard = state.auth_state.session.read().await;
    let session = match session_guard.as_ref() {
        Some(s) => s.user_id.clone(),
        None => return Ok(serde_json::json!({ "enabled": false })),
    };
    drop(session_guard);

    let totp_rec = TotpRepository::get_by_user_id(&state.pool, &session)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    let enabled = totp_rec.map(|r| r.enabled_at.is_some()).unwrap_or(false);
    Ok(serde_json::json!({ "status": if enabled { "enabled" } else { "not_configured" }, "enabled": enabled }))
}
