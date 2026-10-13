use tauri::State;

use crate::auth::{AuthEngine, AuthErrorResponse};
use crate::db::AppState;
use crate::models::purchases::{PurchaseOrder, PurchaseOrderLine, Supplier};
use crate::repositories::purchases_repo::PurchasesRepository;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseOrderLineRequest {
    pub medicine_id: String,
    pub quantity: i64,
    pub unit_cost: i64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseOrderRequest {
    pub supplier_id: String,
    pub lines: Vec<CreatePurchaseOrderLineRequest>,
}

#[tauri::command]
pub async fn get_purchase_orders(
    state: State<'_, AppState>,
) -> Result<Vec<PurchaseOrder>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    PurchasesRepository::list_purchase_orders(&state.pool, &ctx.workspace_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn get_suppliers(state: State<'_, AppState>) -> Result<Vec<Supplier>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    PurchasesRepository::list_suppliers(&state.pool, &ctx.workspace_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn create_purchase_order(
    state: State<'_, AppState>,
    payload: CreatePurchaseOrderRequest,
) -> Result<PurchaseOrder, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    let now = chrono::Utc::now().to_rfc3339();
    let po_id = format!("po_{}", uuid::Uuid::new_v4());

    let mut lines = Vec::new();
    let mut total_cost: i64 = 0;

    for line_req in payload.lines {
        let line_id = format!("poline_{}", uuid::Uuid::new_v4());
        let line_total = line_req.quantity * line_req.unit_cost;
        total_cost += line_total;

        lines.push(PurchaseOrderLine {
            id: line_id,
            purchase_order_id: po_id.clone(),
            medicine_id: line_req.medicine_id,
            quantity: line_req.quantity,
            unit_cost: line_req.unit_cost,
        });
    }

    let po = PurchaseOrder {
        id: po_id,
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        supplier_id: payload.supplier_id,
        status: "draft".to_string(),
        lines,
        total_cost,
        approved_by_user_id: None,
        submitted_at: None,
        created_at: now.clone(),
        updated_at: now,
    };

    let mut tx = state
        .pool
        .begin()
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    PurchasesRepository::create_purchase_order(&mut *tx, &po)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    tx.commit()
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(po)
}

#[tauri::command]
pub async fn approve_purchase_order(
    state: State<'_, AppState>,
    id: String,
) -> Result<PurchaseOrder, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("purchases.approve")
        .await
        .map_err(|e| e.to_response())?;

    let now = chrono::Utc::now().to_rfc3339();

    PurchasesRepository::approve_purchase_order(
        &state.pool,
        &ctx.workspace_id,
        &id,
        &ctx.user_id,
        &now,
    )
    .await
    .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
    .ok_or_else(|| {
        crate::auth::AuthError::NotFound("Purchase order not found".to_string()).to_response()
    })
}
