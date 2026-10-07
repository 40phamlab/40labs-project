use tauri::State;

use crate::db::AppState;
use crate::models::lab::{
    CollectLabSampleRequest, CreateLabOrderRequest, LabOrder, LabSample,
};
use crate::repositories::lab_repo::LabRepository;
use crate::services::lab_service::LabService;
use crate::auth::{AuthEngine, AuthErrorResponse};

#[tauri::command]
pub async fn get_lab_orders(
    state: State<'_, AppState>,
) -> Result<Vec<LabOrder>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;
    LabRepository::list_orders(&state.pool, &ctx.workspace_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn create_lab_order(
    state: State<'_, AppState>,
    payload: CreateLabOrderRequest,
) -> Result<LabOrder, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("lab.order").await.map_err(|e| e.to_response())?;
    LabService::create_order(&state.pool, &ctx, payload)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn update_lab_order_status(
    state: State<'_, AppState>,
    id: String,
    status: String,
) -> Result<bool, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("lab.order").await.map_err(|e| e.to_response())?;
    let now = chrono::Utc::now().to_rfc3339();
    LabRepository::update_order_status(&state.pool, &ctx.workspace_id, &id, &status, &now)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;
    Ok(true)
}

#[tauri::command]
pub async fn get_lab_samples(
    state: State<'_, AppState>,
) -> Result<Vec<LabSample>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;
    LabRepository::list_samples(&state.pool, &ctx.workspace_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn collect_lab_sample(
    state: State<'_, AppState>,
    payload: CollectLabSampleRequest,
) -> Result<LabSample, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("lab.order").await.map_err(|e| e.to_response())?;
    LabService::collect_sample(&state.pool, &ctx, payload)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn update_lab_sample_status(
    state: State<'_, AppState>,
    id: String,
    status: String,
) -> Result<bool, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("lab.result.enter").await.map_err(|e| e.to_response())?;
    let now = chrono::Utc::now().to_rfc3339();
    LabRepository::update_sample_status(&state.pool, &ctx.workspace_id, &id, &status, &now)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;
    Ok(true)
}
