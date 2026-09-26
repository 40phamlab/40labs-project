use tauri::State;

use crate::db::AppState;
use crate::models::customers::{AddCustomerRequest, Customer, UpdateCustomerRequest};
use crate::repositories::customer_repo::CustomerRepository;
use crate::services::customer_service::CustomerService;

#[tauri::command]
pub async fn get_customers_list(
    state: State<'_, AppState>,
) -> Result<Vec<Customer>, String> {
    CustomerRepository::list(&state.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn get_customer(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<Customer>, String> {
    CustomerRepository::get_by_id(&state.pool, &id)
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn create_customer(
    state: State<'_, AppState>,
    payload: AddCustomerRequest,
) -> Result<Customer, String> {
    CustomerService::create_customer(&state.pool, payload).await
}

#[tauri::command]
pub async fn update_customer(
    state: State<'_, AppState>,
    id: String,
    payload: UpdateCustomerRequest,
) -> Result<Customer, String> {
    CustomerService::update_customer(&state.pool, &id, payload).await
}
