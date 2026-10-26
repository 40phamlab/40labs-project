use axum::{
    routing::get,
    Router,
    response::IntoResponse,
    Json,
    extract::{State, Query},
};
use serde::Deserialize;
use crate::routes::activation::AppState;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/sync/devices", get(devices_handler))
        .route("/sync/changes", get(changes_handler))
        .route("/sync/failures", get(failures_handler))
        .with_state(state)
}

#[derive(Deserialize)]
pub struct ChangesQuery {
    pub entity: Option<String>,
    pub business_id: Option<String>,
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

async fn devices_handler(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let rows = sqlx::query_as::<_, (String, String, String, Option<chrono::DateTime<chrono::Utc>>, Option<i32>, Option<String>, Option<String>, Option<String>)>(
        r#"
        SELECT d.device_id, d.workspace_id, COALESCE(b.business_id, d.workspace_id),
               COALESCE(d.last_seen_at, d.last_seen), COALESCE(d.outbox_pending, d.pending_count),
               d.app_version, b.name, b.address_region
        FROM sync_devices d
        LEFT JOIN business_registry b ON d.workspace_id = b.workspace_id
        ORDER BY COALESCE(d.last_seen_at, d.last_seen) DESC
        "#,
    )
    .fetch_all(&state.pool)
    .await;

    let devices = match rows {
        Ok(r) => r,
        Err(_) => vec![],
    };

    let now = chrono::Utc::now();
    let list: Vec<_> = devices.into_iter().map(|(dev_id, ws_id, biz_id, last_seen, pending, app_ver, biz_name, region)| {
        let age_secs = last_seen.map(|t| (now - t).num_seconds()).unwrap_or(i64::MAX);
        let status = if age_secs < 3600 {
            "healthy"
        } else if age_secs < 172800 { // 48h
            "stale"
        } else {
            "offline"
        };

        serde_json::json!({
            "device_id": dev_id,
            "workspace_id": ws_id,
            "business_id": biz_id,
            "business_name": biz_name.unwrap_or_else(|| "Unknown Business".into()),
            "region": region.unwrap_or_else(|| "Unknown".into()),
            "last_seen_at": last_seen.map(|t| t.to_rfc3339()),
            "outbox_pending": pending.unwrap_or(0),
            "app_version": app_ver,
            "status": status
        })
    }).collect();

    Json(serde_json::json!({ "devices": list }))
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
        LEFT JOIN business_registry b ON c.workspace_id = b.workspace_id
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
    .await
    .unwrap_or_default();

    let total: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM sync_changes c
        LEFT JOIN business_registry b ON c.workspace_id = b.workspace_id
        WHERE ($1::text IS NULL OR c.entity = $1)
          AND ($2::text IS NULL OR b.business_id = $2 OR c.workspace_id = $2)
        "#,
    )
    .bind(entity_filter.as_deref())
    .bind(biz_filter.as_deref())
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    let data: Vec<_> = rows.into_iter().map(|(chg_id, entity, entity_id, dev_id, ws_id, version, received_at, biz_name)| {
        serde_json::json!({
            "change_id": chg_id,
            "entity": entity,
            "entity_id": entity_id,
            "device_id": dev_id,
            "workspace_id": ws_id,
            "business_name": biz_name.unwrap_or_else(|| "Unknown Business".into()),
            "version": version,
            "received_at": received_at.to_rfc3339()
        })
    }).collect();

    Json(serde_json::json!({
        "data": data,
        "page": page,
        "page_size": page_size,
        "total": total
    }))
}

async fn failures_handler(
    State(state): State<AppState>,
) -> impl IntoResponse {
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
    .await
    .unwrap_or_default();

    let mut grouped: std::collections::HashMap<String, serde_json::Value> = std::collections::HashMap::new();

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

    Json(serde_json::json!({ "failures": list }))
}
