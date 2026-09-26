use tauri::State;

use crate::db::AppState;
use crate::models::lab::{
    CollectLabSampleRequest, CreateLabOrderRequest, LabOrder, LabSample,
};
use crate::repositories::lab_repo::LabRepository;
use crate::services::lab_service::LabService;

#[tauri::command]
pub async fn get_lab_orders(
    state: State<'_, AppState>,
) -> Result<Vec<LabOrder>, String> {
    LabRepository::list_orders(&state.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn create_lab_order(
    state: State<'_, AppState>,
    payload: CreateLabOrderRequest,
) -> Result<LabOrder, String> {
    LabService::create_order(&state.pool, payload).await
}

#[tauri::command]
pub async fn update_lab_order_status(
    state: State<'_, AppState>,
    id: String,
    status: String,
) -> Result<bool, String> {
    let now = chrono::Utc::now().to_rfc3339();
    LabRepository::update_order_status(&state.pool, &id, &status, &now)
        .await
        .map_err(|e| format!("Database error: {}", e))?;
    Ok(true)
}

#[tauri::command]
pub async fn get_lab_samples(
    state: State<'_, AppState>,
) -> Result<Vec<LabSample>, String> {
    LabRepository::list_samples(&state.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn collect_lab_sample(
    state: State<'_, AppState>,
    payload: CollectLabSampleRequest,
) -> Result<LabSample, String> {
    LabService::collect_sample(&state.pool, payload).await
}

#[tauri::command]
pub async fn update_lab_sample_status(
    state: State<'_, AppState>,
    id: String,
    status: String,
) -> Result<bool, String> {
    let now = chrono::Utc::now().to_rfc3339();
    LabRepository::update_sample_status(&state.pool, &id, &status, &now)
        .await
        .map_err(|e| format!("Database error: {}", e))?;
    Ok(true)
}
