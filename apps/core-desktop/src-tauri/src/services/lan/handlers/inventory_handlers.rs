use axum::{
    extract::{Extension, Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;

use crate::auth::AuthContext;
use crate::models::inventory::AddStockRequest;
use crate::repositories::inventory_repo::InventoryRepository;
use crate::services::inventory_service::InventoryService;
use crate::services::lan::{
    auth::AuthedDevice,
    idempotency::{check_idempotency, store_idempotency},
    LanServerState,
};

pub async fn get_stock_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let items = InventoryRepository::list_medicines_with_inventory(
        &state.pool,
        &device.workspace_id,
        &device.branch_id,
        false,
    )
    .await
    .map_err(|e| {
        tracing::warn!(error = %e, "Failed to list inventory");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        )
    })?;

    let search = params.get("search").map(|s| s.to_lowercase());
    let low_stock_only = params.get("lowStock").map(|s| s == "true").unwrap_or(false);

    let filtered: Vec<_> = items
        .into_iter()
        .filter(|item| {
            if low_stock_only
                && item.inventory_item.quantity > item.inventory_item.low_stock_threshold
            {
                return false;
            }
            if let Some(ref q) = search {
                let name_match = item.medicine.name.to_lowercase().contains(q);
                let generic_match = item
                    .medicine
                    .generic_name
                    .as_deref()
                    .unwrap_or("")
                    .to_lowercase()
                    .contains(q);
                let batch_match = item.inventory_item.batch_number.to_lowercase().contains(q);
                if !name_match && !generic_match && !batch_match {
                    return false;
                }
            }
            true
        })
        .collect();

    Ok(Json(json!(filtered)))
}

pub async fn get_stock_item_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    Path(id): Path<String>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let item = InventoryRepository::get_inventory_item_by_id(
        &state.pool,
        &device.workspace_id,
        &device.branch_id,
        &id,
    )
    .await
    .map_err(|e| {
        tracing::warn!(error = %e, "Failed to get inventory item");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        )
    })?
    .ok_or_else(|| (StatusCode::NOT_FOUND, "Stock item not found".to_string()))?;

    Ok(Json(json!(item)))
}

pub async fn post_stock_receipt_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    headers: HeaderMap,
    Json(payload): Json<AddStockRequest>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, String)> {
    if let Some(cached) = check_idempotency(
        &state.pool,
        &device.workspace_id,
        &headers,
        "/stock/receipts",
    )
    .await?
    {
        return Ok(cached);
    }

    let permissions: Value =
        serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));
    let can_update = permissions
        .get("can_update_stock")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    if !can_update {
        return Err((
            StatusCode::FORBIDDEN,
            "Permission 'can_update_stock' required".to_string(),
        ));
    }

    let ctx = AuthContext {
        user_id: device.user_id.clone(),
        workspace_id: device.workspace_id.clone(),
        branch_id: device.branch_id.clone(),
    };

    let result = InventoryService::add_stock(&state.pool, &ctx, payload)
        .await
        .map_err(|e| {
            tracing::warn!(error = %e, "Failed to add stock receipt");
            if e.contains("validation") || e.contains("invalid") {
                (StatusCode::UNPROCESSABLE_ENTITY, e)
            } else {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                )
            }
        })?;

    let response_body = serde_json::to_value(result).unwrap();
    store_idempotency(
        &state.pool,
        &device.workspace_id,
        &headers,
        "/stock/receipts",
        StatusCode::CREATED,
        &response_body,
    )
    .await;

    Ok((StatusCode::CREATED, Json(response_body)))
}
