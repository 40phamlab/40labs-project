use axum::{
    extract::{ConnectInfo, State},
    routing::post,
    Json, Router,
};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::Arc;

use crate::{
    config::Config,
    error::ApiError,
    grant::{generate_business_id, sign_grant, ActivationGrantPayload},
    otp::{generate_otp, hash_otp, hash_string, verify_otp_hash},
    ratelimit::RateLimiter,
    sms::SmsSender,
};

#[derive(Clone)]
pub struct AppState {
    pub pool: sqlx::PgPool,
    pub config: Config,
    pub sms_sender: Arc<dyn SmsSender>,
    pub rate_limiter: RateLimiter,
}

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/api/v1/activation/otp/request", post(request_otp))
        .route("/api/v1/activation/otp/verify", post(verify_otp))
        .route("/api/v1/activation/register", post(register_business))
        .with_state(state)
}

#[derive(Deserialize)]
pub struct OtpRequestPayload {
    pub phone: String,
}

#[derive(Serialize)]
pub struct OtpResponse {
    pub status: String,
    pub expires_in_secs: i64,
}

pub async fn request_otp(
    State(state): State<AppState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(payload): Json<OtpRequestPayload>,
) -> Result<Json<OtpResponse>, ApiError> {
    if !state.config.otp_enabled {
        return Err(ApiError::BadRequest("OTP service is currently disabled".into()));
    }

    let phone_hash = hash_string(&payload.phone);
    let ip_str = addr.ip().to_string();

    if let Err(ra) = state.rate_limiter.check_rate_limit(&phone_hash, 3, std::time::Duration::from_secs(3600)) {
        return Err(ApiError::RateLimitExceeded { retry_after: ra });
    }
    if let Err(ra) = state.rate_limiter.check_rate_limit(&ip_str, 10, std::time::Duration::from_secs(3600)) {
        return Err(ApiError::RateLimitExceeded { retry_after: ra });
    }

    let today = Utc::now().format("%Y-%m-%d").to_string();
    let count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM otp_challenge WHERE created_at LIKE $1"
    )
    .bind(format!("{}%", today))
    .fetch_one(&state.pool)
    .await?;

    if count.0 >= state.config.otp_daily_max as i64 {
        return Err(ApiError::BadRequest("Daily OTP limit reached".into()));
    }

    let code = generate_otp();
    let code_hash = hash_otp(&code, state.config.activation_signing_key.as_bytes());
    let now = Utc::now();
    let expires_at = (now + Duration::seconds(300)).to_rfc3339();
    let created_at = now.to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO otp_challenge (phone_hash, code_hash, expires_at, attempts, consumed, created_at)
        VALUES ($1, $2, $3, 0, 0, $4)
        ON CONFLICT (phone_hash) DO UPDATE SET
            code_hash = EXCLUDED.code_hash,
            expires_at = EXCLUDED.expires_at,
            attempts = 0,
            consumed = 0,
            created_at = EXCLUDED.created_at
        "#,
    )
    .bind(&phone_hash)
    .bind(&code_hash)
    .bind(&expires_at)
    .bind(&created_at)
    .execute(&state.pool)
    .await?;

    let msg_id = uuid::Uuid::new_v4().to_string();
    let text = format!("Your 40Labs activation code is: {}. Valid for 5 minutes.", code);

    state.sms_sender.send(&payload.phone, &text, &msg_id).await.map_err(|e| {
        ApiError::Sms(e.to_string())
    })?;

    Ok(Json(OtpResponse {
        status: "otp_sent".into(),
        expires_in_secs: 300,
    }))
}

#[derive(Deserialize)]
pub struct OtpVerifyPayload {
    pub phone: String,
    pub code: String,
}

#[derive(Serialize)]
pub struct OtpVerifyResponse {
    pub verification_token: String,
}

