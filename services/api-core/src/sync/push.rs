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
    if req.device_id != claims.device_id {
        return Err(ApiError::Unauthorized(
            "Request device_id does not match authenticated device".into(),
        ));
    }

    let mut tx = state.pool.begin().await?;
    let telemetry = sqlx::query(
        "UPDATE sync_devices SET last_seen=NOW(), last_seen_at=NOW(), app_version=COALESCE($1,app_version) WHERE device_id=$2 AND workspace_id=$3 AND business_id=$4 AND branch_id=$5"
    ).bind(&req.app_version).bind(&claims.device_id).bind(&claims.workspace_id)
        .bind(&claims.business_id).bind(&claims.branch_id).execute(&mut *tx).await?;
    if telemetry.rows_affected() != 1 {
        return Err(ApiError::Unauthorized(
            "Enrolled device scope does not match telemetry record".into(),
        ));
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
                if ack.status == "rejected" || ack.status == "stale" {
                    let _ = sqlx::query(
                        "INSERT INTO ops_events (id, ts, level, source, message, business_id, device_id, meta) VALUES ($1, NOW(), 'WARN', 'sync', $2, $3, $4, $5)"
                    )
                    .bind(uuid::Uuid::new_v4().to_string())
                    .bind(format!("Sync change {} status: {}", change.entity, ack.status))
                    .bind(Some(claims.business_id.clone()))
                    .bind(Some(claims.device_id.clone()))
                    .bind(serde_json::json!({ "change_id": change.change_id, "entity": change.entity, "reason": ack.reason }))
                    .execute(&mut *tx)
                    .await;
                }
                ack.change_id = change.change_id.clone();
                acks.push(ack);
                sqlx::query(&format!("RELEASE SAVEPOINT {}", savepoint_name))
                    .execute(&mut *tx)
                    .await?;
            }
            Err(e) => {
                tracing::warn!(change_id = %change.change_id, error = ?e, "change_apply_error");
                let _ = sqlx::query(
                    "INSERT INTO ops_events (id, ts, level, source, message, business_id, device_id, meta) VALUES ($1, NOW(), 'ERROR', 'sync', $2, $3, $4, $5)"
                )
                .bind(uuid::Uuid::new_v4().to_string())
                .bind(format!("Sync change apply error: {}", e))
                .bind(Some(claims.workspace_id.clone()))
                .bind(Some(req.device_id.clone()))
                .bind(serde_json::json!({ "change_id": change.change_id, "entity": change.entity, "error": e.to_string() }))
                .execute(&mut *tx)
                .await;

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

    // Telemetry was updated using all authenticated scope fields before applying changes.

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
    if req.device_id != claims.device_id {
        return Err(ApiError::Unauthorized(
            "Request device_id does not match authenticated device".into(),
        ));
    }
    let updated = sqlx::query(
        "UPDATE sync_devices SET last_seen=NOW(),last_seen_at=NOW(),pending_count=$1,outbox_pending=$1,app_version=$2 WHERE device_id=$3 AND workspace_id=$4 AND business_id=$5 AND branch_id=$6"
    ).bind(req.pending_count).bind(&req.app_version).bind(&claims.device_id)
        .bind(&claims.workspace_id).bind(&claims.business_id).bind(&claims.branch_id)
        .execute(&state.pool).await?;
    if updated.rows_affected() != 1 {
        return Err(ApiError::Unauthorized(
            "Enrolled device scope does not match telemetry record".into(),
        ));
    }
    Ok(Json(
        serde_json::json!({ "status": "heartbeat_acknowledged" }),
    ))
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
        "SELECT verification_status, labs_verified, tmda_registered, rejection_reason, updated_at FROM business_registry WHERE workspace_id = $1 AND business_id = $2 AND branch_id = $3"
    )
    .bind(&claims.workspace_id)
    .bind(&claims.business_id)
    .bind(&claims.branch_id)
    .fetch_optional(&state.pool)
    .await?;

    let (status, labs_verified, tmda_registered, rejection_reason, updated_at) = match row {
        Some(r) => r,
        None => {
            return Err(ApiError::Unauthorized(
                "Business not found for claims".into(),
            ))
        }
    };

    Ok(Json(VerificationResponse {
        status: status.unwrap_or_else(|| "unverified".into()),
        labs_verified: labs_verified.unwrap_or(false),
        tmda_registered: tmda_registered.unwrap_or(false),
        rejection_reason,
        updated_at: updated_at.map(|dt| dt.to_rfc3339()),
    }))
}
