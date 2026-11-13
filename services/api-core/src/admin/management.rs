use crate::{admin::AdminClaims, routes::activation::AppState};
use axum::{extract::{Path, Query, State}, http::StatusCode, response::{IntoResponse, Response}, routing::{get, patch}, Extension, Json, Router};
use serde::Deserialize;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/workspaces", get(list_workspaces))
        .route("/workspaces/:workspace_id/branches", get(list_branches))
        .route("/admin-users", get(list_admin_users))
        .route("/admin-users/:admin_id", patch(update_admin_user))
        .route("/audit-log", get(list_audit_log))
        .with_state(state)
}

fn error(status: StatusCode, code: &'static str, message: &'static str) -> Response {
    (status, Json(serde_json::json!({"error":{"code":code,"message":message}}))).into_response()
}

fn page_args(page: Option<i64>, limit: Option<i64>) -> Result<(i64, i64, i64), Response> {
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(25);
    if page < 1 || !(1..=100).contains(&limit) {
        return Err(error(StatusCode::BAD_REQUEST, "VALIDATION", "page must be positive and limit must be between 1 and 100"));
    }
    Ok((page, limit, page.saturating_sub(1).saturating_mul(limit)))
}

#[derive(Deserialize)]
struct PageQuery { page: Option<i64>, limit: Option<i64>, q: Option<String> }

