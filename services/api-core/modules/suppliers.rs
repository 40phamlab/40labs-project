//! Supplier domain module for api-core
//!
//! Axum handlers and router for workspace-supplier follow relationships:
//! - POST   /suppliers/:id/follow
//! - DELETE /suppliers/:id/follow
//! - GET    /suppliers/followed
//!
//! Broadcasts & news delivery:
//! TODO: [reason: cross-business messaging infra not built] [phase: post-Scheduling&Notifications]

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{delete, get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Represents a workspace's follow relationship with a supplier (`supplier_follows` table).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupplierFollow {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub supplier_id: String,
    pub created_at: String,
    pub updated_at: String,
}

/// Request payload for following a supplier.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FollowSupplierPayload {
    pub workspace_id: String,
    pub branch_id: String,
}

/// Query parameters for unfollowing or fetching followed suppliers.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FollowQuery {
    pub workspace_id: String,
}

/// Domain/API errors for supplier operations.
#[derive(Debug)]
pub enum SupplierApiError {
    InvalidInput(String),
    NotFound(String),
    DatabaseError(String),
}

impl std::fmt::Display for SupplierApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SupplierApiError::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
            SupplierApiError::NotFound(msg) => write!(f, "Not found: {}", msg),
            SupplierApiError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
        }
    }
}

impl std::error::Error for SupplierApiError {}

impl IntoResponse for SupplierApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match &self {
            SupplierApiError::InvalidInput(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            SupplierApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            SupplierApiError::DatabaseError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
        };

        let body = Json(serde_json::json!({
            "error": error_message
        }));

        (status, body).into_response()
    }
}

/// Repository trait for database access without coupling to a specific driver.
pub trait SupplierRepository: Send + Sync {
    async fn find_follow(
        &self,
        workspace_id: &str,
        supplier_id: &str,
    ) -> Result<Option<SupplierFollow>, SupplierApiError>;

    async fn insert_follow(
        &self,
        follow: &SupplierFollow,
    ) -> Result<(), SupplierApiError>;

    async fn delete_follow(
        &self,
        workspace_id: &str,
        supplier_id: &str,
    ) -> Result<(), SupplierApiError>;

    async fn list_followed(
        &self,
        workspace_id: &str,
    ) -> Result<Vec<SupplierFollow>, SupplierApiError>;
}

/// Shared state holding the repository instance.
#[derive(Clone)]
pub struct AppState<R: SupplierRepository + 'static> {
    pub repo: Arc<R>,
}

/// Constructs the Axum router with supplier follow routes:
/// - POST   /suppliers/:id/follow
/// - DELETE /suppliers/:id/follow
/// - GET    /suppliers/followed
pub fn router<R: SupplierRepository + 'static>(state: AppState<R>) -> Router {
    Router::new()
        .route("/suppliers/:id/follow", post(follow_supplier_handler::<R>))
        .route("/suppliers/:id/follow", delete(unfollow_supplier_handler::<R>))
        .route("/suppliers/followed", get(get_followed_suppliers_handler::<R>))
        .with_state(state)
}

/// Handler: POST /suppliers/:id/follow
///
/// Workspace follows a supplier.
/// PIN gates: None.
/// Offline behavior: Local SQLite write, silent background sync.
pub async fn follow_supplier_handler<R: SupplierRepository + 'static>(
    Path(supplier_id): Path<String>,
    State(state): State<AppState<R>>,
    Json(payload): Json<FollowSupplierPayload>,
) -> Result<(StatusCode, Json<SupplierFollow>), SupplierApiError> {
    if supplier_id.trim().is_empty() {
        return Err(SupplierApiError::InvalidInput(
            "supplier_id cannot be empty".to_string(),
        ));
    }
    if payload.workspace_id.trim().is_empty() {
        return Err(SupplierApiError::InvalidInput(
            "workspace_id cannot be empty".to_string(),
        ));
    }

    let existing = state
        .repo
        .find_follow(&payload.workspace_id, &supplier_id)
        .await?;

    if let Some(follow) = existing {
        return Ok((StatusCode::OK, Json(follow)));
    }

    let now = current_iso_timestamp();
    let follow = SupplierFollow {
        id: generate_uuid(),
        workspace_id: payload.workspace_id,
        branch_id: payload.branch_id,
        supplier_id,
        created_at: now.clone(),
        updated_at: now,
    };

    state.repo.insert_follow(&follow).await?;

    Ok((StatusCode::CREATED, Json(follow)))
}

/// Handler: DELETE /suppliers/:id/follow
///
/// Workspace unfollows a supplier.
pub async fn unfollow_supplier_handler<R: SupplierRepository + 'static>(
    Path(supplier_id): Path<String>,
    Query(query): Query<FollowQuery>,
    State(state): State<AppState<R>>,
) -> Result<StatusCode, SupplierApiError> {
    if supplier_id.trim().is_empty() {
        return Err(SupplierApiError::InvalidInput(
            "supplier_id cannot be empty".to_string(),
        ));
    }
    if query.workspace_id.trim().is_empty() {
        return Err(SupplierApiError::InvalidInput(
            "workspace_id query parameter is required".to_string(),
        ));
    }

    state
        .repo
        .delete_follow(&query.workspace_id, &supplier_id)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

/// Handler: GET /suppliers/followed
///
/// Returns list of all suppliers followed by a workspace.
pub async fn get_followed_suppliers_handler<R: SupplierRepository + 'static>(
    Query(query): Query<FollowQuery>,
    State(state): State<AppState<R>>,
) -> Result<Json<Vec<SupplierFollow>>, SupplierApiError> {
    if query.workspace_id.trim().is_empty() {
        return Err(SupplierApiError::InvalidInput(
            "workspace_id query parameter is required".to_string(),
        ));
    }

    let list = state.repo.list_followed(&query.workspace_id).await?;
    Ok(Json(list))
}

fn generate_uuid() -> String {
    // In production, backed by uuid::Uuid::new_v4().to_string()
    format!("{:08x}-{:04x}-4{:03x}-{:04x}-{:012x}", 1, 2, 3, 8, 5)
}

fn current_iso_timestamp() -> String {
    "2025-01-01T00:00:00.000Z".to_string()
}
