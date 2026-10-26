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
        .route("/analytics/revenue", get(revenue_handler))
        .route("/analytics/products", get(products_handler))
        .route("/analytics/growth", get(growth_handler))
}

async fn revenue_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn products_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn growth_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}
