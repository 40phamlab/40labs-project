use crate::admin::AdminClaims;
use crate::routes::activation::AppState;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Extension, Json, Router,
};
use serde::Deserialize;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/businesses/:business_id/billing", get(get_business_billing))
        .route("/businesses/:business_id/billing/plan", post(change_billing_plan))
        .route("/businesses/:business_id/invoices", post(generate_invoice))
        .route("/invoices/:invoice_id/mark-paid", post(mark_invoice_paid))
        .route("/invoices/:invoice_id/void", post(void_invoice))
        .route("/billing/overview", get(get_billing_overview))
        .with_state(state)
}

async fn ensure_billing_account(pool: &sqlx::PgPool, business_id: &str) -> Result<(String, String), sqlx::Error> {
    let workspace_branch: Option<(String, String)> = sqlx::query_as(
        "SELECT workspace_id, branch_id FROM business_registry WHERE business_id = $1"
    )
    .bind(business_id)
    .fetch_optional(pool)
    .await?;

    let (workspace_id, branch_id) = match workspace_branch {
        Some(wb) => wb,
        None => ("ws_default".to_string(), "branch_default".to_string()),
    };

    sqlx::query(
        "INSERT INTO billing_account (business_id, workspace_id, branch_id, plan_class, billing_status) \
         VALUES ($1, $2, $3, 0, 'active') ON CONFLICT (business_id) DO NOTHING"
    )
    .bind(business_id)
    .bind(&workspace_id)
    .bind(&branch_id)
    .execute(pool)
    .await?;

    Ok((workspace_id, branch_id))
}

async fn get_business_billing(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
) -> impl IntoResponse {
    let account_res = sqlx::query_as::<_, (i32, Option<i64>, String, Option<chrono::DateTime<chrono::Utc>>, Option<chrono::DateTime<chrono::Utc>>)>(
        "SELECT plan_class, custom_amount_tzs, billing_status, started_at, next_invoice_at FROM billing_account WHERE business_id = $1"
    )
    .bind(&business_id)
    .fetch_optional(&state.pool)
    .await;

    let (workspace_id, _branch_id) = match ensure_billing_account(&state.pool, &business_id).await {
        Ok(wb) => wb,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code":"INTERNAL", "message":"Could not init billing account"} }))).into_response(),
    };

    let account = match account_res {
        Ok(Some(acc)) => serde_json::json!({
            "plan_class": acc.0,
            "custom_amount_tzs": acc.1,
            "billing_status": acc.2,
            "started_at": acc.3.map(|t| t.to_rfc3339()),
            "next_invoice_at": acc.4.map(|t| t.to_rfc3339())
        }),
        _ => serde_json::json!({
            "plan_class": 0,
            "custom_amount_tzs": null,
            "billing_status": "active",
            "started_at": null,
            "next_invoice_at": null
        }),
    };

    let revenue_30d: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(revenue_total), 0) FROM cloud_daily_summaries WHERE workspace_id = $1 AND summary_date >= CURRENT_DATE - INTERVAL '30 days'"
    )
    .bind(&workspace_id)
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    let product_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM cloud_inventory_items WHERE workspace_id = $1 AND deleted_at IS NULL"
    )
    .bind(&workspace_id)
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    let eligible_free_tier = revenue_30d < 250000 && product_count <= 50;

    let invoice_rows = sqlx::query_as::<_, (String, String, String, i32, i64, String, chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>, Option<String>, Option<String>, Option<String>)>(
        "SELECT id, period_start::text, period_end::text, plan_class, amount_tzs, status, issued_at, due_at, paid_at, payment_method, payment_ref, recorded_by \
         FROM invoice WHERE business_id = $1 ORDER BY issued_at DESC"
    )
    .bind(&business_id)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let now = chrono::Utc::now();
    let invoices: Vec<_> = invoice_rows.into_iter().map(|inv| {
        let mut status = inv.5;
        if status == "issued" && inv.7 < now {
            status = "overdue".to_string();
        }
        serde_json::json!({
            "id": inv.0,
            "period_start": inv.1,
            "period_end": inv.2,
            "plan_class": inv.3,
            "amount_tzs": inv.4,
            "status": status,
            "issued_at": inv.6.to_rfc3339(),
            "due_at": inv.7.to_rfc3339(),
            "paid_at": inv.8.map(|t| t.to_rfc3339()),
            "payment_method": inv.9,
            "payment_ref": inv.10,
            "recorded_by": inv.11
        })
    }).collect();

    Json(serde_json::json!({
        "account": account,
        "computed_30d_revenue": revenue_30d,
        "eligible_free_tier": eligible_free_tier,
        "product_count": product_count,
        "product_cap": 50,
        "invoices": invoices
    })).into_response()
}

