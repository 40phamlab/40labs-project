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
