// PHASE: Admin-A
use axum::{
    routing::get,
    Router,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use crate::routes::activation::AppState;

pub fn router(_state: AppState) -> Router {
    Router::new()
        .route("/sync/devices", get(devices_handler))
        .route("/sync/changes", get(changes_handler))
        .route("/sync/failures", get(failures_handler))
}

async fn devices_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn changes_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn failures_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}
