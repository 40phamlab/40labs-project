use tauri::State;
use uuid::Uuid;

use crate::db::AppState;
use crate::models::audit::{AuditLogEntry, RecordAuditLogRequest};
use crate::models::{DEFAULT_BRANCH_ID, DEFAULT_WORKSPACE_ID};
use crate::repositories::audit_repo::AuditRepository;

#[tauri::command]
pub async fn get_audit_logs(
    state: State<'_, AppState>,
) -> Result<Vec<AuditLogEntry>, String> {
    AuditRepository::list(&state.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn record_audit_log(
    state: State<'_, AppState>,
    payload: RecordAuditLogRequest,
) -> Result<AuditLogEntry, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let entry = AuditLogEntry {
        id: format!("audit_{}", Uuid::new_v4().simple()),
        workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
        branch_id: DEFAULT_BRANCH_ID.to_string(),
        created_at: now,
        action: payload.action,
        performed_by_user_id: payload.performed_by_user_id,
        target_entity_type: payload.target_entity_type,
        target_entity_id: payload.target_entity_id,
        metadata: payload.metadata.map(|v| v.to_string()),
    };

    AuditRepository::create(&state.pool, &entry)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    Ok(entry)
}
