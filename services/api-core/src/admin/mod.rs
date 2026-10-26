// PHASE: Admin-A
use axum::{
    middleware,
    Router,
    extract::{State, Request},
    http::{StatusCode, header, HeaderMap},
    response::Response,
};
use crate::routes::activation::AppState;

pub mod auth;
pub mod businesses;
pub mod analytics;
pub mod sync;
pub mod infra;

#[derive(Clone, Debug)]
pub struct AdminClaims {
    pub user_id: String,
    pub email: String,
    pub role: String,
}

async fn admin_auth_middleware(
    State(state): State<AppState>,
    mut req: Request,
    next: middleware::Next,
) -> Result<Response, StatusCode> {
    let path = req.uri().path();
    if path.contains("/auth/login") || path.contains("/auth/totp") {
        return Ok(next.run(req).await);
    }

    let session_id = extract_session_id(req.headers());
    let session_id = match session_id {
        Some(s) => s,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    let rec = sqlx::query_as::<_, (String, String, String, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>, Option<chrono::DateTime<chrono::Utc>>)>(
        "SELECT u.id, u.email, u.role, s.expires_at, s.revoked_at, u.disabled_at \
         FROM admin_sessions s \
         JOIN admin_users u ON s.admin_user_id = u.id \
         WHERE s.id = $1"
    )
    .bind(&session_id)
    .fetch_optional(&state.pool)
    .await;

    let (user_id, email, role, expires_at, revoked_at, disabled_at) = match rec {
        Ok(Some(row)) => row,
        _ => return Err(StatusCode::UNAUTHORIZED),
    };

    if revoked_at.is_some() || disabled_at.is_some() || expires_at <= chrono::Utc::now() {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Role check for verification POST
    if path.contains("/verification") && req.method() == axum::http::Method::POST {
        if role != "admin" {
            return Err(StatusCode::FORBIDDEN);
        }
    }

    let claims = AdminClaims {
        user_id,
        email,
        role,
    };
    req.extensions_mut().insert(claims);

    Ok(next.run(req).await)
}

fn extract_session_id(headers: &HeaderMap) -> Option<String> {
    if let Some(cookie_val) = headers.get(header::COOKIE) {
        if let Ok(cookie_str) = cookie_val.to_str() {
            for cookie in cookie_str.split(';') {
                let parts: Vec<&str> = cookie.trim().splitn(2, '=').collect();
                if parts.len() == 2 && parts[0] == "admin_session" {
                    return Some(parts[1].to_string());
                }
            }
        }
    }

    if let Some(auth_val) = headers.get(header::AUTHORIZATION) {
        if let Ok(auth_str) = auth_val.to_str() {
            if let Some(token) = auth_str.strip_prefix("Bearer ") {
                return Some(token.trim().to_string());
            }
        }
    }

    None
}

pub fn router(state: AppState) -> Router {
    let api_router = Router::new()
        .merge(auth::router(state.clone()))
        .merge(businesses::router(state.clone()))
        .merge(analytics::router(state.clone()))
        .merge(sync::router(state.clone()))
        .merge(infra::router(state.clone()))
        .route_layer(middleware::from_fn_with_state(state.clone(), admin_auth_middleware));

    Router::new().nest("/admin/v1", api_router)
}
