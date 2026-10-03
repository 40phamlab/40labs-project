use axum::{
    extract::{Extension, State},
    middleware,
    routing::{get, post},
    Json, Router,
};
use serde_json::{json, Value};
use sqlx::Row;
use std::sync::Arc;

use super::{pairing, auth::{AuthedDevice, auth_middleware}, LanServerState};

pub async fn devices_me_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
) -> Json<Value> {
    let mut permissions: Value = serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));

    if let Some(obj) = permissions.as_object_mut() {
        obj.entry("can_view_stock").or_insert(json!(true));
        obj.entry("can_create_sale").or_insert(json!(true));
        obj.entry("can_manage_customers").or_insert(json!(true));
        obj.entry("can_record_lab_result").or_insert(json!(true));
        obj.entry("can_send_notifications").or_insert(json!(true));
    }

    let user_record = sqlx::query("SELECT id, full_name, role FROM app_user WHERE id = ?")
        .bind(&device.user_id)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();

    let user_info = match user_record {
        Some(u) => {
            let id: String = u.get("id");
            let full_name: String = u.get("full_name");
            let role: String = u.get("role");
            json!({
                "id": id,
                "name": full_name,
                "role": role
            })
        }
        None => json!({
            "id": device.user_id,
            "name": "Assigned Staff",
            "role": "staff"
        }),
    };

    Json(json!({
        "device": {
            "id": device.id,
            "deviceLabel": device.device_label,
            "deviceType": device.device_type,
            "status": device.status
        },
        "permissions": permissions,
        "user": user_info,
        "businessName": "40Labs Pharmacy"
    }))
}

pub async fn staff_roster_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(_auth): Extension<AuthedDevice>,
) -> Json<Value> {
    let staff_rows = sqlx::query("SELECT id, full_name, role FROM app_user WHERE active = 1")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let roster: Vec<Value> = staff_rows
        .into_iter()
        .map(|row| {
            let id: String = row.get("id");
            let full_name: String = row.get("full_name");
            let role: String = row.get("role");
            json!({
                "id": id,
                "displayName": full_name,
                "jobRole": role
            })
        })
        .collect();

    Json(json!(roster))
}

pub async fn summary_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(_auth): Extension<AuthedDevice>,
) -> Json<Value> {
    let today_date_row = sqlx::query("SELECT date('now', '+3 hours') as dt")
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();

    let today_str = today_date_row
        .and_then(|r| r.try_get::<String, _>("dt").ok())
        .unwrap_or_else(|| "2026-10-02".to_string());

    let sales_row = sqlx::query("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as total FROM sale WHERE date(created_at, '+3 hours') = ?")
        .bind(&today_str)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let sales_total: i64 = sales_row.as_ref().and_then(|r| r.try_get("total").ok()).unwrap_or(0);

    let patients_row = sqlx::query("SELECT COUNT(*) as cnt FROM customer WHERE date(created_at, '+3 hours') = ?")
        .bind(&today_str)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let patients_count: i64 = patients_row.and_then(|r| r.try_get("cnt").ok()).unwrap_or(0);

    let samples_row = sqlx::query("SELECT COUNT(*) as cnt FROM lab_sample WHERE date(created_at, '+3 hours') = ?")
        .bind(&today_str)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let samples_count: i64 = samples_row.and_then(|r| r.try_get("cnt").ok()).unwrap_or(0);

    let results_row = sqlx::query("SELECT COUNT(*) as cnt FROM lab_order WHERE status = 'completed' AND date(updated_at, '+3 hours') = ?")
        .bind(&today_str)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let results_count: i64 = results_row.and_then(|r| r.try_get("cnt").ok()).unwrap_or(0);

    let low_stock_row = sqlx::query("SELECT COUNT(*) as cnt FROM inventory_item WHERE quantity <= min_stock_level")
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let low_stock_count: i64 = low_stock_row.and_then(|r| r.try_get("cnt").ok()).unwrap_or(0);

    Json(json!({
        "sales": sales_total,
        "patients": patients_count,
        "samples": samples_count,
        "results": results_count,
        "lowStockCount": low_stock_count,
        "alerts": 0,
        "unreadNotifications": 0
    }))
}

pub async fn activity_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
) -> Json<Value> {
    let user_id = device.user_id;

    let sales = sqlx::query("SELECT id, total_amount, created_at FROM sale WHERE user_id = ? AND created_at >= datetime('now', '-30 days') ORDER BY created_at DESC LIMIT 50")
        .bind(&user_id)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let patients = sqlx::query("SELECT id, full_name, created_at FROM customer WHERE created_at >= datetime('now', '-30 days') ORDER BY created_at DESC LIMIT 50")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let samples = sqlx::query("SELECT id, sample_type, created_at FROM lab_sample WHERE created_at >= datetime('now', '-30 days') ORDER BY created_at DESC LIMIT 50")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let mut items: Vec<Value> = Vec::new();

    for row in sales {
        let id: String = row.get("id");
        let total: i64 = row.get("total_amount");
        let created_at: String = row.get("created_at");
        items.push(json!({
            "id": format!("sale-{}", id),
            "type": "sale",
            "title": "Sale Completed",
            "subject": format!("TZS {}", total),
            "createdAt": created_at,
            "status": "done"
        }));
    }

    for row in patients {
        let id: String = row.get("id");
        let name: String = row.get("full_name");
        let created_at: String = row.get("created_at");
        items.push(json!({
            "id": format!("patient-{}", id),
            "type": "patient_added",
            "title": "Patient Added",
            "subject": name,
            "createdAt": created_at,
            "status": "done"
        }));
    }

    for row in samples {
        let id: String = row.get("id");
        let stype: String = row.get("sample_type");
        let created_at: String = row.get("created_at");
        items.push(json!({
            "id": format!("sample-{}", id),
            "type": "lab_sample",
            "title": "Lab Sample Collected",
            "subject": stype,
            "createdAt": created_at,
            "status": "done"
        }));
    }

    items.sort_by(|a, b| {
        let a_time = a.get("createdAt").and_then(|v| v.as_str()).unwrap_or("");
        let b_time = b.get("createdAt").and_then(|v| v.as_str()).unwrap_or("");
        b_time.cmp(a_time)
    });

    Json(json!({
        "items": items,
        "nextCursor": null
    }))
}

pub async fn heartbeat_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
) -> Json<Value> {
    let _ = crate::repositories::device_repo::update_last_connected(&state.pool, &device.id).await;
    Json(json!({
        "status": "ok",
        "deviceId": device.id,
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

pub fn create_router(state: Arc<LanServerState>) -> Router {
    let protected_routes = Router::new()
        .route("/devices/me", get(devices_me_handler))
        .route("/devices/me/heartbeat", post(heartbeat_handler))
        .route("/staff/roster", get(staff_roster_handler))
        .route("/me/summary", get(summary_handler))
        .route("/activity", get(activity_handler))
        .route_layer(middleware::from_fn_with_state(
            Arc::clone(&state),
            auth_middleware,
        ));

    Router::new()
        .route("/api/pairing/health", get(pairing::health_handler))
        .route("/api/pairing/pair", post(pairing::pair_handler))
        .nest("/api/v1", protected_routes)
        .with_state(state)
}
