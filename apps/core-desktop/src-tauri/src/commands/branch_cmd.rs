use crate::auth::{AuthEngine, AuthError, AuthErrorResponse};
use crate::db::AppState;
use crate::models::audit::AuditLogEntry;
use crate::models::branch::{Branch, CreateBranchPayload, UpdateBranchPayload};
use crate::repositories::audit_repo::audit;
use crate::repositories::branch_repo::BranchRepository;
use chrono::{FixedOffset, Utc};
use tauri::State;

#[tauri::command]
pub async fn get_branches(state: State<'_, AppState>) -> Result<Vec<Branch>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    BranchRepository::list(&state.pool, &ctx.workspace_id)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn create_branch(
    state: State<'_, AppState>,
    payload: CreateBranchPayload,
) -> Result<Branch, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("branches.manage")
        .await
        .map_err(|e| e.to_response())?;

    let token = payload
        .step_up_token
        .as_deref()
        .ok_or_else(|| AuthError::StepUpRequired.to_response())?;
    let _approver_user_id = engine
        .consume_step_up(&ctx.user_id, "branches.manage", None, token)
        .await
        .map_err(|e| e.to_response())?;

    // Resolve business_id server-side from session workspace
    let business_row: Option<(String,)> = sqlx::query_as(
        "SELECT business_id FROM business WHERE workspace_id = ? LIMIT 1",
    )
    .bind(&ctx.workspace_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    let business_id = business_row
        .map(|r| r.0)
        .ok_or_else(|| AuthError::NotFound("Business profile not found".into()).to_response())?;

    // Fetch existing branch codes for this business
    let existing_rows: Vec<(String,)> = sqlx::query_as(
        "SELECT branch_code FROM branch WHERE business_id = ?",
    )
    .bind(&business_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    let existing_codes: Vec<String> = existing_rows.into_iter().map(|r| r.0).collect();

    // Server time in UTC+3 (Africa/Dar_es_Salaam)
    let tz3 = FixedOffset::east_opt(3 * 3600).unwrap();
    let now_tz = Utc::now().fixed_offset().with_timezone(&tz3);
    let now_str = Utc::now().to_rfc3339();

    let branch_code = crate::branch_code::generate_branch_code(
        &business_id,
        &existing_codes,
        payload.district.as_deref(),
        &payload.location,
        now_tz,
    );

    let branch_id = format!("br_{}", uuid::Uuid::new_v4().simple());
    let id = branch_id.clone();

    let status = payload.status.unwrap_or_else(|| "active".to_string());
    if status != "active" && status != "inactive" {
        return Err(AuthError::PolicyViolation("Invalid branch status".into()).to_response());
    }

    let mut tx = state
        .pool
        .begin()
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    // AUDIT FIRST (GOTCHAS #9)
    let audit_entry = AuditLogEntry {
        id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        created_at: now_str.clone(),
        action: "branch_created".to_string(),
        performed_by_user_id: Some(ctx.user_id.clone()),
        target_entity_type: "Branch".to_string(),
        target_entity_id: branch_id.clone(),
        metadata: Some(
            serde_json::json!({
                "branch_name": payload.name,
                "branch_code": branch_code,
            })
            .to_string(),
        ),
    };

    audit::append(&mut *tx, &audit_entry)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    let new_branch = Branch {
        id,
        workspace_id: ctx.workspace_id.clone(),
        branch_id,
        business_id,
        name: payload.name,
        location: Some(payload.location),
        district: payload.district,
        branch_code,
        status,
        contacts: payload.contacts,
        created_at: now_str.clone(),
        updated_at: now_str,
    };

    BranchRepository::create(&mut *tx, &new_branch)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    tx.commit()
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(new_branch)
}

#[tauri::command]
pub async fn update_branch(
    state: State<'_, AppState>,
    id: String,
    payload: UpdateBranchPayload,
) -> Result<Branch, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("branches.manage")
        .await
        .map_err(|e| e.to_response())?;

    let token = payload
        .step_up_token
        .as_deref()
        .ok_or_else(|| AuthError::StepUpRequired.to_response())?;
    let _approver_user_id = engine
        .consume_step_up(&ctx.user_id, "branches.manage", Some(&id), token)
        .await
        .map_err(|e| e.to_response())?;

    let now_str = Utc::now().to_rfc3339();

    if let Some(ref status) = payload.status {
        if status != "active" && status != "inactive" {
            return Err(AuthError::PolicyViolation("Invalid branch status".into()).to_response());
        }
    }

    let mut tx = state
        .pool
        .begin()
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    // AUDIT FIRST (GOTCHAS #9)
    let audit_entry = AuditLogEntry {
        id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        created_at: now_str.clone(),
        action: "branch_updated".to_string(),
        performed_by_user_id: Some(ctx.user_id.clone()),
        target_entity_type: "Branch".to_string(),
        target_entity_id: id.clone(),
        metadata: Some(
            serde_json::json!({
                "updates": payload,
            })
            .to_string(),
        ),
    };

    audit::append(&mut *tx, &audit_entry)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    let updated = BranchRepository::update(
        &mut *tx,
        &ctx.workspace_id,
        &id,
        payload.name.as_deref(),
        payload.location.as_deref(),
        payload.district.as_ref().map(|opt| opt.as_deref()),
        payload.status.as_deref(),
        payload.contacts.as_ref().map(|opt| opt.as_deref()),
        &now_str,
    )
    .await
    .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?
    .ok_or_else(|| AuthError::NotFound("Branch not found".into()).to_response())?;

    tx.commit()
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(updated)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_db_pool_with_url;
    use sqlx::SqlitePool;

    async fn setup_test_db() -> SqlitePool {
        let pool = init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to create memory db");
        sqlx::migrate!("../../../infra/db/sqlite-schema/migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");
        pool
    }

    #[tokio::test]
    async fn test_list_on_empty_table() {
        let pool = setup_test_db().await;
        let branches = BranchRepository::list(&pool, "ws_empty").await.unwrap();
        assert!(branches.is_empty());
    }

    #[tokio::test]
    async fn test_workspace_isolation() {
        let pool = setup_test_db().await;
        let now = chrono::Utc::now().to_rfc3339();
        let mut conn = pool.acquire().await.unwrap();

        sqlx::query("INSERT INTO business (id, workspace_id, branch_id, business_id, name, role_scopes, tier, contact_mobile, address_region, address_district, address_place, appearance_mode, language, idle_lock_minutes) VALUES ('b1', 'ws_1', 'br_1', 'AFYA-1', 'Biz 1', '[\"pharmacy\"]', 'free', '255700000000', 'Dar', 'Kinondoni', 'Mlimani', 'light', 'en', 5)")
            .execute(&mut *conn).await.unwrap();

        let b1 = Branch {
            id: "br_1".into(),
            workspace_id: "ws_1".into(),
            branch_id: "br_1".into(),
            business_id: "AFYA-1".into(),
            name: "Branch 1".into(),
            location: Some("Loc 1".into()),
            district: Some("Kinondoni".into()),
            branch_code: "AFYA-1-B01-KIN-2610".into(),
            status: "active".into(),
            contacts: None,
            created_at: now.clone(),
            updated_at: now.clone(),
        };
        BranchRepository::create(&mut conn, &b1).await.unwrap();

        let list_ws1 = BranchRepository::list(&pool, "ws_1").await.unwrap();
        assert_eq!(list_ws1.len(), 1);

        let list_ws2 = BranchRepository::list(&pool, "ws_2").await.unwrap();
        assert!(list_ws2.is_empty());
    }
}
