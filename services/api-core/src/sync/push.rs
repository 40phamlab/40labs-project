use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use serde::Serialize;

use crate::{
    auth::device::DeviceClaims,
    error::ApiError,
    routes::activation::AppState,
    sync::{
        apply::{apply_change, ChangeAckResponse},
        validate::{decompress_gzip, validate_push_payload, HeartbeatRequest, PushRequest},
    },
};

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/v1/health", get(health_handler))
        .route("/v1/sync/push", post(push_handler))
        .route("/v1/sync/heartbeat", post(heartbeat_handler))
        .route("/v1/business/verification", get(verification_handler))
        .with_state(state)
}

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub time: String,
}

async fn health_handler() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".into(),
        time: Utc::now().to_rfc3339(),
    })
}

#[derive(Serialize)]
pub struct PushResponse {
    pub acks: Vec<ChangeAckResponse>,
    pub server_cursor: String,
}

async fn push_handler(
    State(state): State<AppState>,
    claims: DeviceClaims,
    body: axum::body::Bytes,
) -> Result<Json<PushResponse>, ApiError> {
    // 1. Decompress and validate size (max 1 MB)
    let decompressed = decompress_gzip(&body, 1_048_576)?;
    let req: PushRequest = serde_json::from_slice(&decompressed)
        .map_err(|e| ApiError::BadRequest(format!("Invalid JSON push request: {}", e)))?;

    validate_push_payload(&req)?;

    let mut tx = state.pool.begin().await?;

    // 2. Device pinning check: sync_devices has UNIQUE(workspace_id)
    let existing_device: Option<(String,)> = sqlx::query_as(
        "SELECT device_id FROM sync_devices WHERE workspace_id = $1"
    )
    .bind(&claims.workspace_id)
    .fetch_optional(&mut *tx)
    .await?;

    match existing_device {
        Some((dev_id,)) if dev_id != req.device_id && dev_id != claims.device_id => {
            return Err(ApiError::Conflict(format!(
                "device_mismatch: workspace already pinned to device {}",
                dev_id
            )));
        }
        _ => {
            sqlx::query(
                r#"
                INSERT INTO sync_devices (workspace_id, branch_id, device_id, last_seen, app_version)
                VALUES ($1, '', $2, NOW(), $3)
                ON CONFLICT (device_id) DO UPDATE SET
                    workspace_id = EXCLUDED.workspace_id,
                    last_seen = NOW(),
                    app_version = EXCLUDED.app_version
                "#,
            )
            .bind(&claims.workspace_id)
            .bind(&req.device_id)
            .bind(&req.app_version)
            .execute(&mut *tx)
            .await?;
        }
    }

    // 3. Process changes in individual SAVEPOINTs
    let mut acks = Vec::new();
    for change in &req.changes {
        let savepoint_name = format!("sp_{}", uuid::Uuid::new_v4().simple());
        sqlx::query(&format!("SAVEPOINT {}", savepoint_name))
            .execute(&mut *tx)
            .await?;

        match apply_change(&mut *tx, &claims, change).await {
            Ok(mut ack) => {
                ack.change_id = change.change_id.clone();
                acks.push(ack);
                sqlx::query(&format!("RELEASE SAVEPOINT {}", savepoint_name))
                    .execute(&mut *tx)
                    .await?;
            }
            Err(e) => {
                tracing::warn!(change_id = %change.change_id, error = ?e, "change_apply_error");
                sqlx::query(&format!("ROLLBACK TO SAVEPOINT {}", savepoint_name))
                    .execute(&mut *tx)
                    .await?;
                acks.push(ChangeAckResponse {
                    change_id: change.change_id.clone(),
                    status: "rejected".into(),
                    reason: Some(e.to_string()),
                });
            }
        }
    }

    // 4. Update sync_devices last_seen & app_version
    sqlx::query(
        "UPDATE sync_devices SET last_seen = NOW(), app_version = $1 WHERE workspace_id = $2"
    )
    .bind(&req.app_version)
    .bind(&claims.workspace_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    let server_cursor = Utc::now().to_rfc3339();

    Ok(Json(PushResponse {
        acks,
        server_cursor,
    }))
}

async fn heartbeat_handler(
    State(state): State<AppState>,
    claims: DeviceClaims,
    Json(req): Json<HeartbeatRequest>,
) -> Result<Json<serde_json::Value>, ApiError> {
    sqlx::query(
        r#"
        INSERT INTO sync_devices (workspace_id, branch_id, device_id, last_seen, pending_count, app_version)
        VALUES ($1, '', $2, NOW(), $3, $4)
        ON CONFLICT (device_id) DO UPDATE SET
            workspace_id = EXCLUDED.workspace_id,
            last_seen = NOW(),
            pending_count = EXCLUDED.pending_count,
            app_version = EXCLUDED.app_version
        "#,
    )
    .bind(&claims.workspace_id)
    .bind(&req.device_id)
    .bind(req.pending_count)
    .bind(&req.app_version)
    .execute(&state.pool)
    .await?;

    Ok(Json(serde_json::json!({ "status": "heartbeat_acknowledged" })))
}

#[derive(Serialize)]
pub struct VerificationResponse {
    pub status: String,
    pub labs_verified: bool,
    pub tmda_registered: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rejection_reason: Option<String>,
    pub updated_at: Option<String>,
}

async fn verification_handler(
    State(state): State<AppState>,
    claims: DeviceClaims,
) -> Result<Json<VerificationResponse>, ApiError> {
    let row = sqlx::query_as::<_, (Option<String>, Option<bool>, Option<bool>, Option<String>, Option<chrono::DateTime<Utc>>)>(
        "SELECT verification_status, labs_verified, tmda_registered, rejection_reason, updated_at FROM business_registry WHERE workspace_id = $1 AND business_id = $2"
    )
    .bind(&claims.workspace_id)
    .bind(&claims.business_id)
    .fetch_optional(&state.pool)
    .await?;

    let (status, labs_verified, tmda_registered, rejection_reason, updated_at) = match row {
        Some(r) => r,
        None => return Err(ApiError::Unauthorized("Business not found for claims".into())),
    };

    Ok(Json(VerificationResponse {
        status: status.unwrap_or_else(|| "unverified".into()),
        labs_verified: labs_verified.unwrap_or(false),
        tmda_registered: tmda_registered.unwrap_or(false),
        rejection_reason,
        updated_at: updated_at.map(|dt| dt.to_rfc3339()),
    }))
}