#[derive(Deserialize, Debug)]
pub struct ChangePlanRequest {
    pub plan_class: i32,
    pub custom_amount_tzs: Option<i64>,
    pub reason: String,
    pub totp_code: String,
}

async fn change_billing_plan(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
    Extension(claims): Extension<AdminClaims>,
    Json(payload): Json<ChangePlanRequest>,
) -> impl IntoResponse {
    if !(0..=4).contains(&payload.plan_class) {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": {"code": "INVALID_PLAN", "message": "plan_class must be 0 to 4"} }))).into_response();
    }
    if payload.reason.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": {"code": "REASON_REQUIRED", "message": "Reason is required to change billing plan"} }))).into_response();
    }

    let totp_ok = match crate::admin::auth::verify_admin_totp(&state.pool, &state.config, &claims.user_id, &payload.totp_code).await {
        Ok(ok) => ok,
        Err(_) => false,
    };
    if !totp_ok {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": {"code": "INVALID_TOTP", "message": "Invalid TOTP code for step-up verification"} }))).into_response();
    }

    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not begin transaction"} }))).into_response(),
    };

    // GOTCHAS #9: Write audit entry BEFORE the mutation
    let audit_id = uuid::Uuid::new_v4().to_string();
    if sqlx::query(
        "INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, payload) \
         VALUES ($1, $2, 'billing_plan_change', 'business', $3, $4)"
    )
    .bind(&audit_id)
    .bind(&claims.user_id)
    .bind(&business_id)
    .bind(serde_json::json!({ "plan_class": payload.plan_class, "custom_amount_tzs": payload.custom_amount_tzs, "reason": payload.reason }))
    .execute(&mut *tx)
    .await.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not write audit log"} }))).into_response();
    }

    let _ = ensure_billing_account(&state.pool, &business_id).await;

    let res = sqlx::query(
        "UPDATE billing_account SET plan_class = $1, custom_amount_tzs = $2 WHERE business_id = $3"
    )
    .bind(payload.plan_class)
    .bind(payload.custom_amount_tzs)
    .bind(&business_id)
    .execute(&mut *tx)
    .await;

    if res.is_err() || tx.commit().await.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not update billing plan"} }))).into_response();
    }

    Json(serde_json::json!({ "success": true, "plan_class": payload.plan_class })).into_response()
}

#[derive(Deserialize, Debug)]
pub struct GenerateInvoiceRequest {
    pub period_start: String,
    pub period_end: String,
    pub plan_class: i32,
    pub amount_tzs: i64,
    pub due_at: String,
    pub totp_code: String,
}