pub async fn verify_otp(
    State(state): State<AppState>,
    Json(payload): Json<OtpVerifyPayload>,
) -> Result<Json<OtpVerifyResponse>, ApiError> {
    let phone_hash = hash_string(&payload.phone);

    let row = sqlx::query_as::<_, (String, String, i32, i32)>(
        "SELECT code_hash, expires_at, attempts, consumed FROM otp_challenge WHERE phone_hash = $1"
    )
    .bind(&phone_hash)
    .fetch_optional(&state.pool)
    .await?;

    let (code_hash, expires_at_str, attempts, consumed) = match row {
        Some(r) => r,
        None => return Err(ApiError::BadRequest("Invalid or expired OTP code".into())),
    };

    if consumed == 1 {
        return Err(ApiError::BadRequest("OTP code already consumed".into()));
    }

    let expires_at = chrono::DateTime::parse_from_rfc3339(&expires_at_str)
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now());

    if Utc::now() > expires_at || attempts >= 5 {
        return Err(ApiError::BadRequest("OTP code expired or too many failed attempts".into()));
    }

    let valid = verify_otp_hash(&payload.code, &code_hash, state.config.activation_signing_key.as_bytes());

    if !valid {
        let new_attempts = attempts + 1;
        sqlx::query("UPDATE otp_challenge SET attempts = $1 WHERE phone_hash = $2")
            .bind(new_attempts)
            .bind(&phone_hash)
            .execute(&state.pool)
            .await?;
        return Err(ApiError::BadRequest("Invalid OTP code".into()));
    }

    sqlx::query("UPDATE otp_challenge SET consumed = 1 WHERE phone_hash = $1")
        .bind(&phone_hash)
        .execute(&state.pool)
        .await?;

    let plain_token = uuid::Uuid::new_v4().to_string();
    let token_hash = hash_string(&plain_token);
    let expires_at_token = (Utc::now() + Duration::seconds(600)).to_rfc3339();
    let created_at = Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO verification_token (token_hash, phone_hash, expires_at, used, created_at)
        VALUES ($1, $2, $3, 0, $4)
        "#,
    )
    .bind(&token_hash)
    .bind(&phone_hash)
    .bind(&expires_at_token)
    .bind(&created_at)
    .execute(&state.pool)
    .await?;

    Ok(Json(OtpVerifyResponse {
        verification_token: plain_token,
    }))
}

#[derive(Deserialize)]
pub struct RegisterPayload {
    pub verification_token: String,
    pub business_name: String,
    pub owner_first_name: String,
    pub owner_last_name: String,
    pub owner_email: Option<String>,
    pub terms_accepted: bool,
    pub terms_version: String,
    pub terms_locale: String,
    pub terms_text_sha256: String,
}

#[derive(Serialize)]
pub struct RegisterResponse {
    pub business_id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub activation_grant: String,
}

pub async fn register_business(
    State(state): State<AppState>,
    Json(payload): Json<RegisterPayload>,
) -> Result<Json<RegisterResponse>, ApiError> {
    if !payload.terms_accepted {
        return Err(ApiError::BadRequest("Terms must be accepted".into()));
    }

    let token_hash = hash_string(&payload.verification_token);

    let token_row = sqlx::query_as::<_, (String, String, i32)>(
        "SELECT phone_hash, expires_at, used FROM verification_token WHERE token_hash = $1"
    )
    .bind(&token_hash)
    .fetch_optional(&state.pool)
    .await?;

    let (phone_hash, expires_at_str, used) = match token_row {
        Some(r) => r,
        None => return Err(ApiError::BadRequest("Invalid verification token".into())),
    };

    if used == 1 {
        return Err(ApiError::BadRequest("Verification token already used".into()));
    }

    let expires_at = chrono::DateTime::parse_from_rfc3339(&expires_at_str)
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now());

    if Utc::now() > expires_at {
        return Err(ApiError::BadRequest("Verification token expired".into()));
    }

    let existing: Option<(String,)> = sqlx::query_as(
        "SELECT business_id FROM business_registry WHERE phone_hash = $1"
    )
    .bind(&phone_hash)
    .fetch_optional(&state.pool)
    .await?;

    if existing.is_some() {
        return Err(ApiError::Conflict("Business or phone already registered".into()));
    }

    sqlx::query("UPDATE verification_token SET used = 1 WHERE token_hash = $1")
        .bind(&token_hash)
        .execute(&state.pool)
        .await?;

    let workspace_id = format!("ws_{}", uuid::Uuid::new_v4().simple());
    let branch_id = format!("branch_{}", uuid::Uuid::new_v4().simple());

    let mut business_id = generate_business_id();
    for _ in 0..5 {
        let check: Option<(String,)> = sqlx::query_as("SELECT business_id FROM business_registry WHERE business_id = $1")
            .bind(&business_id)
            .fetch_optional(&state.pool)
            .await?;
        if check.is_none() {
            break;
        }
        business_id = generate_business_id();
    }

    let now_str = Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO business_registry (business_id, workspace_id, branch_id, phone_hash, terms_version, terms_locale, terms_text_sha256, terms_accepted_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        "#,
    )
    .bind(&business_id)
    .bind(&workspace_id)
    .bind(&branch_id)
    .bind(&phone_hash)
    .bind(&payload.terms_version)
    .bind(&payload.terms_locale)
    .bind(&payload.terms_text_sha256)
    .bind(&now_str)
    .bind(&now_str)
    .execute(&state.pool)
    .await?;

    let grant_payload = ActivationGrantPayload {
        business_id: business_id.clone(),
        workspace_id: workspace_id.clone(),
        branch_id: branch_id.clone(),
        phone_hash: phone_hash.clone(),
        issued_at: now_str,
    };

    let activation_grant = sign_grant(&grant_payload, &state.config.activation_signing_key)
        .map_err(|e| ApiError::Internal(e))?;

    Ok(Json(RegisterResponse {
        business_id,
        workspace_id,
        branch_id,
        activation_grant,
    }))
}
