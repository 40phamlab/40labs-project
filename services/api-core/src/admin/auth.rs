// PHASE: Admin-A
use crate::admin::AdminClaims;
use crate::routes::activation::AppState;
use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use argon2::password_hash::SaltString;
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use axum::{
    extract::{ConnectInfo, State},
    http::{header, HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Extension, Json, Router,
};
use base64::Engine;
use rand::rngs::OsRng;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use totp_rs::{Algorithm, Secret, TOTP};

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/auth/login", post(login_handler))
        .route("/auth/totp", post(totp_handler))
        .route("/auth/recovery", post(recovery_login_handler))
        .route(
            "/auth/recovery-codes/regenerate",
            post(regenerate_recovery_codes_handler),
        )
        .route("/auth/logout", post(logout_handler))
        .route("/auth/sessions", get(list_sessions_handler))
        .route(
            "/auth/sessions/:session_id/revoke",
            post(revoke_session_handler),
        )
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

#[derive(Deserialize)]
pub struct RecoveryPayload {
    pub challenge_id: String,
    pub code: String,
}

#[derive(Serialize)]
pub struct TotpResponse {
    pub success: bool,
    pub role: String,
}

fn session_cookie_header(value: &str, max_age_seconds: i64, app_env: &str) -> String {
    let secure = if app_env.eq_ignore_ascii_case("production") {
        "; Secure"
    } else {
        ""
    };
    format!(
        "admin_session={value}; HttpOnly{secure}; SameSite=Strict; Path=/; Max-Age={max_age_seconds}"
    )
}

pub fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?;
    Ok(password_hash.to_string())
}

pub fn verify_password(password: &str, password_hash: &str) -> bool {
    let parsed_hash = match PasswordHash::new(password_hash) {
        Ok(h) => h,
        Err(_) => return false,
    };
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok()
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
    let ciphertext = cipher
        .encrypt(nonce, secret.as_bytes())
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
    let decoded = base64::engine::general_purpose::STANDARD
        .decode(encrypted_b64)
        .map_err(|e| e.to_string())?;
    if decoded.len() < 12 {
        return Err("Invalid ciphertext".into());
    }
    let (nonce_bytes, ciphertext) = decoded.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| e.to_string())?;
    String::from_utf8(plaintext).map_err(|e| e.to_string())
}

pub fn generate_totp_secret() -> (String, String) {
    let secret = Secret::generate_secret();
    let secret_base32 = secret.to_encoded().to_string();
    let url = totp_enrollment_url(&secret_base32);
    (secret_base32, url)
}

fn totp_enrollment_url(secret_base32: &str) -> String {
    let secret = Secret::Encoded(secret_base32.to_string());
    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret.to_bytes().unwrap(),
        Some("40Labs Admin".into()),
        "".into(),
    )
    .unwrap();
    totp.get_url()
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

fn matching_totp_step(secret_base32: &str, code: &str, now: u64) -> Option<u64> {
    let secret = Secret::Encoded(secret_base32.to_string()).to_bytes().ok()?;
    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        0,
        30,
        secret,
        Some("40Labs Admin".into()),
        String::new(),
    )
    .ok()?;
    let current = now / 30;
    [
        current.saturating_sub(1),
        current,
        current.saturating_add(1),
    ]
    .into_iter()
    .find(|step| totp.check(code, step * 30))
}

fn recovery_code_hash(code: &str) -> String {
    use sha2::Digest;
    hex::encode(sha2::Sha256::digest(
        code.trim().to_ascii_uppercase().as_bytes(),
    ))
}

