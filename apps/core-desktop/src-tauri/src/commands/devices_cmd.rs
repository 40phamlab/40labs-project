use tauri::State;
use crate::db::AppState;
use crate::models::device::{PairedDevice, PairingSessionInfo, UpdatePermissionsRequest};
use crate::repositories::device_repo;

#[tauri::command]
pub async fn get_paired_devices(state: State<'_, AppState>) -> Result<Vec<PairedDevice>, String> {
    device_repo::get_paired_devices(&state.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn initiate_pairing_session(state: State<'_, AppState>) -> Result<PairingSessionInfo, String> {
    Ok(state.lan_state.create_session().await)
}

#[tauri::command]
pub async fn update_device_permissions(
    state: State<'_, AppState>,
    payload: UpdatePermissionsRequest,
) -> Result<(), String> {
    let json_str = payload.permissions.to_string();
    device_repo::update_device_permissions(&state.pool, &payload.device_id, &json_str)
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn block_device(state: State<'_, AppState>, id: String) -> Result<(), String> {
    device_repo::update_device_status(&state.pool, &id, "blocked")
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn unblock_device(state: State<'_, AppState>, id: String) -> Result<(), String> {
    device_repo::update_device_status(&state.pool, &id, "active")
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn remove_device(state: State<'_, AppState>, id: String) -> Result<(), String> {
    device_repo::update_device_status(&state.pool, &id, "removed")
        .await
        .map_err(|e| format!("Database error: {}", e))
}
