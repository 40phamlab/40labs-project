use axum::{
    extract::{Extension, State},
    middleware,
    routing::{get, post},
    Json, Router,
};
use serde_json::{json, Value};
use std::sync::Arc;

use super::{pairing, auth::{AuthedDevice, auth_middleware}, LanServerState};

pub async fn devices_me_handler(Extension(AuthedDevice { device }): Extension<AuthedDevice>) -> Json<Value> {
    let permissions: Value = serde_json::from_str(&device.permissions_json).unwrap_or_default();
    Json(json!({
        "id": device.id,
        "deviceLabel": device.device_label,
        "deviceType": device.device_type,
        "status": device.status,
        "userId": device.user_id,
        "permissions": permissions,
        "lastConnectedAt": device.last_connected_at,
        "pairedAt": device.paired_at
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
