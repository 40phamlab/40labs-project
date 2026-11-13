use axum::{
    extract::{Extension, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use std::sync::Arc;

use crate::auth::AuthContext;
use crate::models::sales::CreateSaleRequest;
use crate::repositories::sales_repo::SalesRepository;
use crate::services::lan::{auth::AuthedDevice, LanServerState};
use crate::services::sales_service::SalesService;

pub async fn post_sales_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    headers: HeaderMap,
    Json(payload): Json<CreateSaleRequest>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, String)> {
    let permissions: Value =
        serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));
    let can_create = permissions
        .get("can_create_sale")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    if !can_create {
        return Err((
            StatusCode::FORBIDDEN,
            "Permission 'can_create_sale' required".to_string(),
        ));
    }

    let idempotency_key = headers
        .get("idempotency-key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                "Missing Idempotency-Key header".to_string(),
            )
        })?;

    if let Ok(Some(existing)) =
        SalesRepository::get_by_idempotency_key(&state.pool, &device.workspace_id, &idempotency_key)
            .await
    {
        return Ok((
            StatusCode::OK,
            Json(serde_json::to_value(existing).unwrap()),
        ));
    }

    let ctx = AuthContext {
        user_id: device.user_id.clone(),
        workspace_id: device.workspace_id.clone(),
        branch_id: device.branch_id.clone(),
    };

    let sale = SalesService::create_sale(&state.pool, &ctx, payload, None, Some(idempotency_key))
        .await
        .map_err(|e| {
            tracing::warn!(error = %e, "Failed to create sale");
            if e.contains("stock") || e.contains("insufficient") || e.contains("invalid") {
                (StatusCode::CONFLICT, e)
            } else {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                )
            }
        })?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::to_value(sale).unwrap()),
    ))
}
