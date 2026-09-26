use tauri::State;

use crate::db::AppState;
use crate::models::inventory::{
    AddStockRequest, MedicineWithInventory, RecordStockActionRequest, RecordStockActionResult,
};
use crate::repositories::inventory_repo::InventoryRepository;
use crate::services::inventory_service::InventoryService;

#[tauri::command]
pub async fn get_inventory_list(
    state: State<'_, AppState>,
    include_deactivated: Option<bool>,
) -> Result<Vec<MedicineWithInventory>, String> {
    InventoryRepository::list_medicines_with_inventory(
        &state.pool,
        include_deactivated.unwrap_or(false),
    )
    .await
    .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn get_inventory_item(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<MedicineWithInventory>, String> {
    InventoryRepository::get_inventory_item_by_id(&state.pool, &id)
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn create_stock_item(
    state: State<'_, AppState>,
    payload: AddStockRequest,
) -> Result<MedicineWithInventory, String> {
    InventoryService::add_stock(&state.pool, payload).await
}

#[tauri::command]
pub async fn record_stock_action(
    state: State<'_, AppState>,
    payload: RecordStockActionRequest,
) -> Result<RecordStockActionResult, String> {
    InventoryService::record_stock_action(&state.pool, payload).await
}
