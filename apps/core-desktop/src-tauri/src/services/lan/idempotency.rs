use axum::{
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use sqlx::SqlitePool;

pub async fn check_idempotency(
    pool: &SqlitePool,
    workspace_id: &str,
    headers: &HeaderMap,
    route: &str,
) -> Result<Option<(StatusCode, Json<Value>)>, (StatusCode, String)> {
    let key = headers
        .get("idempotency-key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                "Missing Idempotency-Key header".to_string(),
            )
        })?;

    let row = sqlx::query(
        "SELECT response_status, response_json FROM idempotency_cache WHERE workspace_id = ? AND idempotency_key = ? AND route = ?"
    )
    .bind(workspace_id)
    .bind(&key)
    .bind(route)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::warn!(error = %e, "Failed to query idempotency cache");
        (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
    })?;

    if let Some(r) = row {
        let status_code: i64 = r.get("response_status");
        let json_str: String = r.get("response_json");
        let parsed: Value = serde_json::from_str(&json_str).unwrap_or(json!({}));
        let status = StatusCode::from_u16(status_code as u16).unwrap_or(StatusCode::OK);
        return Ok(Some((status, Json(parsed))));
    }

    Ok(None)
}

pub async fn store_idempotency(
    pool: &SqlitePool,
    workspace_id: &str,
    headers: &HeaderMap,
    route: &str,
    status: StatusCode,
    body: &Value,
) {
    if let Some(key) = headers.get("idempotency-key").and_then(|v| v.to_str().ok()) {
        let now = chrono::Utc::now().to_rfc3339();
        let json_str = body.to_string();
        let _ = sqlx::query(
            "INSERT OR REPLACE INTO idempotency_cache (workspace_id, idempotency_key, route, response_status, response_json, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(workspace_id)
        .bind(key)
        .bind(route)
        .bind(status.as_u16() as i64)
        .bind(json_str)
        .bind(now)
        .execute(pool)
        .await
        .map_err(|e| {
            tracing::warn!(error = %e, "Failed to store idempotency cache");
        });
    }
}
use sqlx::Row;
