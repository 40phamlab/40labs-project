use tauri::State;

use crate::db::AppState;
use crate::models::inventory::{
    AddStockRequest, MedicineWithInventory, RecordStockActionRequest, RecordStockActionResult,
};
use crate::repositories::inventory_repo::InventoryRepository;
use crate::services::inventory_service::InventoryService;
use crate::auth::{AuthEngine, AuthErrorResponse};

#[tauri::command]
pub async fn get_inventory_list(
    state: State<'_, AppState>,
    include_deactivated: Option<bool>,
) -> Result<Vec<MedicineWithInventory>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("inventory.view").await.map_err(|e| e.to_response())?;
    InventoryRepository::list_medicines_with_inventory(
        &state.pool,
        &ctx.workspace_id,
        include_deactivated.unwrap_or(false),
    )
    .await
    .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn get_inventory_item(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<MedicineWithInventory>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("inventory.view").await.map_err(|e| e.to_response())?;
    InventoryRepository::get_inventory_item_by_id(&state.pool, &ctx.workspace_id, &id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn create_stock_item(
    state: State<'_, AppState>,
    payload: AddStockRequest,
) -> Result<MedicineWithInventory, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("inventory.create").await.map_err(|e| e.to_response())?;
    InventoryService::add_stock(&state.pool, &ctx, payload)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn record_stock_action(
    state: State<'_, AppState>,
    payload: RecordStockActionRequest,
) -> Result<RecordStockActionResult, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("inventory.create").await.map_err(|e| e.to_response())?;
    InventoryService::record_stock_action(&state.pool, &engine, &ctx, payload)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}
