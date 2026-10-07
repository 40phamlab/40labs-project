use tauri::State;

use crate::db::AppState;
use crate::models::customers::{AddCustomerRequest, Customer, UpdateCustomerRequest};
use crate::repositories::customer_repo::CustomerRepository;
use crate::services::customer_service::CustomerService;
use crate::auth::{AuthEngine, AuthErrorResponse};

#[tauri::command]
pub async fn get_customers_list(
    state: State<'_, AppState>,
) -> Result<Vec<Customer>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("customers.view").await.map_err(|e| e.to_response())?;
    CustomerRepository::list(&state.pool, &ctx.workspace_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn get_customer(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<Customer>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("customers.view").await.map_err(|e| e.to_response())?;
    CustomerRepository::get_by_id(&state.pool, &ctx.workspace_id, &id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn create_customer(
    state: State<'_, AppState>,
    payload: AddCustomerRequest,
) -> Result<Customer, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("customers.edit").await.map_err(|e| e.to_response())?;
    CustomerService::create_customer(&state.pool, &ctx, payload)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn update_customer(
    state: State<'_, AppState>,
    id: String,
    payload: UpdateCustomerRequest,
) -> Result<Customer, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("customers.edit").await.map_err(|e| e.to_response())?;
    CustomerService::update_customer(&state.pool, &ctx, &id, payload)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}