async fn recovery_login_handler(
    State(state): State<AppState>,
    Json(payload): Json<RecoveryPayload>,
) -> impl IntoResponse {
    if state
        .rate_limiter
        .check_rate_limit_shared(
            &state.pool,
            &format!("recovery_challenge_{}", payload.challenge_id),
            5,
            std::time::Duration::from_secs(300),
        )
        .await
        .is_err()
    {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            Json(
                serde_json::json!({"error":{"code":"RATE_LIMIT","message":"Rate limit exceeded"}}),
            ),
        )
            .into_response();
    }
    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    };
    let user_id: Result<Option<(String,)>, _> = sqlx::query_as(
        "UPDATE admin_recovery_codes SET consumed_at = NOW() WHERE admin_user_id = (SELECT c.admin_user_id FROM admin_login_challenges c JOIN admin_users u ON u.id = c.admin_user_id WHERE c.id = $1 AND c.consumed_at IS NULL AND c.expires_at > NOW() AND u.disabled_at IS NULL) AND code_hash = $2 AND consumed_at IS NULL RETURNING admin_user_id"
    ).bind(&payload.challenge_id).bind(recovery_code_hash(&payload.code)).fetch_optional(&mut *tx).await;
    let user_id = match user_id {
        Ok(user_id) => user_id,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":"Could not verify recovery code"}}))).into_response(),
    };
    let user_id = match user_id {
        Some((id,)) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error":{"code":"UNAUTHORIZED","message":"Invalid recovery code or challenge"}}))).into_response(),
    };
    let consumed = sqlx::query("UPDATE admin_login_challenges SET consumed_at = NOW() WHERE id = $1 AND admin_user_id = $2 AND consumed_at IS NULL AND expires_at > NOW()")
        .bind(&payload.challenge_id).bind(&user_id).execute(&mut *tx).await;
    if !matches!(consumed, Ok(ref result) if result.rows_affected() == 1) {
        return StatusCode::UNAUTHORIZED.into_response();
    }
    let session_id = uuid::Uuid::new_v4().to_string();
    let expires_at = chrono::Utc::now() + chrono::Duration::hours(8);
    if sqlx::query("INSERT INTO admin_sessions (id, admin_user_id, expires_at) VALUES ($1, $2, $3)")
        .bind(&session_id)
        .bind(&user_id)
        .bind(expires_at)
        .execute(&mut *tx)
        .await
        .is_err()
    {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    }
    let role: (String,) =
        match sqlx::query_as("SELECT role FROM admin_users WHERE id = $1 AND disabled_at IS NULL")
            .bind(&user_id)
            .fetch_one(&mut *tx)
            .await
        {
            Ok(row) => row,
            Err(_) => return StatusCode::UNAUTHORIZED.into_response(),
        };
    if tx.commit().await.is_err() {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    }
    let cookie = session_cookie_header(&session_id, 8 * 60 * 60, &state.config.app_env);
    let mut headers = HeaderMap::new();
    if let Ok(value) = cookie.parse() {
        headers.insert(header::SET_COOKIE, value);
    }
    (
        StatusCode::OK,
        headers,
        Json(TotpResponse {
            success: true,
            role: role.0,
        }),
    )
        .into_response()
}

