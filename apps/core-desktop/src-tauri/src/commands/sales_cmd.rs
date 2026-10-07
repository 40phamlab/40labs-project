use tauri::State;

use crate::db::AppState;
use crate::models::sales::{CreateSaleRequest, FiscalReceipt, Sale};
use crate::repositories::sales_repo::SalesRepository;
use crate::services::sales_service::{SalesService, DISCOUNT_PIN_THRESHOLD};
use crate::auth::{AuthEngine, AuthErrorResponse};

#[tauri::command]
pub async fn get_sales_list(
    state: State<'_, AppState>,
) -> Result<Vec<Sale>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;
    SalesRepository::list_sales(&state.pool, &ctx.workspace_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn create_sale(
    state: State<'_, AppState>,
    payload: CreateSaleRequest,
) -> Result<Sale, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("sales.create").await.map_err(|e| e.to_response())?;

    let discount = payload.discount_amount.unwrap_or(0);
    let discount_approver = if discount > DISCOUNT_PIN_THRESHOLD {
        let token = payload.step_up_token.as_deref().ok_or_else(|| crate::auth::AuthError::StepUpRequired.to_response())?;
        let approver = engine
            .consume_step_up(&ctx.user_id, "sales.discount", None, token)
            .await
            .map_err(|e| e.to_response())?;
        Some(approver)
    } else {
        None
    };

    SalesService::create_sale(&state.pool, &ctx, payload, discount_approver, None)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn get_fiscal_receipts(
    state: State<'_, AppState>,
) -> Result<Vec<FiscalReceipt>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let _ctx = engine.require_session().await.map_err(|e| e.to_response())?;
    Ok(Vec::new())
}
