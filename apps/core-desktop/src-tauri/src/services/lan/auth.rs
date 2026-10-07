use axum::{
    extract::{Request, State},
    http::{header::AUTHORIZATION, StatusCode},
    middleware::Next,
    response::Response,
    Json,
};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::sync::Arc;

use crate::models::device::PairedDevice;
use crate::repositories::device_repo;
use super::LanServerState;

#[derive(Debug, Clone)]
pub struct AuthedDevice {
    pub device: PairedDevice,
}

pub async fn auth_middleware(
    State(state): State<Arc<LanServerState>>,
    mut req: Request,
    next: Next,
) -> Result<Response, (StatusCode, Json<Value>)> {
    let auth_header = req
        .headers()
        .get(AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .filter(|h| h.starts_with("Bearer "))
        .map(|h| &h[7..])
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "Missing or invalid authorization token" })),
            )
        })?;

    // Compute SHA-256 hash of the bearer token
    let mut hasher = Sha256::new();
    hasher.update(auth_header.as_bytes());
    let credential_hash = format!("{:x}", hasher.finalize());

    // Lookup device by credential hash
    let device = device_repo::get_device_by_credential_hash(&state.pool, &credential_hash)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Database lookup error" })),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "Invalid device credentials" })),
            )
        })?;

    // Verify device status is active and credential_hash is not null (pre-migration rows protection)
    if device.status != "active" || device.credential_hash.is_none() {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({ "error": "Device is not active or unauthorized" })),
        ));
    }

    // Throttled update of last_connected_at (>60 seconds elapsed)
    let should_update = match &device.last_connected_at {
        Some(ts) => {
            if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(ts) {
                chrono::Utc::now().signed_duration_since(dt.with_timezone(&chrono::Utc))
                    .num_seconds() > 60
            } else {
                true
            }
        }
        None => true,
    };

    if should_update {
        let _ = device_repo::update_last_connected(&state.pool, &device.workspace_id, &device.id).await;
    }

    req.extensions_mut().insert(AuthedDevice { device });
    Ok(next.run(req).await)
}

pub fn require_permission(
    device: &PairedDevice,
    permission_key: &str,
) -> Result<(), (StatusCode, Json<Value>)> {
    let perms: Value = serde_json::from_str(&device.permissions_json).unwrap_or_default();
    if perms.get(permission_key).and_then(|v| v.as_bool()).unwrap_or(false) {
        Ok(())
    } else {
        Err((
            StatusCode::FORBIDDEN,
            Json(json!({ "error": format!("Permission denied: {}", permission_key) })),
        ))
    }
}