async fn regenerate_recovery_codes_handler(
    State(state): State<AppState>,
    Extension(claims): Extension<AdminClaims>,
) -> impl IntoResponse {
    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    };
    if sqlx::query("DELETE FROM admin_recovery_codes WHERE admin_user_id = $1")
        .bind(&claims.user_id)
        .execute(&mut *tx)
        .await
        .is_err()
    {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    }
    let mut codes = Vec::with_capacity(10);
    for _ in 0..10 {
        let mut bytes = [0u8; 16];
        OsRng.fill_bytes(&mut bytes);
        let code = hex::encode_upper(bytes);
        if sqlx::query("INSERT INTO admin_recovery_codes(admin_user_id, code_hash) VALUES ($1, $2)")
            .bind(&claims.user_id)
            .bind(recovery_code_hash(&code))
            .execute(&mut *tx)
            .await
            .is_err()
        {
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }
        codes.push(code);
    }
    if tx.commit().await.is_err() {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    }
    (
        StatusCode::OK,
        Json(serde_json::json!({"recovery_codes": codes})),
    )
        .into_response()
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
         VALUES ($1, $2, $3, $4, $5, $6, $7)",
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
    peer: Option<ConnectInfo<SocketAddr>>,
    Json(payload): Json<LoginPayload>,
) -> impl IntoResponse {
    let email = payload.email.trim().to_lowercase();

    if let Some(ConnectInfo(peer)) = peer {
        if state
            .rate_limiter
            .check_rate_limit_shared(
                &state.pool,
                &format!("admin_login_ip_{}", peer.ip()),
                30,
                std::time::Duration::from_secs(60),
            )
            .await
            .is_err()
        {
            return (StatusCode::TOO_MANY_REQUESTS, Json(serde_json::json!({ "error": { "code": "RATE_LIMIT", "message": "Rate limit exceeded" } }))).into_response();
        }
    }

    if state
        .rate_limiter
        .check_rate_limit_shared(
            &state.pool,
            &format!("login_email_{}", email),
            5,
            std::time::Duration::from_secs(60),
        )
        .await
        .is_err()
    {
        log_ops_event(
            &state.pool,
            "warn",
            "auth",
            "admin_login_rate_limited_email",
            None,
            None,
            None,
        )
        .await;
        return (StatusCode::TOO_MANY_REQUESTS, Json(serde_json::json!({ "error": { "code": "RATE_LIMIT", "message": "Rate limit exceeded" } }))).into_response();
    }

    let user = sqlx::query_as::<_, (String, String, Option<String>, String, Option<chrono::DateTime<chrono::Utc>>, Option<chrono::DateTime<chrono::Utc>>)>(
        "SELECT id, email, totp_secret_enc, password_hash, disabled_at, totp_enrolled_at FROM admin_users WHERE email = $1"
    )
    .bind(&email)
    .fetch_optional(&state.pool)
    .await;

    let (user_id, totp_secret_enc, password_hash, disabled_at, totp_enrolled_at) = match user {
        Ok(Some(u)) => (u.0, u.2, u.3, u.4, u.5),
        Ok(None) => {
            let dummy_hash = "$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHQ$W8c9vV9...d";
            let _ = verify_password(&payload.password, dummy_hash);
            log_ops_event(
                &state.pool,
                "warn",
                "auth",
                "admin_login_failed_invalid_credentials",
                None,
                None,
                None,
            )
            .await;
            return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "Invalid credentials" } }))).into_response();
        }
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Could not load administrator account" } }))).into_response(),
    };

    if disabled_at.is_some() {
        log_ops_event(
            &state.pool,
            "warn",
            "auth",
            "admin_login_failed_disabled",
            None,
            None,
            None,
        )
        .await;
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "Invalid credentials" } }))).into_response();
    }

    let password_ok = verify_password(&payload.password, &password_hash);
    if !password_ok {
        log_ops_event(
            &state.pool,
            "warn",
            "auth",
            "admin_login_failed_wrong_password",
            None,
            None,
            None,
        )
        .await;
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "Invalid credentials" } }))).into_response();
    }

    let enrollment_required = totp_enrolled_at.is_none();
    let otpauth_url = if enrollment_required {
        match totp_secret_enc {
            Some(encrypted) => match decrypt_secret(&encrypted, &state.config.totp_enc_key) {
                Ok(secret) => Some(totp_enrollment_url(&secret)),
                Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Failed to initialize MFA enrollment" } }))).into_response(),
            },
            None => {
                let (secret_b32, url) = generate_totp_secret();
                let enc = match encrypt_secret(&secret_b32, &state.config.totp_enc_key) {
                    Ok(e) => e,
                    Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Failed to encrypt TOTP secret" } }))).into_response(),
                };
                if sqlx::query("UPDATE admin_users SET totp_secret_enc = $1, totp_enrolled_at = NULL WHERE id = $2 AND disabled_at IS NULL")
                    .bind(&enc).bind(&user_id).execute(&state.pool).await.is_err() {
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Failed to initialize MFA" } }))).into_response();
                }
                Some(url)
            }
        }
    } else { None };
    let challenge_id = uuid::Uuid::new_v4().to_string();
    let expires_at = chrono::Utc::now() + chrono::Duration::minutes(5);
    if sqlx::query(
        "INSERT INTO admin_login_challenges(id, admin_user_id, expires_at) VALUES ($1, $2, $3)",
    )
    .bind(&challenge_id)
    .bind(&user_id)
    .bind(expires_at)
    .execute(&state.pool)
    .await
    .is_err()
    {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Could not create login challenge" } }))).into_response();
    }

    log_ops_event(
        &state.pool,
        "info",
        "auth",
        "admin_login_password_success",
        None,
        None,
        Some(serde_json::json!({ "email": email })),
    )
    .await;

    (
        StatusCode::OK,
        Json(LoginResponse {
            mfa_required: true,
            challenge_id,
            enrollment_required: Some(enrollment_required),
            otpauth_url,
        }),
    )
        .into_response()
}

