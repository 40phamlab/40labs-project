use tauri::State;

use crate::db::AppState;
use crate::models::purchases::{PurchaseOrder, Supplier};
use crate::repositories::purchases_repo::PurchasesRepository;
use crate::auth::{AuthEngine, AuthErrorResponse};

#[tauri::command]
pub async fn get_purchase_orders(
    state: State<'_, AppState>,
) -> Result<Vec<PurchaseOrder>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;
    PurchasesRepository::list_purchase_orders(&state.pool, &ctx.workspace_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn get_suppliers(
    state: State<'_, AppState>,
) -> Result<Vec<Supplier>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;
    PurchasesRepository::list_suppliers(&state.pool, &ctx.workspace_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}
