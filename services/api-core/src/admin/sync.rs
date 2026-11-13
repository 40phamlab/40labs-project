use crate::routes::activation::AppState;
use axum::{
    extract::{Query, State},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/sync/devices", get(devices_handler))
        .route("/sync/changes", get(changes_handler))
        .route("/sync/failures", get(failures_handler))
        .route(
            "/sync/devices/:device_id/revoke",
            post(revoke_device_handler),
        )
        .with_state(state)
}

async fn revoke_device_handler(
    State(state): State<AppState>,
    axum::extract::Path(device_id): axum::extract::Path<String>,
    axum::Extension(claims): axum::Extension<super::AdminClaims>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    let mut tx = state.pool.begin().await.map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
    let result = sqlx::query("UPDATE device_enrollments SET revoked_at=NOW(),token_version=token_version+1,refresh_token_hash='',refresh_expires_at=NOW() WHERE device_id=$1 AND revoked_at IS NULL")
        .bind(&device_id).execute(&mut *tx).await.map_err(|_|axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
    if result.rows_affected() != 1 {
        return Err(axum::http::StatusCode::NOT_FOUND);
    }
    sqlx::query("INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, payload) VALUES ($1, $2, 'device_revoked', 'device', $3, $4)")
        .bind(uuid::Uuid::new_v4().to_string()).bind(&claims.user_id).bind(&device_id)
        .bind(serde_json::json!({"revoked":true})).execute(&mut *tx).await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
    tx.commit().await.map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(
        serde_json::json!({"device_id":device_id,"revoked":true}),
    ))
}

