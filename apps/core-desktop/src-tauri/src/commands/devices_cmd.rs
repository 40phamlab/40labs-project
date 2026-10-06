use tauri::State;
use crate::db::AppState;
use crate::models::device::{PairedDevice, PairingSessionInfo, UpdatePermissionsRequest, StaffPermissionSet};
use crate::models::audit::AuditLogEntry;
use crate::models::{DEFAULT_WORKSPACE_ID, DEFAULT_BRANCH_ID};
use crate::repositories::{device_repo, audit_repo::AuditRepository};
use uuid::Uuid;

#[tauri::command]
pub async fn get_paired_devices(state: State<'_, AppState>) -> Result<Vec<PairedDevice>, String> {
    device_repo::get_paired_devices(&state.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn initiate_pairing_session(
    state: State<'_, AppState>,
    user_id: String,
    permissions: Option<StaffPermissionSet>,
) -> Result<PairingSessionInfo, String> {
    let active_opt: Option<(i32,)> = sqlx::query_as(
        r#"
        SELECT active FROM app_user WHERE id = ?
        "#,
    )
    .bind(&user_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    match active_opt {
        Some((1,)) => {}
        _ => return Err("User does not exist or is inactive".to_string()),
    }

    let perms = permissions.unwrap_or_default();
    let perms_json = serde_json::to_string(&perms).unwrap_or_else(|_| "{}".to_string());

    state.lan_state
        .create_session(&user_id, &perms_json)
        .await
        .map_err(|e| format!("Failed to create session: {}", e))
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
    let device = device_repo::get_device_by_id(&state.pool, &id)
        .await
        .map_err(|e| format!("Database error: {}", e))?
        .ok_or_else(|| "Device not found".to_string())?;

    device_repo::update_device_status(&state.pool, &id, "blocked")
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    let audit_entry = AuditLogEntry {
        id: format!("audit_{}", Uuid::new_v4()),
        workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
        branch_id: DEFAULT_BRANCH_ID.to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
        action: "device_block".to_string(),
        performed_by_user_id: Some(device.user_id.clone()),
        target_entity_type: "PairedDevice".to_string(),
        target_entity_id: id,
        metadata: Some(serde_json::json!({ "device_label": device.device_label, "status": "blocked" }).to_string()),
    };
    let _ = AuditRepository::create(&state.pool, &audit_entry).await;

    Ok(())
}

#[tauri::command]
pub async fn unblock_device(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let device = device_repo::get_device_by_id(&state.pool, &id)
        .await
        .map_err(|e| format!("Database error: {}", e))?
        .ok_or_else(|| "Device not found".to_string())?;

    device_repo::update_device_status(&state.pool, &id, "active")
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    let audit_entry = AuditLogEntry {
        id: format!("audit_{}", Uuid::new_v4()),
        workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
        branch_id: DEFAULT_BRANCH_ID.to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
        action: "device_block".to_string(),
        performed_by_user_id: Some(device.user_id.clone()),
        target_entity_type: "PairedDevice".to_string(),
        target_entity_id: id,
        metadata: Some(serde_json::json!({ "device_label": device.device_label, "status": "active" }).to_string()),
    };
    let _ = AuditRepository::create(&state.pool, &audit_entry).await;

    Ok(())
}

#[tauri::command]
pub async fn remove_device(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let device = device_repo::get_device_by_id(&state.pool, &id)
        .await
        .map_err(|e| format!("Database error: {}", e))?
        .ok_or_else(|| "Device not found".to_string())?;

    device_repo::update_device_status(&state.pool, &id, "removed")
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    let audit_entry = AuditLogEntry {
        id: format!("audit_{}", Uuid::new_v4()),
        workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
        branch_id: DEFAULT_BRANCH_ID.to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
        action: "device_remove".to_string(),
        performed_by_user_id: Some(device.user_id.clone()),
        target_entity_type: "PairedDevice".to_string(),
        target_entity_id: id,
        metadata: Some(serde_json::json!({ "device_label": device.device_label, "status": "removed" }).to_string()),
    };
    let _ = AuditRepository::create(&state.pool, &audit_entry).await;

    Ok(())
}
