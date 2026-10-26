// PHASE: Admin-A
use axum::{
    routing::{get, post},
    Router,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use crate::routes::activation::AppState;

pub fn router(_state: AppState) -> Router {
    Router::new()
        .route("/businesses", get(list_businesses))
        .route("/businesses/:business_id", get(get_business))
        .route("/businesses/:business_id/stock", get(get_stock))
        .route("/businesses/:business_id/sync", get(get_sync))
        .route("/businesses/:business_id/verification", post(verify_business))
}

async fn list_businesses() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn get_business() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn get_stock() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn get_sync() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn verify_business() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}