#[axum::debug_handler]
async fn totp_handler(
    State(state): State<AppState>,
    Json(payload): Json<TotpPayload>,
) -> impl IntoResponse {
    if state
        .rate_limiter
        .check_rate_limit_shared(
            &state.pool,
            &format!("totp_challenge_{}", payload.challenge_id),
            5,
            std::time::Duration::from_secs(300),
        )
        .await
        .is_err()
    {
        return (StatusCode::TOO_MANY_REQUESTS, Json(serde_json::json!({ "error": { "code": "RATE_LIMIT", "message": "Rate limit exceeded" } }))).into_response();
    }

    let challenge_user_id: Result<Option<(String,)>, _> = sqlx::query_as(
        "SELECT admin_user_id FROM admin_login_challenges WHERE id = $1 AND consumed_at IS NULL AND expires_at > NOW()"
    ).bind(&payload.challenge_id).fetch_optional(&state.pool).await;
    let challenge_user_id = match challenge_user_id {
        Ok(user_id) => user_id,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":"Could not validate TOTP challenge"}}))).into_response(),
    };
    let admin_user_id = match challenge_user_id {
        Some((user_id,)) => user_id,
        None => {
            log_ops_event(
                &state.pool,
                "warn",
                "auth",
                "admin_totp_failed_invalid_challenge",
                None,
                None,
                None,
            )
            .await;
            return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "Invalid or expired challenge" } }))).into_response();
        }
    };

    if state
        .rate_limiter
        .check_rate_limit_shared(
            &state.pool,
            &format!("totp_user_{}", admin_user_id),
            5,
            std::time::Duration::from_secs(300),
        )
        .await
        .is_err()
    {
        return (StatusCode::TOO_MANY_REQUESTS, Json(serde_json::json!({ "error": { "code": "RATE_LIMIT", "message": "Rate limit exceeded" } }))).into_response();
    }

    let user =
        sqlx::query_as::<
            _,
            (
                String,
                String,
                Option<String>,
                Option<chrono::DateTime<chrono::Utc>>,
            ),
        >("SELECT id, email, totp_secret_enc, disabled_at FROM admin_users WHERE id = $1")
        .bind(&admin_user_id)
        .fetch_optional(&state.pool)
        .await;

    let (_user_id, email, totp_secret_enc, _disabled_at) = match user {
        Ok(Some(u)) if u.3.is_none() => (u.0, u.1, u.2, u.3),
        _ => {
            log_ops_event(
                &state.pool,
                "warn",
                "auth",
                "admin_totp_failed_user_not_found",
                None,
                None,
                None,
            )
            .await;
            return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "User not found" } }))).into_response();
        }
    };

    let secret_enc = match totp_secret_enc {
        Some(s) => s,
        None => {
            log_ops_event(
                &state.pool,
                "warn",
                "auth",
                "admin_totp_failed_no_secret",
                None,
                None,
                Some(serde_json::json!({ "email": email })),
            )
            .await;
            return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "TOTP not enrolled" } }))).into_response();
        }
    };

    let secret_b32 = match decrypt_secret(&secret_enc, &state.config.totp_enc_key) {
        Ok(s) => s,
        Err(_) => {
            log_ops_event(
                &state.pool,
                "error",
                "auth",
                "admin_totp_decrypt_failed",
                None,
                None,
                Some(serde_json::json!({ "email": email })),
            )
            .await;
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Failed to verify TOTP" } }))).into_response();
        }
    };

    let now_step = chrono::Utc::now().timestamp().max(0) as u64;
    let step = match matching_totp_step(&secret_b32, &payload.code, now_step) {
        Some(step) => step as i64,
        None => {
            log_ops_event(
                &state.pool,
                "warn",
                "auth",
                "admin_totp_failed_wrong_code",
                None,
                None,
                None,
            )
            .await;
            return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "Invalid TOTP code" } }))).into_response();
        }
    };

    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    };
    let consumed = sqlx::query("UPDATE admin_login_challenges SET consumed_at = NOW() WHERE id = $1 AND admin_user_id = $2 AND consumed_at IS NULL AND expires_at > NOW()")
        .bind(&payload.challenge_id).bind(&admin_user_id).execute(&mut *tx).await;
    if !matches!(consumed, Ok(ref result) if result.rows_affected() == 1) {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "Invalid or expired challenge" } }))).into_response();
    }

    let accepted = sqlx::query("UPDATE admin_users SET totp_last_step = $1, totp_enrolled_at = COALESCE(totp_enrolled_at, NOW()) WHERE id = $2 AND disabled_at IS NULL AND (totp_last_step IS NULL OR totp_last_step < $1)")
        .bind(step).bind(&admin_user_id).execute(&mut *tx).await;
    if !matches!(accepted, Ok(ref result) if result.rows_affected() == 1) {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": { "code": "UNAUTHORIZED", "message": "TOTP code was already used or is no longer valid" } }))).into_response();
    }

    let session_id = uuid::Uuid::new_v4().to_string();
    let expires_at = chrono::Utc::now() + chrono::Duration::hours(8);

    let session_res = sqlx::query(
        "INSERT INTO admin_sessions (id, admin_user_id, expires_at) VALUES ($1, $2, $3)",
    )
    .bind(&session_id)
    .bind(&admin_user_id)
    .bind(expires_at)
    .execute(&mut *tx)
    .await;

    if session_res.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Failed to create session" } }))).into_response();
    }

    let role_res: Result<(String,), _> =
        sqlx::query_as("SELECT role FROM admin_users WHERE id = $1 AND disabled_at IS NULL")
            .bind(&admin_user_id)
            .fetch_one(&mut *tx)
            .await;

    let role = match role_res {
        Ok((role,)) => role,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Failed to load account permissions" } }))).into_response(),
    };
    if tx.commit().await.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Failed to create session" } }))).into_response();
    }

    log_ops_event(
        &state.pool,
        "info",
        "auth",
        "admin_login_success",
        None,
        None,
        Some(serde_json::json!({ "email": email, "role": role })),
    )
    .await;

    let cookie_val = session_cookie_header(&session_id, 8 * 60 * 60, &state.config.app_env);

    let mut headers = HeaderMap::new();
    headers.insert(header::SET_COOKIE, cookie_val.parse().unwrap());

    (
        StatusCode::OK,
        headers,
        Json(TotpResponse {
            success: true,
            role,
        }),
    )
        .into_response()
}

