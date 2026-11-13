// PHASE: Admin-A
use crate::routes::activation::AppState;
use axum::{
    extract::{Request, State},
    http::{header, HeaderMap, StatusCode},
    middleware,
    response::Response,
    Router,
};

pub mod analytics;
pub mod auth;
pub mod businesses;
pub mod infra;
pub mod management;
pub mod sync;

#[derive(Clone, Debug)]
pub struct AdminClaims {
    pub user_id: String,
    pub email: String,
    pub role: String,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AdminAction {
    Read,
    Write,
    Manage,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AdminResource {
    Auth,
    Businesses,
    Analytics,
    Sync,
    Infrastructure,
    Logs,
    AdminUsers,
}

/// Central, default-deny role policy. Unknown roles and unmapped routes never gain access.
pub fn role_allows(role: &str, action: AdminAction, resource: AdminResource) -> bool {
    use AdminAction::{Manage, Read, Write};
    use AdminResource::{AdminUsers, Analytics, Auth, Businesses, Infrastructure, Logs, Sync};
    match role {
        "super_admin" => true,
        "admin" => match (resource, action) {
            (Auth, Read | Write | Manage)
            | (Businesses, Read | Write | Manage)
            | (Analytics, Read)
            | (Sync, Read | Write)
            | (Infrastructure, Read) => true,
            (Logs, Read) => true,
            (AdminUsers, Read) => true,
            _ => false,
        },
        "reviewer" => matches!(
            (resource, action),
            (Auth, Write)
                | (Businesses, Read)
                | (Analytics, Read)
                | (Sync, Read)
                | (Infrastructure, Read)
        ),
        "viewer" => matches!(
            (resource, action),
            (Auth, Write) | (Businesses, Read) | (Analytics, Read)
        ),
        _ => false,
    }
}

fn route_permission(
    method: &axum::http::Method,
    path: &str,
) -> Option<(AdminResource, AdminAction)> {
    use AdminAction::{Read, Write};
    use AdminResource::{AdminUsers, Analytics, Auth, Businesses, Infrastructure, Logs, Sync};
    let segments: Vec<_> = path.trim_matches('/').split('/').collect();
    let prefix_len = if segments.starts_with(&["admin", "v1"]) {
        2
    } else {
        0
    };
    let suffix = segments.get(prefix_len..).unwrap_or_default();
    match (method.as_str(), suffix) {
        ("GET", ["me"]) => Some((Auth, Read)),
        ("POST", ["auth", "logout" | "recovery-codes", ..]) => Some((Auth, Write)),
        ("GET", ["businesses"]) | ("GET", ["businesses", _, ..]) => Some((Businesses, Read)),
        ("GET", ["workspaces"]) | ("GET", ["workspaces", _, "branches"]) => Some((Businesses, Read)),
        ("GET", ["admin-users"]) => Some((AdminUsers, Read)),
        ("PATCH", ["admin-users", _]) => Some((AdminUsers, AdminAction::Manage)),
        ("GET", ["audit-log"]) => Some((Logs, Read)),
        ("POST", ["businesses", _, "verification"]) => Some((Businesses, Write)),
        ("GET", ["overview"] | ["analytics", ..]) => Some((Analytics, Read)),
        ("GET", ["sync", ..]) => Some((Sync, Read)),
        ("POST", ["sync", "devices", _, "revoke"]) => Some((Sync, Write)),
        ("GET", ["infra", "logs", ..]) => Some((Logs, Read)),
        ("GET", ["infra", ..]) => Some((Infrastructure, Read)),
        // Session management is owner-scoped in the handlers; keep it available to all roles.
        ("POST", ["auth", "sessions", _, "revoke"]) => Some((Auth, Write)),
        ("GET", ["auth", "sessions"]) => Some((Auth, Read)),
        _ => None,
    }
}

#[cfg(test)]
mod permission_tests {
    use super::*;
    use axum::http::Method;

    #[test]
    fn role_matrix_is_default_deny_and_scoped_by_action() {
        assert!(role_allows(
            "super_admin",
            AdminAction::Manage,
            AdminResource::Logs
        ));
        assert!(role_allows(
            "admin",
            AdminAction::Write,
            AdminResource::Businesses
        ));
        assert!(!role_allows(
            "reviewer",
            AdminAction::Write,
            AdminResource::Businesses
        ));
        assert!(role_allows(
            "reviewer",
            AdminAction::Read,
            AdminResource::Sync
        ));
        assert!(!role_allows(
            "reviewer",
            AdminAction::Read,
            AdminResource::Logs
        ));
        assert!(!role_allows(
            "viewer",
            AdminAction::Read,
            AdminResource::Sync
        ));
        assert!(role_allows(
            "viewer",
            AdminAction::Write,
            AdminResource::Auth
        ));
        assert!(!role_allows(
            "unknown",
            AdminAction::Read,
            AdminResource::Businesses
        ));
    }

    #[test]
    fn route_policy_maps_mutations_and_denies_unmapped_routes() {
        assert_eq!(
            route_permission(&Method::POST, "/admin/v1/businesses/b1/verification"),
            Some((AdminResource::Businesses, AdminAction::Write))
        );
        assert_eq!(
            route_permission(&Method::POST, "/admin/v1/sync/devices/d1/revoke"),
            Some((AdminResource::Sync, AdminAction::Write))
        );
        assert_eq!(
            route_permission(&Method::GET, "/admin/v1/infra/logs"),
            Some((AdminResource::Logs, AdminAction::Read))
        );
        assert_eq!(
            route_permission(&Method::PATCH, "/admin/v1/admin-users/u1"),
            Some((AdminResource::AdminUsers, AdminAction::Manage))
        );
        assert_eq!(
            route_permission(&Method::GET, "/admin/v1/audit-log"),
            Some((AdminResource::Logs, AdminAction::Read))
        );
        assert_eq!(
            route_permission(&Method::GET, "/admin/v1/workspaces/w1/branches"),
            Some((AdminResource::Businesses, AdminAction::Read))
        );
        assert!(!role_allows(
            "admin",
            AdminAction::Manage,
            AdminResource::AdminUsers
        ));
        assert!(role_allows(
            "super_admin",
            AdminAction::Manage,
            AdminResource::AdminUsers
        ));
        assert_eq!(
            route_permission(&Method::DELETE, "/admin/v1/businesses/b1"),
            None
        );
        assert_eq!(route_permission(&Method::GET, "/admin/v1/unmapped"), None);
    }
}

async fn admin_auth_middleware(
    State(state): State<AppState>,
    mut req: Request,
    next: middleware::Next,
) -> Result<Response, StatusCode> {
    let path = req.uri().path();
    if path.ends_with("/auth/login")
        || path.ends_with("/login")
        || path.ends_with("/auth/totp")
        || path.ends_with("/totp")
        || path.ends_with("/auth/recovery")
        || path.ends_with("/recovery")
    {
        return Ok(next.run(req).await);
    }

    let session_id = extract_session_id(req.headers());
    let session_id = match session_id {
        Some(s) => s,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    let rec = sqlx::query_as::<
        _,
        (
            String,
            String,
            String,
            chrono::DateTime<chrono::Utc>,
            Option<chrono::DateTime<chrono::Utc>>,
            Option<chrono::DateTime<chrono::Utc>>,
        ),
    >(
        "SELECT u.id, u.email, u.role, s.expires_at, s.revoked_at, u.disabled_at \
         FROM admin_sessions s \
         JOIN admin_users u ON s.admin_user_id = u.id \
         WHERE s.id = $1",
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

    let (resource, action) = route_permission(req.method(), path).ok_or(StatusCode::FORBIDDEN)?;
    if !role_allows(&role, action, resource) {
        return Err(StatusCode::FORBIDDEN);
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
        .merge(management::router(state.clone()))
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            admin_auth_middleware,
        ));

    Router::new().nest("/admin/v1", api_router)
}