async fn generate_invoice(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
    Extension(claims): Extension<AdminClaims>,
    Json(payload): Json<GenerateInvoiceRequest>,
) -> impl IntoResponse {
    let totp_ok = match crate::admin::auth::verify_admin_totp(&state.pool, &state.config, &claims.user_id, &payload.totp_code).await {
        Ok(ok) => ok,
        Err(_) => false,
    };
    if !totp_ok {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": {"code": "INVALID_TOTP", "message": "Invalid TOTP code for step-up verification"} }))).into_response();
    }

    let (workspace_id, branch_id) = match ensure_billing_account(&state.pool, &business_id).await {
        Ok(wb) => wb,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code":"INTERNAL", "message":"Could not init billing account"} }))).into_response(),
    };

    let invoice_id = format!("inv_{}", uuid::Uuid::new_v4());
    let due_dt = match chrono::DateTime::parse_from_rfc3339(&payload.due_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(_) => chrono::Utc::now() + chrono::Duration::days(30),
    };

    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not begin transaction"} }))).into_response(),
    };

    // GOTCHAS #9: Audit log before mutation
    let audit_id = uuid::Uuid::new_v4().to_string();
    if sqlx::query(
        "INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, payload) \
         VALUES ($1, $2, 'invoice_generate', 'business', $3, $4)"
    )
    .bind(&audit_id)
    .bind(&claims.user_id)
    .bind(&business_id)
    .bind(serde_json::json!({ "invoice_id": invoice_id, "amount_tzs": payload.amount_tzs, "plan_class": payload.plan_class }))
    .execute(&mut *tx)
    .await.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not write audit log"} }))).into_response();
    }

    let res = sqlx::query(
        "INSERT INTO invoice (id, workspace_id, branch_id, business_id, period_start, period_end, plan_class, amount_tzs, status, due_at) \
         VALUES ($1, $2, $3, $4, $5::date, $6::date, $7, $8, 'issued', $9)"
    )
    .bind(&invoice_id)
    .bind(&workspace_id)
    .bind(&branch_id)
    .bind(&business_id)
    .bind(&payload.period_start)
    .bind(&payload.period_end)
    .bind(payload.plan_class)
    .bind(payload.amount_tzs)
    .bind(due_dt)
    .execute(&mut *tx)
    .await;

    if res.is_err() || tx.commit().await.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not generate invoice"} }))).into_response();
    }

    Json(serde_json::json!({ "success": true, "invoice_id": invoice_id })).into_response()
}

#[derive(Deserialize, Debug)]
pub struct MarkPaidRequest {
    pub payment_method: String,
    pub payment_ref: String,
    pub totp_code: String,
}

async fn mark_invoice_paid(
    State(state): State<AppState>,
    Path(invoice_id): Path<String>,
    Extension(claims): Extension<AdminClaims>,
    Json(payload): Json<MarkPaidRequest>,
) -> impl IntoResponse {
    if !["mpesa", "airtel", "tigo", "bank", "cash"].contains(&payload.payment_method.as_str()) {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": {"code": "INVALID_METHOD", "message": "Invalid payment method"} }))).into_response();
    }

    let totp_ok = match crate::admin::auth::verify_admin_totp(&state.pool, &state.config, &claims.user_id, &payload.totp_code).await {
        Ok(ok) => ok,
        Err(_) => false,
    };
    if !totp_ok {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": {"code": "INVALID_TOTP", "message": "Invalid TOTP code for step-up verification"} }))).into_response();
    }

    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not begin transaction"} }))).into_response(),
    };

    // GOTCHAS #9: Audit log before mutation
    let audit_id = uuid::Uuid::new_v4().to_string();
    if sqlx::query(
        "INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, payload) \
         VALUES ($1, $2, 'invoice_mark_paid', 'invoice', $3, $4)"
    )
    .bind(&audit_id)
    .bind(&claims.user_id)
    .bind(&invoice_id)
    .bind(serde_json::json!({ "payment_method": payload.payment_method, "payment_ref": payload.payment_ref }))
    .execute(&mut *tx)
    .await.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not write audit log"} }))).into_response();
    }

    let res = sqlx::query(
        "UPDATE invoice SET status = 'paid', paid_at = NOW(), payment_method = $1, payment_ref = $2, recorded_by = $3 WHERE id = $4"
    )
    .bind(&payload.payment_method)
    .bind(&payload.payment_ref)
    .bind(&claims.email)
    .bind(&invoice_id)
    .execute(&mut *tx)
    .await;

    if res.is_err() || tx.commit().await.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not mark invoice as paid"} }))).into_response();
    }

    Json(serde_json::json!({ "success": true })).into_response()
}

#[derive(Deserialize, Debug)]
pub struct VoidInvoiceRequest {
    pub reason: String,
    pub totp_code: String,
}

