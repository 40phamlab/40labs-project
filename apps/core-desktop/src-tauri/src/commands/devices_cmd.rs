use tauri::State;
use crate::db::AppState;
use crate::models::device::{PairedDevice, PairingSessionInfo, UpdatePermissionsRequest, StaffPermissionSet};
use crate::models::audit::AuditLogEntry;
use crate::repositories::{device_repo, audit_repo::AuditRepository};
use crate::auth::{AuthEngine, AuthErrorResponse};
use uuid::Uuid;

#[tauri::command]
pub async fn get_paired_devices(state: State<'_, AppState>) -> Result<Vec<PairedDevice>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("devices.manage").await.map_err(|e| e.to_response())?;
    device_repo::get_paired_devices(&state.pool, &ctx.workspace_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn initiate_pairing_session(
    state: State<'_, AppState>,
    user_id: String,
    permissions: Option<StaffPermissionSet>,
) -> Result<PairingSessionInfo, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let _ctx = engine.require("devices.manage").await.map_err(|e| e.to_response())?;

    let active_opt: Option<(i32,)> = sqlx::query_as(
        r#"
        SELECT active FROM app_user WHERE id = ?
        "#,
    )
    .bind(&user_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    match active_opt {
        Some((1,)) => {}
        _ => return Err(crate::auth::AuthError::NotFound("User does not exist or is inactive".to_string()).to_response()),
    }

    let perms = permissions.unwrap_or_default();
    let perms_json = serde_json::to_string(&perms).unwrap_or_else(|_| "{}".to_string());

    state.lan_state
        .create_session(&user_id, &perms_json)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn update_device_permissions(
    state: State<'_, AppState>,
    payload: UpdatePermissionsRequest,
) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("devices.manage").await.map_err(|e| e.to_response())?;

    let json_str = payload.permissions.to_string();
    device_repo::update_device_permissions(&state.pool, &ctx.workspace_id, &payload.device_id, &json_str)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn block_device(state: State<'_, AppState>, id: String) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("devices.manage").await.map_err(|e| e.to_response())?;

    let device = device_repo::get_device_by_id(&state.pool, &ctx.workspace_id, &id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| crate::auth::AuthError::NotFound("Device not found".to_string()).to_response())?;

    device_repo::update_device_status(&state.pool, &ctx.workspace_id, &id, "blocked")
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    let audit_entry = AuditLogEntry {
        id: format!("audit_{}", Uuid::new_v4()),
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
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
pub async fn unblock_device(state: State<'_, AppState>, id: String) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("devices.manage").await.map_err(|e| e.to_response())?;

    let device = device_repo::get_device_by_id(&state.pool, &ctx.workspace_id, &id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| crate::auth::AuthError::NotFound("Device not found".to_string()).to_response())?;

    device_repo::update_device_status(&state.pool, &ctx.workspace_id, &id, "active")
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    let audit_entry = AuditLogEntry {
        id: format!("audit_{}", Uuid::new_v4()),
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
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
pub async fn remove_device(state: State<'_, AppState>, id: String) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("devices.manage").await.map_err(|e| e.to_response())?;

    let device = device_repo::get_device_by_id(&state.pool, &ctx.workspace_id, &id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| crate::auth::AuthError::NotFound("Device not found".to_string()).to_response())?;

    device_repo::update_device_status(&state.pool, &ctx.workspace_id, &id, "removed")
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    let audit_entry = AuditLogEntry {
        id: format!("audit_{}", Uuid::new_v4()),
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
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
