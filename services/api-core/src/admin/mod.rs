// PHASE: Admin-A
use axum::{
    middleware,
    Router,
};
use crate::routes::activation::AppState;

pub mod auth;
pub mod businesses;
pub mod analytics;
pub mod sync;
pub mod infra;

async fn admin_auth_middleware(
    req: axum::extract::Request,
    next: middleware::Next,
) -> Result<axum::response::Response, axum::http::StatusCode> {
    let path = req.uri().path();
    if path.contains("/auth/login") || path.contains("/auth/totp") {
        return Ok(next.run(req).await);
    }

    let auth_header = req.headers().get(axum::http::header::AUTHORIZATION);
    if let Some(_header) = auth_header {
        return Ok(next.run(req).await);
    }

    Err(axum::http::StatusCode::UNAUTHORIZED)
}

pub fn router(state: AppState) -> Router {
    let api_router = Router::new()
        .merge(auth::router(state.clone()))
        .merge(businesses::router(state.clone()))
        .merge(analytics::router(state.clone()))
        .merge(sync::router(state.clone()))
        .merge(infra::router(state.clone()))
        .route_layer(middleware::from_fn(admin_auth_middleware));

    Router::new().nest("/admin/v1", api_router)
}