async fn void_invoice(
    State(state): State<AppState>,
    Path(invoice_id): Path<String>,
    Extension(claims): Extension<AdminClaims>,
    Json(payload): Json<VoidInvoiceRequest>,
) -> impl IntoResponse {
    if payload.reason.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": {"code": "REASON_REQUIRED", "message": "Reason is required to void invoice"} }))).into_response();
    }

    let totp_ok = match crate::admin::auth::verify_admin_totp(&state.pool, &state.config, &claims.user_id, &payload.totp_code).await {
        Ok(ok) => ok,
        Err(_) => false,
    };
    if !totp_ok {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": {"code": "INVALID_TOTP", "message": "Invalid TOTP code for step-up verification"} }))).into_response();
    }

    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not begin transaction"} }))).into_response(),
    };

    // GOTCHAS #9: Audit log before mutation
    let audit_id = uuid::Uuid::new_v4().to_string();
    if sqlx::query(
        "INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, payload) \
         VALUES ($1, $2, 'invoice_void', 'invoice', $3, $4)"
    )
    .bind(&audit_id)
    .bind(&claims.user_id)
    .bind(&invoice_id)
    .bind(serde_json::json!({ "reason": payload.reason }))
    .execute(&mut *tx)
    .await.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not write audit log"} }))).into_response();
    }

    let res = sqlx::query(
        "UPDATE invoice SET status = 'void' WHERE id = $1"
    )
    .bind(&invoice_id)
    .execute(&mut *tx)
    .await;

    if res.is_err() || tx.commit().await.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not void invoice"} }))).into_response();
    }

    Json(serde_json::json!({ "success": true })).into_response()
}

async fn get_billing_overview(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let mrr: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(CASE \
            WHEN a.plan_class = 1 THEN 25000 \
            WHEN a.plan_class = 2 THEN 45000 \
            WHEN a.plan_class = 3 THEN 69000 \
            WHEN a.plan_class = 4 THEN COALESCE(a.custom_amount_tzs, 0) \
            ELSE 0 END), 0) FROM billing_account a WHERE a.billing_status = 'active'"
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    let outstanding: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(amount_tzs), 0) FROM invoice WHERE status = 'issued' OR (status = 'issued' AND due_at < NOW())"
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    let paid_this_month: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(amount_tzs), 0) FROM invoice WHERE status = 'paid' AND paid_at >= DATE_TRUNC('month', NOW())"
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    let overdue_rows = sqlx::query_as::<_, (String, String, i64, chrono::DateTime<chrono::Utc>)>(
        "SELECT i.id, i.business_id, i.amount_tzs, i.due_at FROM invoice i WHERE i.status = 'issued' AND i.due_at < NOW() ORDER BY i.due_at ASC LIMIT 50"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let overdue_list: Vec<_> = overdue_rows.into_iter().map(|inv| serde_json::json!({
        "invoice_id": inv.0,
        "business_id": inv.1,
        "amount_tzs": inv.2,
        "due_at": inv.3.to_rfc3339()
    })).collect();

    Json(serde_json::json!({
        "mrr": mrr,
        "outstanding": outstanding,
        "paid_this_month": paid_this_month,
        "overdue_list": overdue_list
    })).into_response()
}

#[cfg(test)]
mod tier_calculation_tests {
    fn compute_eligible_free_tier(revenue_30d: i64, product_count: i64) -> bool {
        revenue_30d < 250_000 && product_count <= 50
    }

    #[test]
    fn test_tier_calculation_edge_cases() {
        // Under 250,000 and <= 50 products -> Free tier eligible
        assert!(compute_eligible_free_tier(249_999, 50));
        assert!(compute_eligible_free_tier(0, 0));

        // Exactly 250,000 revenue -> Not free tier eligible (must be < 250,000)
        assert!(!compute_eligible_free_tier(250_000, 10));

        // Over 250,000 revenue -> Not free tier eligible
        assert!(!compute_eligible_free_tier(300_000, 20));

        // Over 50 products -> Not free tier eligible
        assert!(!compute_eligible_free_tier(100_000, 51));
    }
}
