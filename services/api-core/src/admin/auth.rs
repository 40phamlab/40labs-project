// PHASE: Admin-A
use axum::{
    routing::{get, post},
    Router,
    http::{StatusCode, HeaderMap, header},
    response::IntoResponse,
    Json,
    extract::State,
};
use serde::{Deserialize, Serialize};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::SaltString;
use rand::rngs::OsRng;
use rand::RngCore;
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, KeyInit};
use totp_rs::{TOTP, Algorithm, Secret};
use base64::Engine;
use crate::routes::activation::{AppState, AdminChallenge};

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/auth/login", post(login_handler))
        .route("/auth/totp", post(totp_handler))
        .route("/auth/logout", post(logout_handler))
        .route("/me", get(me_handler))
        .with_state(state)
}

#[derive(Deserialize)]
pub struct LoginPayload {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub mfa_required: bool,
    pub challenge_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enrollment_required: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub otpauth_url: Option<String>,
}

#[derive(Deserialize)]
pub struct TotpPayload {
    pub challenge_id: String,
    pub code: String,
}

#[derive(Serialize)]
pub struct TotpResponse {
    pub success: bool,
    pub role: String,
}

pub fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?;
    Ok(password_hash.to_string())
}

pub fn verify_password(password: &str, password_hash: &str) -> bool {
    let parsed_hash = match PasswordHash::new(password_hash) {
        Ok(h) => h,
        Err(_) => return false,
    };
    Argon2::default().verify_password(password.as_bytes(), &parsed_hash).is_ok()
}

pub fn encrypt_secret(secret: &str, key_hex: &str) -> Result<String, String> {
    let key_bytes = hex::decode(key_hex).map_err(|_| "Invalid TOTP_ENC_KEY hex")?;
    if key_bytes.len() != 32 {
        return Err("TOTP_ENC_KEY must be 32 bytes hex".into());
    }
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher.encrypt(nonce, secret.as_bytes())
        .map_err(|e| e.to_string())?;
    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(base64::engine::general_purpose::STANDARD.encode(&combined))
}

pub fn decrypt_secret(encrypted_b64: &str, key_hex: &str) -> Result<String, String> {
    let key_bytes = hex::decode(key_hex).map_err(|_| "Invalid TOTP_ENC_KEY hex")?;
    if key_bytes.len() != 32 {
        return Err("TOTP_ENC_KEY must be 32 bytes hex".into());
    }
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let decoded = base64::engine::general_purpose::STANDARD.decode(encrypted_b64)
        .map_err(|e| e.to_string())?;
    if decoded.len() < 12 {
        return Err("Invalid ciphertext".into());
    }
    let (nonce_bytes, ciphertext) = decoded.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    let plaintext = cipher.decrypt(nonce, ciphertext)
        .map_err(|e| e.to_string())?;
    String::from_utf8(plaintext).map_err(|e| e.to_string())
}

pub fn generate_totp_secret() -> (String, String) {
    let secret = Secret::generate_secret();
    let secret_base32 = secret.to_encoded().to_string();
    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret.to_bytes().unwrap(),
        Some("40Labs Admin".into()),
        "".into(),
    ).unwrap();
    let url = totp.get_url();
    (secret_base32, url)
}

pub fn verify_totp(secret_base32: &str, code: &str) -> bool {
    let secret = match Secret::Encoded(secret_base32.to_string()).to_bytes() {
        Ok(b) => b,
        Err(_) => return false,
    };
    let totp = match TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret,
        Some("40Labs Admin".into()),
        "".into(),
    ) {
        Ok(t) => t,
        Err(_) => return false,
    };
    totp.check_current(code).unwrap_or(false)
}

pub async fn log_ops_event(
    pool: &sqlx::PgPool,
    level: &str,
    source: &str,
    message: &str,
    business_id: Option<&str>,
    device_id: Option<&str>,
    meta: Option<serde_json::Value>,
) {
    let id = uuid::Uuid::new_v4().to_string();
    let _ = sqlx::query(
        "INSERT INTO ops_events (id, level, source, message, business_id, device_id, meta) \
         VALUES ($1, $2, $3, $4, $5, $6, $7)"
    )
    .bind(id)
    .bind(level)
    .bind(source)
    .bind(message)
    .bind(business_id)
    .bind(device_id)
    .bind(meta)
    .execute(pool)
    .await;
}