#[axum::debug_handler]
async fn logout_handler(State(state): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":"Could not end admin session"}}))).into_response(),
    };
    if let Some(cookie_val) = headers.get(header::COOKIE) {
        if let Ok(cookie_str) = cookie_val.to_str() {
            for cookie in cookie_str.split(';') {
                let parts: Vec<&str> = cookie.trim().splitn(2, '=').collect();
                if parts.len() == 2 && parts[0] == "admin_session" {
                    let session_id = parts[1];
                    let user_id: Result<Option<(String,)>, _> = sqlx::query_as("UPDATE admin_sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL RETURNING admin_user_id")
                        .bind(session_id).fetch_optional(&mut *tx).await;
                    match user_id {
                        Ok(Some((user_id,))) => {
                            if sqlx::query("INSERT INTO admin_audit_log (id,admin_user_id,action,target_type,target_id,payload) VALUES ($1,$2,'admin_logout','admin_session',$3,'{}'::jsonb)")
                                .bind(uuid::Uuid::new_v4().to_string()).bind(user_id).bind(session_id).execute(&mut *tx).await.is_err() {
                                return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":"Could not record admin logout"}}))).into_response();
                            }
                        }
                        Ok(None) => {}
                        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":"Could not revoke admin session"}}))).into_response(),
                    }
                }
            }
        }
    }
    if tx.commit().await.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":"Could not commit admin logout"}}))).into_response();
    }

    let cookie_val = session_cookie_header("", 0, &state.config.app_env);
    let mut resp_headers = HeaderMap::new();
    resp_headers.insert(header::SET_COOKIE, cookie_val.parse().unwrap());

    (
        StatusCode::OK,
        resp_headers,
        Json(serde_json::json!({ "success": true })),
    )
        .into_response()
}

