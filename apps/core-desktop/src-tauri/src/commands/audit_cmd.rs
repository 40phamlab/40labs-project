use tauri::State;
use crate::db::AppState;
use crate::models::audit::AuditLogEntry;
use crate::repositories::audit_repo::AuditRepository;
use crate::auth::{AuthEngine, AuthErrorResponse};

#[tauri::command]
pub async fn get_audit_logs(
    state: State<'_, AppState>,
) -> Result<Vec<AuditLogEntry>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require("reports.compliance").await.map_err(|e| e.to_response())?;
    AuditRepository::list(&state.pool, &ctx.workspace_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}