#[derive(Deserialize)]
pub struct ChangesQuery {
    pub entity: Option<String>,
    pub business_id: Option<String>,
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

async fn devices_handler(State(state): State<AppState>) -> impl IntoResponse {
    let rows = sqlx::query_as::<
        _,
        (
            String,
            String,
            Option<String>,
            Option<chrono::DateTime<chrono::Utc>>,
            Option<i32>,
            Option<String>,
            Option<String>,
            Option<String>,
        ),
    >(
        r#"
        SELECT d.device_id, d.workspace_id, b.business_id,
               COALESCE(d.last_seen_at, d.last_seen), COALESCE(d.outbox_pending, d.pending_count),
               d.app_version, b.name, b.address_region
        FROM sync_devices d
        LEFT JOIN business_registry b ON d.workspace_id = b.workspace_id AND d.branch_id = b.branch_id
        ORDER BY COALESCE(d.last_seen_at, d.last_seen) DESC
        "#,
    )
    .fetch_all(&state.pool)
    .await;

    let devices = match rows {
        Ok(r) => r,
        Err(_) => return (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":"Could not load synchronization devices"}}))).into_response(),
    };

    let now = chrono::Utc::now();
    let list: Vec<_> = devices
        .into_iter()
        .map(
            |(dev_id, ws_id, biz_id, last_seen, pending, app_ver, biz_name, region)| {
                let age_secs = last_seen
                    .map(|t| (now - t).num_seconds())
                    .unwrap_or(i64::MAX);
                let status = if age_secs < 3600 {
                    "healthy"
                } else if age_secs < 172800 {
                    // 48h
                    "stale"
                } else {
                    "offline"
                };

                serde_json::json!({
                    "device_id": dev_id,
                    "workspace_id": ws_id,
                    "business_id": biz_id,
                    "business_name": biz_name,
                    "region": region,
                    "last_seen_at": last_seen.map(|t| t.to_rfc3339()),
                    "outbox_pending": pending,
                    "app_version": app_ver,
                    "status": status
                })
            },
        )
        .collect();

    Json(serde_json::json!({ "devices": list })).into_response()
}

async fn changes_handler(
    State(state): State<AppState>,
    Query(query): Query<ChangesQuery>,
) -> impl IntoResponse {
    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * page_size;

    let entity_filter = query.entity.clone();
    let biz_filter = query.business_id.clone();

    let rows = sqlx::query_as::<_, (String, String, String, String, String, i64, chrono::DateTime<chrono::Utc>, Option<String>)>(
        r#"
        SELECT c.change_id, c.entity, c.entity_id, c.device_id, c.workspace_id, c.version, c.received_at, b.name
        FROM sync_changes c
        LEFT JOIN business_registry b ON c.workspace_id = b.workspace_id AND c.branch_id = b.branch_id
        WHERE ($1::text IS NULL OR c.entity = $1)
          AND ($2::text IS NULL OR b.business_id = $2 OR c.workspace_id = $2)
        ORDER BY c.received_at DESC
        LIMIT $3 OFFSET $4
        "#,
    )
    .bind(entity_filter.as_deref())
    .bind(biz_filter.as_deref())
    .bind(page_size)
    .bind(offset)
    .fetch_all(&state.pool)
    .await;
    let rows = match rows {
        Ok(rows) => rows,
        Err(_) => return (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":"Could not load synchronization changes"}}))).into_response(),
    };

    let total: Result<i64, sqlx::Error> = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM sync_changes c
        LEFT JOIN business_registry b ON c.workspace_id = b.workspace_id AND c.branch_id = b.branch_id
        WHERE ($1::text IS NULL OR c.entity = $1)
          AND ($2::text IS NULL OR b.business_id = $2 OR c.workspace_id = $2)
        "#,
    )
    .bind(entity_filter.as_deref())
    .bind(biz_filter.as_deref())
    .fetch_one(&state.pool)
    .await;
    let total = match total {
        Ok(total) => total,
        Err(_) => return (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":"Could not count synchronization changes"}}))).into_response(),
    };

    let data: Vec<_> = rows
        .into_iter()
        .map(
            |(chg_id, entity, entity_id, dev_id, ws_id, version, received_at, biz_name)| {
                serde_json::json!({
                    "change_id": chg_id,
                    "entity": entity,
                    "entity_id": entity_id,
                    "device_id": dev_id,
                    "workspace_id": ws_id,
                    "business_name": biz_name,
                    "version": version,
                    "received_at": received_at.to_rfc3339()
                })
            },
        )
        .collect();

    Json(serde_json::json!({
        "data": data,
        "page": page,
        "page_size": page_size,
        "total": total
    })).into_response()
}

async fn failures_handler(State(state): State<AppState>) -> impl IntoResponse {
    let rows = sqlx::query_as::<_, (Option<String>, String, Option<String>, chrono::DateTime<chrono::Utc>, Option<serde_json::Value>)>(
        r#"
        SELECT e.business_id, e.message, e.device_id, e.ts, e.meta
        FROM ops_events e
        WHERE e.source = 'sync' AND (e.level = 'WARN' OR e.level = 'ERROR' OR e.message LIKE '%rejected%' OR e.message LIKE '%conflict%')
        ORDER BY e.ts DESC
        LIMIT 50
        "#,
    )
    .fetch_all(&state.pool)
    .await;
    let rows = match rows {
        Ok(rows) => rows,
        Err(_) => return (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":"Could not load synchronization failures"}}))).into_response(),
    };

    let mut grouped: std::collections::HashMap<String, serde_json::Value> =
        std::collections::HashMap::new();

    for (ws_id, msg, dev_id, ts, meta) in rows {
        let key = ws_id.clone().unwrap_or_else(|| "unknown".into());
        let entry = grouped.entry(key.clone()).or_insert_with(|| {
            serde_json::json!({
                "business_id": key,
                "count": 0,
                "failures": []
            })
        });
        let count = entry["count"].as_i64().unwrap_or(0) + 1;
        entry["count"] = serde_json::json!(count);
        let failures = entry["failures"].as_array_mut().unwrap();
        failures.push(serde_json::json!({
            "message": msg,
            "device_id": dev_id,
            "ts": ts.to_rfc3339(),
            "meta": meta
        }));
    }

    let list: Vec<_> = grouped.into_values().collect();

    Json(serde_json::json!({ "failures": list })).into_response()
}
