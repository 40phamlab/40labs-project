use tauri::State;

use crate::db::AppState;
use crate::models::sales::{CreateSaleRequest, FiscalReceipt, Sale};
use crate::repositories::sales_repo::SalesRepository;
use crate::services::sales_service::SalesService;

#[tauri::command]
pub async fn get_sales_list(
    state: State<'_, AppState>,
) -> Result<Vec<Sale>, String> {
    SalesRepository::list_sales(&state.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn create_sale(
    state: State<'_, AppState>,
    payload: CreateSaleRequest,
) -> Result<Sale, String> {
    SalesService::create_sale(&state.pool, payload).await
}

#[tauri::command]
pub async fn get_fiscal_receipts() -> Result<Vec<FiscalReceipt>, String> {
    Ok(Vec::new())
}
