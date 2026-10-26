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
        .route("/auth/login", post(login_handler))
        .route("/auth/totp", post(totp_handler))
        .route("/auth/logout", post(logout_handler))
        .route("/me", get(me_handler))
}

async fn login_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn totp_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn logout_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn me_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}
