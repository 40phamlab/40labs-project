use tauri::State;
use crate::db::AppState;
use crate::auth::{AuthErrorResponse, AuthError};
use crate::activation::RegisterRequest;
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistrationResult {
    business_id: String,
    workspace_id: String,
    branch_id: String,
}

fn normalize_tz_phone(input: &str) -> Result<String, AuthErrorResponse> {
    let digits: String = input.chars().filter(char::is_ascii_digit).collect();
    let normalized = if digits.starts_with("255") && digits.len() == 12 {
        digits
    } else if digits.starts_with('0') && digits.len() == 10 {
        format!("255{}", &digits[1..])
    } else if digits.len() == 9 {
        format!("255{digits}")
    } else {
        return Err(AuthError::PolicyViolation("Invalid Tanzanian phone number".into()).to_response());
    };
    if normalized.as_bytes().get(3).is_some_and(|prefix| matches!(prefix, b'6' | b'7')) {
        Ok(normalized)
    } else {
        Err(AuthError::PolicyViolation("Invalid Tanzanian phone number".into()).to_response())
    }
}

#[tauri::command]
pub async fn otp_request(state: State<'_, AppState>, phone: String) -> Result<i64, AuthErrorResponse> {
    let phone = normalize_tz_phone(&phone)?;
    state.otp_client
        .request_otp(&phone)
        .await
        .map_err(|e| AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn otp_verify(state: State<'_, AppState>, phone: String, code: String) -> Result<String, AuthErrorResponse> {
    let phone = normalize_tz_phone(&phone)?;
    if code.len() != 6 || !code.bytes().all(|byte| byte.is_ascii_digit()) {
        return Err(AuthError::PolicyViolation("OTP must be 6 digits".into()).to_response());
    }
    state.otp_client
        .verify_otp(&phone, &code)
        .await
        .map_err(|e| AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn registration_commit(state: State<'_, AppState>, payload: serde_json::Value) -> Result<RegistrationResult, AuthErrorResponse> {
    let verification_token = payload.get("verification_token").and_then(|v| v.as_str()).ok_or_else(|| AuthError::PolicyViolation("Missing verification_token".into()).to_response())?;
    let business_name = payload.get("business_name").and_then(|v| v.as_str()).filter(|s| !s.trim().is_empty()).ok_or_else(|| AuthError::PolicyViolation("Business name is required".into()).to_response())?;
    let owner_first_name = payload.get("owner_first_name").and_then(|v| v.as_str()).filter(|s| !s.trim().is_empty()).ok_or_else(|| AuthError::PolicyViolation("Owner first name is required".into()).to_response())?;
    let owner_last_name = payload.get("owner_last_name").and_then(|v| v.as_str()).filter(|s| !s.trim().is_empty()).ok_or_else(|| AuthError::PolicyViolation("Owner last name is required".into()).to_response())?;
    let owner_email = payload.get("owner_email").and_then(|v| v.as_str()).map(String::from);
    let terms_accepted = payload.get("terms_accepted").and_then(|v| v.as_bool()).unwrap_or(false);
    let terms_version = payload.get("terms_version").and_then(|v| v.as_str()).unwrap_or("v1.0");
    let terms_locale = payload.get("terms_locale").and_then(|v| v.as_str()).unwrap_or("en");
    let terms_text_sha256 = payload.get("terms_text_sha256").and_then(|v| v.as_str()).unwrap_or("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    let owner_phone = normalize_tz_phone(payload.get("owner_phone").and_then(|v| v.as_str()).unwrap_or(""))?;
    let username = payload.get("username").and_then(|v| v.as_str()).filter(|s| regex::Regex::new(r"^[a-z0-9._-]{3,32}$").unwrap().is_match(s)).ok_or_else(|| AuthError::PolicyViolation("Invalid username".into()).to_response())?;
    let password = payload.get("password").and_then(|v| v.as_str()).filter(|s| s.len() >= 12 && s.len() <= 128).ok_or_else(|| AuthError::PolicyViolation("Password must be between 12 and 128 bytes".into()).to_response())?;
    if !terms_accepted {
        return Err(AuthError::PolicyViolation("Terms must be accepted".into()).to_response());
    }

    let reg_req = RegisterRequest {
        verification_token: verification_token.to_string(),
        business_name: business_name.to_string(),
        owner_first_name: owner_first_name.to_string(),
        owner_last_name: owner_last_name.to_string(),
        owner_email,
        terms_accepted,
        terms_version: terms_version.to_string(),
        terms_locale: terms_locale.to_string(),
        terms_text_sha256: terms_text_sha256.to_string(),
    };

    let reg_resp = state.activation_client
        .register(reg_req)
        .await
        .map_err(|e| AuthError::InternalError(e).to_response())?;

    let now = chrono::Utc::now().to_rfc3339();
    let mut tx = state.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    sqlx::query(
        r#"
        INSERT INTO business (id, workspace_id, branch_id, business_id, name, contact_mobile, onboarding_state, terms_accepted_at, terms_version, terms_locale, terms_text_sha256, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'owner_first_login', ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(format!("biz_{}", uuid::Uuid::new_v4().simple()))
    .bind(&reg_resp.workspace_id)
    .bind(&reg_resp.branch_id)
    .bind(&reg_resp.business_id)
    .bind(business_name)
    .bind(&owner_phone)
    .bind(&now)
    .bind(terms_version)
    .bind(terms_locale)
    .bind(terms_text_sha256)
    .bind(&now)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    let user_id = format!("user_sudo_{}", uuid::Uuid::new_v4().simple());
    let pwd_hash = crate::security::hashing::hash_password(password).map_err(|e| AuthError::InternalError(e.to_string()).to_response())?;

    let full_name = format!("{} {}", owner_first_name, owner_last_name);

    sqlx::query(
        r#"
        INSERT INTO app_user (id, workspace_id, branch_id, username, first_name, last_name, full_name, role, role_preset, active, must_change_credentials, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'sudo', 'sudo', 1, 0, ?, ?)
        "#,
    )
    .bind(&user_id)
    .bind(&reg_resp.workspace_id)
    .bind(&reg_resp.branch_id)
    .bind(username)
    .bind(owner_first_name)
    .bind(owner_last_name)
    .bind(full_name)
    .bind(&now)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    let cred = crate::models::auth::UserCredential {
        user_id: user_id.clone(),
        workspace_id: reg_resp.workspace_id.clone(),
        branch_id: reg_resp.branch_id.clone(),
        password_hash: pwd_hash,
        pin_hash: None,
        failed_password_attempts: 0,
        failed_pin_attempts: 0,
        locked_until: None,
        password_changed_at: Some(now.clone()),
        pin_changed_at: None,
        created_at: now.clone(),
        updated_at: now.clone(),
    };
    crate::repositories::credential_repo::CredentialRepository::create(&mut tx, &cred)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    sqlx::query(
        r#"
        INSERT INTO bound_device (id, workspace_id, branch_id, device_label, public_key, bound_by_user_id, status, created_at, updated_at)
        VALUES (?, ?, ?, 'Local Desktop POS', 'mock_pubkey', ?, 'active', ?, ?)
        "#,
    )
    .bind(format!("dev_{}", uuid::Uuid::new_v4().simple()))
    .bind(&reg_resp.workspace_id)
    .bind(&reg_resp.branch_id)
    .bind(&user_id)
    .bind(&now)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;
    Ok(RegistrationResult {
        business_id: reg_resp.business_id,
        workspace_id: reg_resp.workspace_id,
        branch_id: reg_resp.branch_id,
    })
}

#[cfg(test)]
mod tests {
    use super::normalize_tz_phone;

    #[test]
    fn validates_and_normalizes_tanzanian_phone_input() {
        assert_eq!(normalize_tz_phone("0712 345-678").unwrap(), "255712345678");
        assert_eq!(normalize_tz_phone("+255712345678").unwrap(), "255712345678");
        assert!(normalize_tz_phone("+233712345678").is_err());
        assert!(normalize_tz_phone("07123456789").is_err());
    }
}

#[tauri::command]
pub async fn recovery_redeem(_state: State<'_, AppState>, _username: String, _code: String, _new_password: String) -> Result<(), AuthErrorResponse> {
    Ok(())
}