#[axum::debug_handler]
async fn login_handler(
    State(state): State<AppState>,
    Json(payload): Json<LoginPayload>,
) -> impl IntoResponse {
    let email = payload.email.trim().to_lowercase();

    if state.rate_limiter.check_rate_limit(&format!("login_email_{}", email), 5, std::time::Duration::from_secs(60)).is_err() {
        log_ops_event(&state.pool, "warn", "auth", "admin_login_rate_limited_email", None, None, Some(serde_json::json!({ "email": email }))).await;
        return (StatusCode::TOO_MANY_REQUESTS, Json(serde_json::json!({ "error": { "code": "RATE_LIMIT", "message": "Rate limit exceeded" } }))).into_response();
    }

    let is_locked = {
        let lockouts = state.account_lockouts.lock().unwrap();
        if let Some(&lockout_until) = lockouts.get(&email) {
            std::time::Instant::now() < lockout_until
        } else {
            false
        }
    };

    if is_locked {
        log_ops_event(&state.pool, "warn", "auth", "admin_login_locked_out", None, None, Some(serde_json::json!({ "email": email }))).await;
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "LOCKED", "message": "Account is locked due to too many failed attempts. Try again in 15 minutes." } }))).into_response();
    }

    let user = sqlx::query_as::<_, (String, String, Option<String>, String, Option<chrono::DateTime<chrono::Utc>>)>(
        "SELECT id, email, totp_secret_enc, password_hash, disabled_at FROM admin_users WHERE email = $1"
    )
    .bind(&email)
    .fetch_optional(&state.pool)
    .await;

    let (user_id, totp_secret_enc, password_hash, disabled_at) = match user {
        Ok(Some(u)) => (u.0, u.2, u.3, u.4),
        _ => {
            let dummy_hash = "$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHQ$W8c9vV9...d";
            let _ = verify_password(&payload.password, dummy_hash);
            record_failure(&state, &email).await;
            log_ops_event(&state.pool, "warn", "auth", "admin_login_failed_invalid_credentials", None, None, Some(serde_json::json!({ "email": email }))).await;
            return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "Invalid credentials" } }))).into_response();
        }
    };

    if disabled_at.is_some() {
        log_ops_event(&state.pool, "warn", "auth", "admin_login_failed_disabled", None, None, Some(serde_json::json!({ "email": email }))).await;
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "Invalid credentials" } }))).into_response();
    }

    let password_ok = verify_password(&payload.password, &password_hash);
    if !password_ok {
        record_failure(&state, &email).await;
        log_ops_event(&state.pool, "warn", "auth", "admin_login_failed_wrong_password", None, None, Some(serde_json::json!({ "email": email }))).await;
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "Invalid credentials" } }))).into_response();
    }

    {
        let mut failures = state.login_failures.lock().unwrap();
        failures.remove(&email);
    }

    let mut enrollment_required: Option<bool> = None;
    let mut otpauth_url = None;
    let mut final_totp_secret_enc = totp_secret_enc;

    if final_totp_secret_enc.is_none() {
        let (secret_b32, url) = generate_totp_secret();
        let enc = match encrypt_secret(&secret_b32, &state.config.totp_enc_key) {
            Ok(e) => e,
            Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Failed to encrypt TOTP secret" } }))).into_response(),
        };
        let _ = sqlx::query("UPDATE admin_users SET totp_secret_enc = $1 WHERE id = $2")
            .bind(&enc)
            .bind(&user_id)
            .execute(&state.pool)
            .await;
        final_totp_secret_enc = Some(enc);
        enrollment_required = Some(true);
        otpauth_url = Some(url);
    }
    let _ = final_totp_secret_enc;

    let challenge_id = uuid::Uuid::new_v4().to_string();
    let expires_at = chrono::Utc::now() + chrono::Duration::minutes(5);
    {
        let mut challenges = state.admin_challenges.lock().unwrap();
        challenges.insert(challenge_id.clone(), AdminChallenge {
            admin_user_id: user_id,
            expires_at,
        });
    }

    log_ops_event(&state.pool, "info", "auth", "admin_login_password_success", None, None, Some(serde_json::json!({ "email": email }))).await;

    (
        StatusCode::OK,
        Json(LoginResponse {
            mfa_required: true,
            challenge_id,
            enrollment_required,
            otpauth_url,
        }),
    ).into_response()
}

async fn record_failure(state: &AppState, email: &str) {
    let mut lock_until = None;
    {
        let mut failures = state.login_failures.lock().unwrap();
        let now = std::time::Instant::now();
        let entry = failures.entry(email.to_string()).or_insert((0, now));
        if now.duration_since(entry.1) > std::time::Duration::from_secs(900) {
            *entry = (1, now);
        } else {
            entry.0 += 1;
        }

        if entry.0 >= 10 {
            lock_until = Some(now + std::time::Duration::from_secs(900));
        }
    }

    if let Some(until) = lock_until {
        let mut lockouts = state.account_lockouts.lock().unwrap();
        lockouts.insert(email.to_string(), until);
    }
}