async fn list_workspaces(State(state): State<AppState>, Query(query): Query<PageQuery>) -> Response {
    let (page, limit, offset) = match page_args(query.page, query.limit) { Ok(args) => args, Err(response) => return response };
    let q = query.q.as_deref().map(str::trim).filter(|value| !value.is_empty());
    let rows = sqlx::query_as::<_, (String, Option<String>, i64, Option<String>)>(
        "SELECT workspace_id, MIN(name), COUNT(DISTINCT branch_id), MIN(created_at) FROM business_registry WHERE ($1::text IS NULL OR workspace_id ILIKE '%' || $1 || '%' OR name ILIKE '%' || $1 || '%') GROUP BY workspace_id ORDER BY workspace_id LIMIT $2 OFFSET $3"
    ).bind(q).bind(limit).bind(offset).fetch_all(&state.pool).await;
    let rows = match rows { Ok(rows) => rows, Err(_) => return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not load workspaces") };
    let total: i64 = match sqlx::query_scalar("SELECT COUNT(DISTINCT workspace_id) FROM business_registry WHERE ($1::text IS NULL OR workspace_id ILIKE '%' || $1 || '%' OR name ILIKE '%' || $1 || '%')")
        .bind(q).fetch_one(&state.pool).await { Ok(total) => total, Err(_) => return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not count workspaces") };
    let items: Vec<_> = rows.into_iter().map(|(workspace_id,name,branch_count,created_at)| serde_json::json!({"workspace_id":workspace_id,"name":name,"branch_count":branch_count,"created_at":created_at})).collect();
    Json(serde_json::json!({"items":items,"page":page,"limit":limit,"total":total,"total_pages":(total + limit - 1) / limit})).into_response()
}

async fn list_branches(State(state): State<AppState>, Path(workspace_id): Path<String>, Query(query): Query<PageQuery>) -> Response {
    let (page, limit, offset) = match page_args(query.page, query.limit) { Ok(args) => args, Err(response) => return response };
    let rows = sqlx::query_as::<_, (String, String, Option<String>, Option<String>, String, Option<String>)>(
        "SELECT b.business_id, b.branch_id, b.name, b.address_region, COALESCE(v.status,'pending'), b.created_at FROM business_registry b LEFT JOIN business_verification v ON v.business_id = b.business_id WHERE b.workspace_id = $1 ORDER BY b.branch_id, b.business_id LIMIT $2 OFFSET $3"
    ).bind(&workspace_id).bind(limit).bind(offset).fetch_all(&state.pool).await;
    let rows = match rows { Ok(rows) => rows, Err(_) => return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not load workspace branches") };
    if rows.is_empty() && page == 1 {
        let exists: Result<bool, _> = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM business_registry WHERE workspace_id = $1)").bind(&workspace_id).fetch_one(&state.pool).await;
        match exists { Ok(false) => return error(StatusCode::NOT_FOUND, "NOT_FOUND", "Workspace not found"), Err(_) => return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not verify workspace") , _ => {} }
    }
    let total: i64 = match sqlx::query_scalar("SELECT COUNT(*) FROM business_registry WHERE workspace_id = $1").bind(&workspace_id).fetch_one(&state.pool).await { Ok(total) => total, Err(_) => return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not count workspace branches") };
    let items: Vec<_> = rows.into_iter().map(|(business_id,branch_id,name,region,verification_status,created_at)| serde_json::json!({"business_id":business_id,"branch_id":branch_id,"name":name,"region":region,"verification_status":verification_status,"created_at":created_at})).collect();
    Json(serde_json::json!({"workspace_id":workspace_id,"items":items,"page":page,"limit":limit,"total":total,"total_pages":(total + limit - 1) / limit})).into_response()
}

async fn list_admin_users(State(state): State<AppState>, Query(query): Query<PageQuery>) -> Response {
    let (page, limit, offset) = match page_args(query.page, query.limit) { Ok(args) => args, Err(response) => return response };
    let q = query.q.as_deref().map(str::trim).filter(|value| !value.is_empty());
    let rows = sqlx::query_as::<_, (String, String, String, Option<chrono::DateTime<chrono::Utc>>, chrono::DateTime<chrono::Utc>)>(
        "SELECT id,email,role,disabled_at,created_at FROM admin_users WHERE ($1::text IS NULL OR email ILIKE '%' || $1 || '%' OR id ILIKE '%' || $1 || '%') ORDER BY created_at DESC,id LIMIT $2 OFFSET $3"
    ).bind(q).bind(limit).bind(offset).fetch_all(&state.pool).await;
    let rows = match rows { Ok(rows) => rows, Err(_) => return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not load administrative users") };
    let total: i64 = match sqlx::query_scalar("SELECT COUNT(*) FROM admin_users WHERE ($1::text IS NULL OR email ILIKE '%' || $1 || '%' OR id ILIKE '%' || $1 || '%')").bind(q).fetch_one(&state.pool).await { Ok(total) => total, Err(_) => return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not count administrative users") };
    let items: Vec<_> = rows.into_iter().map(|(id,email,role,disabled_at,created_at)| serde_json::json!({"id":id,"email":email,"role":role,"disabled_at":disabled_at,"created_at":created_at})).collect();
    Json(serde_json::json!({"items":items,"page":page,"limit":limit,"total":total,"total_pages":(total + limit - 1) / limit})).into_response()
}

#[derive(Deserialize)]
struct AdminUserUpdate { role: Option<String>, disabled: Option<bool> }

async fn update_admin_user(State(state): State<AppState>, Path(admin_id): Path<String>, Extension(claims): Extension<AdminClaims>, Json(payload): Json<AdminUserUpdate>) -> Response {
    const ROLES: [&str; 4] = ["super_admin", "admin", "reviewer", "viewer"];
    if payload.role.as_deref().is_some_and(|role| !ROLES.contains(&role)) { return error(StatusCode::BAD_REQUEST, "VALIDATION", "role must be super_admin, admin, reviewer, or viewer"); }
    if payload.role.is_none() && payload.disabled.is_none() { return error(StatusCode::BAD_REQUEST, "VALIDATION", "Provide a role or disabled value"); }
    if admin_id == claims.user_id && (payload.role.is_some() || payload.disabled == Some(true)) { return error(StatusCode::CONFLICT, "SELF_MODIFICATION", "You cannot change your own role or disable your own account"); }

    let mut tx = match state.pool.begin().await { Ok(tx) => tx, Err(_) => return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not begin user update") };
    if sqlx::query("LOCK TABLE admin_users IN EXCLUSIVE MODE").execute(&mut *tx).await.is_err() {
        return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not lock administrative users for update");
    }
    let current = sqlx::query_as::<_, (String, Option<chrono::DateTime<chrono::Utc>>)>("SELECT role,disabled_at FROM admin_users WHERE id = $1 FOR UPDATE").bind(&admin_id).fetch_optional(&mut *tx).await;
    let (current_role, current_disabled) = match current { Ok(Some(row)) => row, Ok(None) => return error(StatusCode::NOT_FOUND, "NOT_FOUND", "Administrative user not found"), Err(_) => return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not load administrative user") };
    let will_remove_super = current_role == "super_admin" && current_disabled.is_none() && (payload.role.as_deref().is_some_and(|role| role != "super_admin") || payload.disabled == Some(true));
    if will_remove_super {
        let count: i64 = match sqlx::query_scalar("SELECT COUNT(*) FROM admin_users WHERE role='super_admin' AND disabled_at IS NULL").fetch_one(&mut *tx).await { Ok(count) => count, Err(_) => return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not validate super-admin safety") };
        if count <= 1 { return error(StatusCode::CONFLICT, "LAST_SUPER_ADMIN", "At least one enabled super_admin account must remain"); }
    }
    let updated = sqlx::query("UPDATE admin_users SET role=COALESCE($2,role), disabled_at=CASE WHEN $3::boolean IS NULL THEN disabled_at WHEN $3 THEN NOW() ELSE NULL END WHERE id=$1")
        .bind(&admin_id).bind(payload.role.as_deref()).bind(payload.disabled).execute(&mut *tx).await;
    if updated.is_err() { return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not update administrative user"); }
    if sqlx::query("INSERT INTO admin_audit_log (id,admin_user_id,action,target_type,target_id,payload) VALUES ($1,$2,'admin_user_updated','admin_user',$3,$4)")
        .bind(uuid::Uuid::new_v4().to_string()).bind(&claims.user_id).bind(&admin_id)
        .bind(serde_json::json!({"role":payload.role,"disabled":payload.disabled})).execute(&mut *tx).await.is_err() {
        return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not record administrative user audit event");
    }
    if tx.commit().await.is_err() { return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not commit administrative user update"); }
    Json(serde_json::json!({"id":admin_id,"role":payload.role,"disabled":payload.disabled})).into_response()
}

#[derive(Deserialize)]
struct AuditQuery { page: Option<i64>, limit: Option<i64>, target_type: Option<String>, action: Option<String> }

async fn list_audit_log(State(state): State<AppState>, Query(query): Query<AuditQuery>) -> Response {
    let (page, limit, offset) = match page_args(query.page, query.limit) { Ok(args) => args, Err(response) => return response };
    let rows = sqlx::query_as::<_, (String, Option<String>, String, String, String, Option<serde_json::Value>, chrono::DateTime<chrono::Utc>)>(
        "SELECT l.id,u.email,l.action,l.target_type,l.target_id,l.payload,l.created_at FROM admin_audit_log l LEFT JOIN admin_users u ON u.id=l.admin_user_id WHERE ($1::text IS NULL OR l.target_type=$1) AND ($2::text IS NULL OR l.action=$2) ORDER BY l.created_at DESC,l.id DESC LIMIT $3 OFFSET $4"
    ).bind(query.target_type.as_deref()).bind(query.action.as_deref()).bind(limit).bind(offset).fetch_all(&state.pool).await;
    let rows = match rows { Ok(rows) => rows, Err(_) => return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not load administrative audit records") };
    let total: i64 = match sqlx::query_scalar("SELECT COUNT(*) FROM admin_audit_log WHERE ($1::text IS NULL OR target_type=$1) AND ($2::text IS NULL OR action=$2)").bind(query.target_type.as_deref()).bind(query.action.as_deref()).fetch_one(&state.pool).await { Ok(total) => total, Err(_) => return error(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Could not count administrative audit records") };
    let data: Vec<_> = rows.into_iter().map(|(id,admin_email,action,target_type,target_id,payload,created_at)| serde_json::json!({"id":id,"admin_email":admin_email,"action":action,"target_type":target_type,"target_id":target_id,"payload":payload,"created_at":created_at})).collect();
    Json(serde_json::json!({"data":data,"page":page,"limit":limit,"total":total,"total_pages":(total + limit - 1) / limit})).into_response()
}
