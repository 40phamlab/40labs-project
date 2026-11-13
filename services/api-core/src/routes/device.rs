use crate::{
    auth::device::{
        create_refresh_token, hash_refresh_token, issue_access_token, DeviceCredentials,
        DeviceIdentity, DEVICE_REFRESH_TTL_DAYS, DEVICE_TOKEN_TTL_SECONDS,
    },
    error::ApiError,
    grant::{verify_grant, ACTIVATION_GRANT_AUDIENCE, ACTIVATION_GRANT_ISSUER},
    routes::activation::AppState,
};
use axum::{extract::State, routing::post, Json, Router};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/v1/devices/enroll", post(enroll_device))
        .route("/v1/devices/refresh", post(refresh_device_token))
        .with_state(state)
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EnrollDeviceRequest {
    pub activation_grant: String,
    pub device_id: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RefreshDeviceRequest {
    pub device_id: String,
    pub refresh_token: String,
}

#[derive(Serialize)]
pub struct DeviceCredentialResponse {
    pub device_id: String,
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
    pub expires_in: i64,
    pub refresh_expires_at: String,
}

impl From<DeviceCredentials> for DeviceCredentialResponse {
    fn from(c: DeviceCredentials) -> Self {
        Self {
            device_id: c.device_id,
            access_token: c.access_token,
            refresh_token: c.refresh_token,
            token_type: c.token_type,
            expires_in: c.expires_in,
            refresh_expires_at: c.refresh_expires_at.to_rfc3339(),
        }
    }
}

fn valid_device_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 128
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}
fn grant_hash(grant: &str) -> String {
    hex::encode(Sha256::digest(grant.as_bytes()))
}

async fn enroll_device(
    State(state): State<AppState>,
    Json(req): Json<EnrollDeviceRequest>,
) -> Result<Json<DeviceCredentialResponse>, ApiError> {
    if !valid_device_id(&req.device_id) {
        return Err(ApiError::BadRequest("Invalid device_id".into()));
    }
    let grant = verify_grant(
        &req.activation_grant,
        &state.config.activation_signing_key,
        Utc::now(),
    )
    .map_err(ApiError::Unauthorized)?;
    if grant.issuer != ACTIVATION_GRANT_ISSUER || grant.audience != ACTIVATION_GRANT_AUDIENCE {
        return Err(ApiError::Unauthorized(
            "Activation grant cannot enroll a device".into(),
        ));
    }
    let mut tx = state.pool.begin().await?;
    let registry = sqlx::query_as::<_, (String,String,String)>(
        "SELECT business_id, workspace_id, branch_id FROM business_registry WHERE business_id = $1 AND workspace_id = $2 AND branch_id = $3 AND phone_hash = $4 FOR SHARE"
    ).bind(&grant.business_id).bind(&grant.workspace_id).bind(&grant.branch_id).bind(&grant.phone_hash).fetch_optional(&mut *tx).await?;
    if registry.is_none() {
        return Err(ApiError::Unauthorized(
            "Activation grant scope is not registered".into(),
        ));
    }
    let now = Utc::now();
    let refresh_expires = now + Duration::days(DEVICE_REFRESH_TTL_DAYS);
    let refresh = create_refresh_token();
    let refresh_hash = hash_refresh_token(&refresh);
    let used = sqlx::query("INSERT INTO device_enrollment_grants (grant_sha256,device_id,consumed_at) VALUES ($1,$2,NOW()) ON CONFLICT (grant_sha256) DO NOTHING")
        .bind(grant_hash(&req.activation_grant)).bind(&req.device_id).execute(&mut *tx).await?;
    if used.rows_affected() != 1 {
        return Err(ApiError::Conflict(
            "Activation grant has already enrolled a device".into(),
        ));
    }
    // Registration can be retried after server enrollment succeeded but the
    // desktop failed to finish its local transaction. Rotate credentials for
    // an active enrollment in the exact same scope, while refusing to move a
    // device between businesses or revive a revoked enrollment.
    let enrollment = sqlx::query_scalar::<_, i32>(
        r#"
        INSERT INTO device_enrollments (
            device_id, business_id, workspace_id, branch_id, refresh_token_hash,
            refresh_expires_at, token_version, created_at, last_seen_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 1, NOW(), NOW())
        ON CONFLICT (device_id) DO UPDATE SET
            refresh_token_hash = EXCLUDED.refresh_token_hash,
            refresh_expires_at = EXCLUDED.refresh_expires_at,
            token_version = device_enrollments.token_version + 1,
            last_seen_at = NOW()
        WHERE device_enrollments.business_id = EXCLUDED.business_id
          AND device_enrollments.workspace_id = EXCLUDED.workspace_id
          AND device_enrollments.branch_id = EXCLUDED.branch_id
          AND device_enrollments.revoked_at IS NULL
        RETURNING token_version
        "#,
    )
    .bind(&req.device_id)
    .bind(&grant.business_id)
    .bind(&grant.workspace_id)
    .bind(&grant.branch_id)
    .bind(&refresh_hash)
    .bind(refresh_expires)
    .fetch_optional(&mut *tx)
    .await?;
    let Some(token_version) = enrollment else {
        return Err(ApiError::Conflict(
            "Device is enrolled to another business or its enrollment was revoked".into(),
        ));
    };

    let sync_device = sqlx::query(
        r#"
        INSERT INTO sync_devices (
            workspace_id, branch_id, business_id, device_id,
            last_seen, last_seen_at, pending_count, outbox_pending
        )
        VALUES ($1, $2, $3, $4, NOW(), NOW(), 0, 0)
        ON CONFLICT (device_id) DO UPDATE SET
            last_seen = NOW(),
            last_seen_at = NOW()
        WHERE sync_devices.workspace_id = EXCLUDED.workspace_id
          AND sync_devices.branch_id = EXCLUDED.branch_id
          AND sync_devices.business_id = EXCLUDED.business_id
        "#,
    )
    .bind(&grant.workspace_id)
    .bind(&grant.branch_id)
    .bind(&grant.business_id)
    .bind(&req.device_id)
    .execute(&mut *tx)
    .await?;
    if sync_device.rows_affected() != 1 {
        return Err(ApiError::Conflict(
            "Device sync record belongs to another business".into(),
        ));
    }
    let identity = DeviceIdentity {
        device_id: req.device_id.clone(),
        workspace_id: grant.workspace_id,
        business_id: grant.business_id,
        branch_id: grant.branch_id,
        token_version,
    };
    let access = issue_access_token(&state.config.device_token_keys, &identity, now)?;
    tx.commit().await?;
    Ok(Json(DeviceCredentialResponse {
        device_id: req.device_id,
        access_token: access,
        refresh_token: refresh,
        token_type: "Bearer".into(),
        expires_in: DEVICE_TOKEN_TTL_SECONDS,
        refresh_expires_at: refresh_expires.to_rfc3339(),
    }))
}