#[axum::debug_handler]
async fn totp_handler(
    State(state): State<AppState>,
    Json(payload): Json<TotpPayload>,
) -> impl IntoResponse {
    let challenge = {
        let mut challenges = state.admin_challenges.lock().unwrap();
        challenges.remove(&payload.challenge_id)
    };

    let challenge = match challenge {
        Some(c) if c.expires_at > chrono::Utc::now() => c,
        _ => {
            log_ops_event(&state.pool, "warn", "auth", "admin_totp_failed_invalid_challenge", None, None, None).await;
            return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "Invalid or expired challenge" } }))).into_response();
        }
    };

    let user = sqlx::query_as::<_, (String, String, Option<String>)>(
        "SELECT id, email, totp_secret_enc FROM admin_users WHERE id = $1"
    )
    .bind(&challenge.admin_user_id)
    .fetch_optional(&state.pool)
    .await;

    let (_user_id, email, totp_secret_enc) = match user {
        Ok(Some(u)) => (u.0, u.1, u.2),
        _ => {
            log_ops_event(&state.pool, "warn", "auth", "admin_totp_failed_user_not_found", None, None, None).await;
            return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "User not found" } }))).into_response();
        }
    };

    let secret_enc = match totp_secret_enc {
        Some(s) => s,
        None => {
            log_ops_event(&state.pool, "warn", "auth", "admin_totp_failed_no_secret", None, None, Some(serde_json::json!({ "email": email }))).await;
            return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "TOTP not enrolled" } }))).into_response();
        }
    };

    let secret_b32 = match decrypt_secret(&secret_enc, &state.config.totp_enc_key) {
        Ok(s) => s,
        Err(_) => {
            log_ops_event(&state.pool, "error", "auth", "admin_totp_decrypt_failed", None, None, Some(serde_json::json!({ "email": email }))).await;
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Failed to verify TOTP" } }))).into_response();
        }
    };

    if !verify_totp(&secret_b32, &payload.code) {
        log_ops_event(&state.pool, "warn", "auth", "admin_totp_failed_wrong_code", None, None, Some(serde_json::json!({ "email": email }))).await;
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "Invalid TOTP code" } }))).into_response();
    }

    let session_id = uuid::Uuid::new_v4().to_string();
    let expires_at = chrono::Utc::now() + chrono::Duration::hours(8);

    let session_res = sqlx::query(
        "INSERT INTO admin_sessions (id, admin_user_id, expires_at) VALUES ($1, $2, $3)"
    )
    .bind(&session_id)
    .bind(&challenge.admin_user_id)
    .bind(expires_at)
    .execute(&state.pool)
    .await;

    if session_res.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Failed to create session" } }))).into_response();
    }

    let role_res: Result<(String,), _> = sqlx::query_as("SELECT role FROM admin_users WHERE id = $1")
        .bind(&challenge.admin_user_id)
        .fetch_one(&state.pool)
        .await;

    let role = role_res.map(|r| r.0).unwrap_or_else(|_| "viewer".into());

    log_ops_event(&state.pool, "info", "auth", "admin_login_success", None, None, Some(serde_json::json!({ "email": email, "role": role }))).await;

    let cookie_val = format!(
        "admin_session={}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800",
        session_id
    );

    let mut headers = HeaderMap::new();
    headers.insert(header::SET_COOKIE, cookie_val.parse().unwrap());

    (
        StatusCode::OK,
        headers,
        Json(TotpResponse {
            success: true,
            role,
        }),
    ).into_response()
}

#[axum::debug_handler]
async fn logout_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    if let Some(cookie_val) = headers.get(header::COOKIE) {
        if let Ok(cookie_str) = cookie_val.to_str() {
            for cookie in cookie_str.split(';') {
                let parts: Vec<&str> = cookie.trim().splitn(2, '=').collect();
                if parts.len() == 2 && parts[0] == "admin_session" {
                    let session_id = parts[1];
                    let _ = sqlx::query("UPDATE admin_sessions SET revoked_at = NOW() WHERE id = $1")
                        .bind(session_id)
                        .execute(&state.pool)
                        .await;
                }
            }
        }
    }

    log_ops_event(&state.pool, "info", "auth", "admin_logout", None, None, None).await;

    let cookie_val = "admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0";
    let mut resp_headers = HeaderMap::new();
    resp_headers.insert(header::SET_COOKIE, cookie_val.parse().unwrap());

    (
        StatusCode::OK,
        resp_headers,
        Json(serde_json::json!({ "success": true })),
    ).into_response()
}

#[axum::debug_handler]
async fn me_handler(
    req: axum::extract::Request,
) -> impl IntoResponse {
    let claims = match req.extensions().get::<crate::admin::AdminClaims>() {
        Some(c) => c,
        None => return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "Unauthorized" } }))).into_response(),
    };

    (
        StatusCode::OK,
        Json(serde_json::json!({
            "id": claims.user_id,
            "email": claims.email,
            "role": claims.role,
        })),
    ).into_response()
}