#[axum::debug_handler]
async fn me_handler(Extension(claims): Extension<AdminClaims>) -> impl IntoResponse {
    (
        StatusCode::OK,
        Json(serde_json::json!({
            "id": claims.user_id,
            "email": claims.email,
            "role": claims.role,
        })),
    )
}

#[axum::debug_handler]
async fn list_sessions_handler(
    State(state): State<AppState>,
    Extension(claims): Extension<AdminClaims>,
) -> impl IntoResponse {
    let sessions = sqlx::query_as::<_, (String, chrono::DateTime<chrono::Utc>, Option<String>, Option<String>, Option<chrono::DateTime<chrono::Utc>>)>(
        "SELECT id, expires_at, ip, user_agent, revoked_at FROM admin_sessions WHERE admin_user_id = $1 ORDER BY expires_at DESC"
    )
    .bind(&claims.user_id)
    .fetch_all(&state.pool)
    .await;

    match sessions {
        Ok(list) => {
            let res: Vec<_> = list.into_iter().map(|s| serde_json::json!({
                "id": s.0,
                "expires_at": s.1,
                "ip": s.2,
                "user_agent": s.3,
                "revoked_at": s.4,
            })).collect();
            (StatusCode::OK, Json(res)).into_response()
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Failed to fetch sessions" } }))).into_response(),
    }
}

#[axum::debug_handler]
async fn revoke_session_handler(
    State(state): State<AppState>,
    Extension(claims): Extension<AdminClaims>,
    axum::extract::Path(session_id): axum::extract::Path<String>,
) -> impl IntoResponse {
    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":"Could not revoke session"}}))).into_response(),
    };
    let res = sqlx::query(
        "UPDATE admin_sessions SET revoked_at = NOW() WHERE id = $1 AND admin_user_id = $2 AND revoked_at IS NULL",
    )
    .bind(&session_id)
    .bind(&claims.user_id)
    .execute(&mut *tx)
    .await;

    match res {
        Ok(result) if result.rows_affected() == 1 => {
            if sqlx::query("INSERT INTO admin_audit_log (id,admin_user_id,action,target_type,target_id,payload) VALUES ($1,$2,'admin_session_revoked','admin_session',$3,'{}'::jsonb)")
                .bind(uuid::Uuid::new_v4().to_string()).bind(&claims.user_id).bind(&session_id).execute(&mut *tx).await.is_err() {
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":"Could not record session revocation"}}))).into_response();
            }
            if tx.commit().await.is_err() { return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":"Could not commit session revocation"}}))).into_response(); }
            (StatusCode::OK, Json(serde_json::json!({ "success": true }))).into_response()
        }
        Ok(_) => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": { "code": "NOT_FOUND", "message": "Session not found" } }))).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": { "code": "INTERNAL", "message": "Failed to revoke session" } }))).into_response(),
    }
}

#[cfg(test)]
mod security_tests {
    use super::*;

    #[test]
    fn totp_step_match_returns_the_exact_accepted_step() {
        let (secret, _) = generate_totp_secret();
        let bytes = Secret::Encoded(secret.to_string()).to_bytes().unwrap();
        let totp = TOTP::new(Algorithm::SHA1, 6, 0, 30, bytes, None, String::new()).unwrap();
        let now = 1_800_000_017u64;
        let current = now / 30;
        let code = totp.generate(current * 30);
        assert_eq!(matching_totp_step(&secret, &code, now), Some(current));
        assert_eq!(matching_totp_step(&secret, &code, (current + 3) * 30), None);
    }

    #[test]
    fn recovery_code_hash_is_case_insensitive_and_one_way() {
        assert_eq!(
            recovery_code_hash("ABCD-1234"),
            recovery_code_hash("abcd-1234")
        );
        assert_ne!(recovery_code_hash("ABCD-1234"), "ABCD-1234");
    }
}
