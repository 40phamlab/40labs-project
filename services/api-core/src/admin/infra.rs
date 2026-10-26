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
        .route("/infra/health", get(health_handler))
        .route("/infra/health/history", get(history_handler))
        .route("/infra/heartbeats", get(heartbeats_handler))
        .route("/infra/logs", get(logs_handler))
}

async fn health_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn history_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn heartbeats_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn logs_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}