async fn refresh_device_token(
    State(state): State<AppState>,
    Json(req): Json<RefreshDeviceRequest>,
) -> Result<Json<DeviceCredentialResponse>, ApiError> {
    if !valid_device_id(&req.device_id)
        || req.refresh_token.len() < 32
        || req.refresh_token.len() > 256
    {
        return Err(ApiError::Unauthorized("Invalid refresh credentials".into()));
    }
    let mut tx = state.pool.begin().await?;
    let row=sqlx::query_as::<_,(String,String,String,i32,Option<chrono::DateTime<chrono::Utc>>,chrono::DateTime<chrono::Utc>)>(
        "SELECT business_id,workspace_id,branch_id,token_version,revoked_at,refresh_expires_at FROM device_enrollments WHERE device_id=$1 AND refresh_token_hash=$2 FOR UPDATE"
    ).bind(&req.device_id).bind(hash_refresh_token(&req.refresh_token)).fetch_optional(&mut *tx).await?;
    let (business_id, workspace_id, branch_id, token_version, revoked_at, expires_at) =
        row.ok_or_else(|| ApiError::Unauthorized("Invalid refresh credentials".into()))?;
    let now = Utc::now();
    if revoked_at.is_some() || expires_at <= now {
        return Err(ApiError::Unauthorized(
            "Device refresh credential is revoked or expired".into(),
        ));
    }
    let next_refresh = create_refresh_token();
    let next_hash = hash_refresh_token(&next_refresh);
    let next_expires = now + Duration::days(DEVICE_REFRESH_TTL_DAYS);
    let updated=sqlx::query("UPDATE device_enrollments SET refresh_token_hash=$1,refresh_expires_at=$2,last_seen_at=NOW() WHERE device_id=$3 AND refresh_token_hash=$4 AND revoked_at IS NULL")
        .bind(&next_hash).bind(next_expires).bind(&req.device_id).bind(hash_refresh_token(&req.refresh_token)).execute(&mut *tx).await?;
    if updated.rows_affected() != 1 {
        return Err(ApiError::Unauthorized(
            "Refresh credential was already rotated".into(),
        ));
    }
    let identity = DeviceIdentity {
        device_id: req.device_id.clone(),
        workspace_id,
        business_id,
        branch_id,
        token_version,
    };
    let access = issue_access_token(&state.config.device_token_keys, &identity, now)?;
    tx.commit().await?;
    Ok(Json(DeviceCredentialResponse {
        device_id: req.device_id,
        access_token: access,
        refresh_token: next_refresh,
        token_type: "Bearer".into(),
        expires_in: DEVICE_TOKEN_TTL_SECONDS,
        refresh_expires_at: next_expires.to_rfc3339(),
    }))
}
