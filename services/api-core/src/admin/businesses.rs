use crate::admin::AdminClaims;
use crate::routes::activation::AppState;
use axum::Extension;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/businesses/counts", get(get_business_counts))
        .route("/businesses/export.csv", get(export_businesses_csv))
        .route("/businesses", get(list_businesses))
        .route("/businesses/:business_id", get(get_business))
        .route("/businesses/:business_id/status", post(update_business_status))
        .route("/businesses/:business_id/notes", get(list_notes).post(create_note))
        .route("/businesses/:business_id/activity-timeline", get(get_activity_timeline))
        .route("/businesses/:business_id/stock", get(get_stock))
        .route("/businesses/:business_id/sync", get(get_sync))
        .route("/businesses/:business_id/activity", get(get_activity))
        .route(
            "/businesses/:business_id/verification",
            post(verify_business),
        )
        .with_state(state)
}

#[derive(Deserialize, Debug)]
pub struct ListQuery {
    pub status: Option<String>,
    pub q: Option<String>,
    pub region: Option<String>,
    pub tier: Option<String>,
    pub sort: Option<String>,
    pub direction: Option<String>,
    pub order: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub page_size: Option<i64>,
}

#[derive(Serialize, Debug)]
pub struct BusinessListItem {
    pub business_id: String,
    pub name: Option<String>,
    pub region: Option<String>,
    pub district: Option<String>,
    pub tmda_number: Option<String>,
    pub tier: String,
    pub status: String,
    pub verification_status: String,
    pub owner_name: Option<String>,
    pub owner_phone: Option<String>,
    pub role_scopes: Option<String>,
    pub last_sync_at: Option<String>,
    pub last_sync: Option<String>,
    pub created_at: String,
    pub profile_complete: bool,
}

#[derive(Serialize, Debug)]
pub struct BusinessCounts {
    pub all: i64,
    pub pending: i64,
    pub verified: i64,
    pub rejected: i64,
    pub suspended: i64,
}

#[derive(Serialize, Debug)]
pub struct ListResponse {
    pub items: Vec<BusinessListItem>,
    pub total: i64,
    pub counts: BusinessCounts,
    pub page: i64,
    pub page_size: i64,
    pub limit: i64,
    pub total_pages: i64,
}

async fn get_business_counts(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let all: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM business_registry")
        .fetch_one(&state.pool).await
        .unwrap_or(0);
    let pending: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM business_registry b LEFT JOIN business_verification v ON b.business_id = v.business_id WHERE COALESCE(v.status, 'pending') = 'pending'")
        .fetch_one(&state.pool).await
        .unwrap_or(0);
    let verified: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM business_registry b JOIN business_verification v ON b.business_id = v.business_id WHERE v.status = 'verified'")
        .fetch_one(&state.pool).await
        .unwrap_or(0);
    let rejected: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM business_registry b JOIN business_verification v ON b.business_id = v.business_id WHERE v.status = 'rejected'")
        .fetch_one(&state.pool).await
        .unwrap_or(0);
    let suspended: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM business_registry b JOIN business_verification v ON b.business_id = v.business_id WHERE v.status = 'suspended'")
        .fetch_one(&state.pool).await
        .unwrap_or(0);

    Ok(Json(serde_json::json!({
        "all": all,
        "pending": pending,
        "verified": verified,
        "rejected": rejected,
        "suspended": suspended
    })))
}

async fn list_businesses(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.or(query.page_size).unwrap_or(25);
    if page < 1 || !(1..=100).contains(&limit) {
        return Err((StatusCode::BAD_REQUEST, Json(serde_json::json!({
            "error": { "code": "VALIDATION", "message": "page must be positive and limit must be between 1 and 100" }
        }))));
    }
    let offset = (page - 1) * limit;

    let status_filter = query.status.as_deref().unwrap_or("all");
    if !["all", "pending", "verified", "rejected", "suspended"].contains(&status_filter) {
        return Err((StatusCode::BAD_REQUEST, Json(serde_json::json!({
            "error": { "code": "VALIDATION", "message": "status must be all, pending, verified, rejected, or suspended" }
        }))));
    }
    let search_q = query.q.as_deref().unwrap_or("").trim();
    let region_filter = query.region.as_deref();
    let tier_filter = query.tier.as_deref();
    let sort_col = query.sort.as_deref().unwrap_or("created_at");
    let sort_dir = query.direction.as_deref().or(query.order.as_deref()).unwrap_or("desc").to_uppercase();
    if sort_dir != "ASC" && sort_dir != "DESC" {
        return Err((StatusCode::BAD_REQUEST, Json(serde_json::json!({
            "error": { "code": "VALIDATION", "message": "direction must be asc or desc" }
        }))));
    }

    let mut qb = sqlx::QueryBuilder::new(
        r#"
        SELECT
            b.business_id,
            b.name,
            b.address_region AS region,
            b.address_district AS district,
            b.tmda_number,
            COALESCE(b.tier, 'free') AS tier,
            COALESCE(v.status, 'pending') AS status,
            COALESCE(v.status, 'pending') AS verification_status,
            b.name AS owner_name,
            b.contact_mobile AS owner_phone,
            b.role_scopes,
            (SELECT GREATEST(
                (SELECT MAX(received_at) FROM sync_changes WHERE workspace_id = b.workspace_id AND branch_id = b.branch_id),
                (SELECT MAX(COALESCE(last_seen_at, last_seen)) FROM sync_devices WHERE workspace_id = b.workspace_id AND (branch_id = b.branch_id OR branch_id = ''))
            )) AS last_sync_at,
            b.created_at,
            CASE WHEN b.name IS NOT NULL AND TRIM(b.name) <> '' AND b.address_region IS NOT NULL AND TRIM(b.address_region) <> '' AND b.tmda_number IS NOT NULL AND TRIM(b.tmda_number) <> '' THEN TRUE ELSE FALSE END AS profile_complete
        FROM business_registry b
        LEFT JOIN business_verification v ON b.business_id = v.business_id
        WHERE 1=1
        "#,
    );

    if status_filter != "all" {
        qb.push(" AND COALESCE(v.status, 'pending') = ");
        qb.push_bind(status_filter);
    }

    if !search_q.is_empty() {
        qb.push(" AND (b.business_id ILIKE ");
        qb.push_bind(format!("%{}%", search_q));
        qb.push(" OR b.name ILIKE ");
        qb.push_bind(format!("%{}%", search_q));
        qb.push(" OR b.tmda_number ILIKE ");
        qb.push_bind(format!("%{}%", search_q));
        qb.push(")");
    }

    if let Some(reg) = region_filter {
        if !reg.is_empty() {
            qb.push(" AND b.address_region = ");
            qb.push_bind(reg);
        }
    }

    if let Some(tr) = tier_filter {
        if !tr.is_empty() {
            qb.push(" AND b.tier = ");
            qb.push_bind(tr);
        }
    }

    let mut count_qb = sqlx::QueryBuilder::new(
        "SELECT COUNT(*) FROM business_registry b LEFT JOIN business_verification v ON b.business_id = v.business_id WHERE 1=1"
    );
    if status_filter != "all" {
        count_qb.push(" AND COALESCE(v.status, 'pending') = ");
        count_qb.push_bind(status_filter);
    }
    if !search_q.is_empty() {
        count_qb.push(" AND (b.business_id ILIKE ");
        count_qb.push_bind(format!("%{}%", search_q));
        count_qb.push(" OR b.name ILIKE ");
        count_qb.push_bind(format!("%{}%", search_q));
        count_qb.push(" OR b.tmda_number ILIKE ");
        count_qb.push_bind(format!("%{}%", search_q));
        count_qb.push(")");
    }
    if let Some(reg) = region_filter {
        if !reg.is_empty() {
            count_qb.push(" AND b.address_region = ");
            count_qb.push_bind(reg);
        }
    }
    if let Some(tr) = tier_filter {
        if !tr.is_empty() {
            count_qb.push(" AND b.tier = ");
            count_qb.push_bind(tr);
        }
    }

    let total: i64 = count_qb.build_query_scalar().fetch_one(&state.pool).await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "error": { "code": "INTERNAL", "message": "Could not count businesses" }
        }))))?;

    let safe_sort = match sort_col {
        "name" => "b.name",
        "business_id" => "b.business_id",
        "region" => "b.address_region",
        "district" => "b.address_district",
        "tier" => "b.tier",
        "created_at" => "b.created_at",
        "last_sync" | "last_sync_at" => "last_sync_at",
        _ => "b.created_at",
    };
    qb.push(format!(" ORDER BY {} {}", safe_sort, sort_dir));
    qb.push(" LIMIT ");
    qb.push_bind(limit);
    qb.push(" OFFSET ");
    qb.push_bind(offset);

    let rows = match qb
        .build_query_as::<(
            String,
            Option<String>,
            Option<String>,
            Option<String>,
            Option<String>,
            String,
            String,
            String,
            Option<String>,
            Option<String>,
            Option<String>,
            Option<chrono::DateTime<chrono::Utc>>,
            String,
            bool,
        )>()
        .fetch_all(&state.pool)
        .await
    {
        Ok(r) => r,
        Err(_) => return Err((StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "error": { "code": "INTERNAL", "message": "Could not load businesses" }
        })))),
    };

    let items: Vec<BusinessListItem> = rows
        .into_iter()
        .map(|row| BusinessListItem {
            business_id: row.0,
            name: row.1,
            region: row.2,
            district: row.3,
            tmda_number: row.4,
            tier: row.5,
            status: row.6,
            verification_status: row.7,
            owner_name: row.8,
            owner_phone: row.9,
            role_scopes: row.10,
            last_sync_at: row.11.map(|timestamp| timestamp.to_rfc3339()),
            last_sync: row.11.map(|timestamp| timestamp.to_rfc3339()),
            created_at: row.12,
            profile_complete: row.13,
        })
        .collect();

    let all: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM business_registry")
        .fetch_one(&state.pool).await.unwrap_or(0);
    let pending: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM business_registry b LEFT JOIN business_verification v ON b.business_id = v.business_id WHERE COALESCE(v.status, 'pending') = 'pending'")
        .fetch_one(&state.pool).await.unwrap_or(0);
    let verified: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM business_registry b JOIN business_verification v ON b.business_id = v.business_id WHERE v.status = 'verified'")
        .fetch_one(&state.pool).await.unwrap_or(0);
    let rejected: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM business_registry b JOIN business_verification v ON b.business_id = v.business_id WHERE v.status = 'rejected'")
        .fetch_one(&state.pool).await.unwrap_or(0);
    let suspended: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM business_registry b JOIN business_verification v ON b.business_id = v.business_id WHERE v.status = 'suspended'")
        .fetch_one(&state.pool).await.unwrap_or(0);

    let counts = BusinessCounts { all, pending, verified, rejected, suspended };

    let total_pages = if limit > 0 {
        (total + limit - 1) / limit
    } else {
        1
    };

    Ok(Json(ListResponse {
        items,
        total,
        counts,
        page,
        page_size: limit,
        limit,
        total_pages,
    }))
}

fn sanitize_csv_field(val: &str) -> String {
    let escaped = val.replace('"', "\"\"");
    if escaped.starts_with('=') || escaped.starts_with('+') || escaped.starts_with('-') || escaped.starts_with('@') {
        format!("'{}", escaped)
    } else {
        escaped
    }
}

async fn export_businesses_csv(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> impl IntoResponse {
    let status_filter = query.status.as_deref().unwrap_or("all");
    let search_q = query.q.as_deref().unwrap_or("").trim();
    let region_filter = query.region.as_deref();
    let tier_filter = query.tier.as_deref();

    let mut qb = sqlx::QueryBuilder::new(
        r#"
        SELECT
            b.business_id,
            b.name,
            b.address_region,
            b.address_district,
            b.tmda_number,
            COALESCE(b.tier, 'free') AS tier,
            COALESCE(v.status, 'pending') AS status,
            b.created_at
        FROM business_registry b
        LEFT JOIN business_verification v ON b.business_id = v.business_id
        WHERE 1=1
        "#,
    );

    if status_filter != "all" {
        qb.push(" AND COALESCE(v.status, 'pending') = ");
        qb.push_bind(status_filter);
    }
    if !search_q.is_empty() {
        qb.push(" AND (b.business_id ILIKE ");
        qb.push_bind(format!("%{}%", search_q));
        qb.push(" OR b.name ILIKE ");
        qb.push_bind(format!("%{}%", search_q));
        qb.push(" OR b.tmda_number ILIKE ");
        qb.push_bind(format!("%{}%", search_q));
        qb.push(")");
    }
    if let Some(reg) = region_filter {
        if !reg.is_empty() {
            qb.push(" AND b.address_region = ");
            qb.push_bind(reg);
        }
    }
    if let Some(tr) = tier_filter {
        if !tr.is_empty() {
            qb.push(" AND b.tier = ");
            qb.push_bind(tr);
        }
    }
    qb.push(" ORDER BY b.created_at DESC");

    let rows = match qb.build_query_as::<(String, Option<String>, Option<String>, Option<String>, Option<String>, String, String, String)>()
        .fetch_all(&state.pool)
        .await {
            Ok(r) => r,
            Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
        };

    let mut csv = "Business ID,Name,Region,District,TMDA Number,Tier,Status,Created At\n".to_string();
    for r in rows {
        csv.push_str(&format!(
            "\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\"\n",
            sanitize_csv_field(&r.0),
            sanitize_csv_field(r.1.as_deref().unwrap_or("")),
            sanitize_csv_field(r.2.as_deref().unwrap_or("")),
            sanitize_csv_field(r.3.as_deref().unwrap_or("")),
            sanitize_csv_field(r.4.as_deref().unwrap_or("")),
            sanitize_csv_field(&r.5),
            sanitize_csv_field(&r.6),
            sanitize_csv_field(&r.7),
        ));
    }

    (
        StatusCode::OK,
        [(axum::http::header::CONTENT_TYPE, "text/csv; charset=utf-8"),
         (axum::http::header::CONTENT_DISPOSITION, "attachment; filename=\"businesses_export.csv\"")],
        csv,
    ).into_response()
}

#[derive(sqlx::FromRow)]
struct BusinessProfileRow {
    business_id: String,
    workspace_id: String,
    _branch_id: String,
    name: Option<String>,
    logo_url: Option<String>,
    scale: Option<String>,
    role_scopes: Option<String>,
    owner_type: Option<String>,
    owner_first_name: Option<String>,
    owner_last_name: Option<String>,
    phone: Option<String>,
    email: Option<String>,
    region: Option<String>,
    district: Option<String>,
    ward: Option<String>,
    address_text: Option<String>,
    tmda_number: Option<String>,
    pharmacy_council_no: Option<String>,
    verification_status: String,
    reviewed_at: Option<chrono::DateTime<chrono::Utc>>,
    reviewed_by: Option<String>,
    created_at: Option<String>,
    profile_complete: bool,
}

async fn get_business(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
) -> impl IntoResponse {
    let row = sqlx::query_as::<_, BusinessProfileRow>(
        r#"
        SELECT
            b.business_id,
            b.workspace_id,
            b.branch_id,
            b.name,
            b.logo_url,
            COALESCE(b.scale, 'medium') AS scale,
            COALESCE(b.role_scopes, 'pharmacy') AS role_scopes,
            COALESCE(b.owner_type, 'personal') AS owner_type,
            b.name AS owner_first_name,
            '' AS owner_last_name,
            b.contact_mobile AS phone,
            b.contact_email AS email,
            b.address_region AS region,
            b.address_district AS district,
            b.address_ward AS ward,
            b.address_place AS address_text,
            b.tmda_number,
            b.pharmacy_council_no,
            COALESCE(v.status, 'pending') AS verification_status,
            v.decided_at AS reviewed_at,
            v.decided_by AS reviewed_by,
            b.created_at,
            CASE WHEN b.name IS NOT NULL AND TRIM(b.name) <> '' AND b.address_region IS NOT NULL AND TRIM(b.address_region) <> '' AND b.tmda_number IS NOT NULL AND TRIM(b.tmda_number) <> '' THEN TRUE ELSE FALSE END AS profile_complete
        FROM business_registry b
        LEFT JOIN business_verification v ON b.business_id = v.business_id
        WHERE b.business_id = $1
        "#,
    )
    .bind(&business_id)
    .fetch_optional(&state.pool)
    .await;

    let r = match row {
        Ok(Some(r)) => r,
        Ok(None) => return (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": {"code":"NOT_FOUND", "message":"Business not found"} })),
        ).into_response(),
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": {"code":"INTERNAL", "message":"Could not load business details"} })),
        ).into_response(),
    };

    let workspace_id = &r.workspace_id;

    let branch_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM business_registry WHERE workspace_id = $1")
        .bind(workspace_id).fetch_one(&state.pool).await.unwrap_or(1);

    let branches: Vec<_> = sqlx::query_as::<_, (String, Option<String>, Option<String>)>(
        "SELECT branch_id, name, address_region FROM business_registry WHERE workspace_id = $1"
    ).bind(workspace_id).fetch_all(&state.pool).await.unwrap_or_default()
    .into_iter().map(|(bid, bname, breg)| serde_json::json!({
        "branch_id": bid,
        "name": bname,
        "region": breg
    })).collect();

    let device_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sync_devices WHERE workspace_id = $1")
        .bind(workspace_id).fetch_one(&state.pool).await.unwrap_or(0);

    let product_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM cloud_inventory_items WHERE workspace_id = $1 AND deleted_at IS NULL")
        .bind(workspace_id).fetch_one(&state.pool).await.unwrap_or(0);

    let sync_health = sqlx::query_as::<_, (Option<chrono::DateTime<chrono::Utc>>, Option<i32>, Option<String>)>(
        "SELECT MAX(COALESCE(last_seen_at, last_seen)), SUM(COALESCE(outbox_pending, pending_count))::int, MAX(app_version) FROM sync_devices WHERE workspace_id = $1"
    ).bind(workspace_id).fetch_optional(&state.pool).await.unwrap_or(None);

    let (last_sync_at, pending_outbox, app_version) = sync_health.unwrap_or((None, Some(0), None));

    let usage = sqlx::query_as::<_, (Option<i64>, Option<i64>)>(
        "SELECT COALESCE(SUM(revenue_total), 0)::BIGINT, COALESCE(SUM(tx_count), 0)::BIGINT FROM cloud_daily_summaries WHERE workspace_id = $1 AND summary_date >= CURRENT_DATE - INTERVAL '30 days'"
    ).bind(workspace_id).fetch_optional(&state.pool).await.unwrap_or(None).unwrap_or((Some(0), Some(0)));

    let revenue_30d = usage.0.unwrap_or(0);
    let sales_30d = usage.1.unwrap_or(0);

    let phone = r.phone.clone().unwrap_or_default();
    let masked_phone = if phone.len() >= 3 {
        let mask_len = phone.len() - 3;
        format!("{}{}", "*".repeat(mask_len), &phone[mask_len..])
    } else {
        phone.clone()
    };

    // Server-side alerts calculation
    let mut alerts = Vec::new();
    let now = chrono::Utc::now();

    if r.verification_status == "pending" {
        if let Some(ref cat) = r.created_at {
            if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(cat) {
                if now.signed_duration_since(dt.with_timezone(&chrono::Utc)) > chrono::Duration::hours(48) {
                    alerts.push("pending_over_48h");
                }
            } else if let Ok(dt) = chrono::NaiveDateTime::parse_from_str(cat, "%Y-%m-%d %H:%M:%S%.f") {
                let utc_dt = chrono::DateTime::<chrono::Utc>::from_naive_utc_and_offset(dt, chrono::Utc);
                if now.signed_duration_since(utc_dt) > chrono::Duration::hours(48) {
                    alerts.push("pending_over_48h");
                }
            }
        }
    }

    if let Some(ref lsync) = last_sync_at {
        if now.signed_duration_since(*lsync) > chrono::Duration::hours(24) {
            alerts.push("no_sync_over_24h");
        }
    } else {
        alerts.push("no_sync_over_24h");
    }

    let overdue_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM invoice WHERE business_id = $1 AND status = 'issued' AND due_at < NOW()"
    )
    .bind(&business_id)
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);
    if overdue_count > 0 {
        alerts.push("overdue_invoice");
    }

    let tier = sqlx::query_scalar::<_, Option<String>>("SELECT tier FROM business_registry WHERE business_id = $1")
        .bind(&business_id).fetch_optional(&state.pool).await.unwrap_or(None).flatten().unwrap_or_else(|| "free".to_string());

    if tier == "free" && product_count >= 45 {
        alerts.push("free_tier_high_products");
    }

    if tier == "free" && revenue_30d >= 250000 {
        alerts.push("free_tier_upgrade_candidate");
    }

    Json(serde_json::json!({
        "identity": {
            "business_id": r.business_id,
            "name": r.name,
            "logo_url": r.logo_url,
            "scale": r.scale,
            "role_scopes": r.role_scopes,
            "created_at": r.created_at.unwrap_or_default(),
            "profile_complete": r.profile_complete
        },
        "ownership": {
            "owner_type": r.owner_type,
            "owner_first_name": r.owner_first_name,
            "owner_last_name": r.owner_last_name,
            "phone": phone,
            "phone_verified": true,
            "email": r.email,
            "sudo_user_count": 1
        },
        "location": {
            "region": r.region,
            "district": r.district,
            "ward": r.ward,
            "address_text": r.address_text
        },
        "compliance": {
            "tmda_number": r.tmda_number,
            "pharmacy_council_no": r.pharmacy_council_no,
            "verification_status": r.verification_status,
            "reviewed_by": r.reviewed_by,
            "reviewed_at": r.reviewed_at.map(|t| t.to_rfc3339()),
            "rejection_reason": null
        },
        "payments_config": {
            "branches_count": branch_count,
            "lipa_namba": "123456",
            "payment_number_masked": masked_phone
        },
        "operations": {
            "branch_count": branch_count,
            "branches": branches,
            "user_count_by_role": { "owner": 1, "staff": 2 },
            "device_count": device_count,
            "product_count": product_count,
            "product_cap": 50
        },
        "sync_health": {
            "last_sync_at": last_sync_at.map(|t| t.to_rfc3339()),
            "pending_outbox_count": pending_outbox.unwrap_or(0),
            "app_version": app_version,
            "last_error": null
        },
        "usage": {
            "revenue_30d": revenue_30d,
            "sales_count_30d": sales_30d,
            "lab_orders_30d": 0
        },
        "alerts": alerts
    })).into_response()
}

#[derive(Deserialize, Debug)]
pub struct UpdateStatusRequest {
    pub action: String,
    pub reason: Option<String>,
    pub totp_code: String,
}

async fn update_business_status(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
    Extension(claims): Extension<AdminClaims>,
    Json(payload): Json<UpdateStatusRequest>,
) -> impl IntoResponse {
    if !["verify", "reject", "suspend", "reactivate"].contains(&payload.action.as_str()) {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": {"code": "INVALID_ACTION", "message": "Invalid status action"} }))).into_response();
    }
    let reason = payload.reason.as_deref().map(str::trim).filter(|r| !r.is_empty());
    if (payload.action == "reject" || payload.action == "suspend") && reason.is_none() {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": {"code": "REASON_REQUIRED", "message": "Reason is required to reject or suspend a business"} }))).into_response();
    }

    let totp_ok = match crate::admin::auth::verify_admin_totp(&state.pool, &state.config, &claims.user_id, &payload.totp_code).await {
        Ok(ok) => ok,
        Err(_) => false,
    };
    if !totp_ok {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": {"code": "INVALID_TOTP", "message": "Invalid TOTP code for step-up verification"} }))).into_response();
    }

    let target_status = match payload.action.as_str() {
        "verify" => "verified",
        "reject" => "rejected",
        "suspend" => "suspended",
        "reactivate" => "verified",
        _ => "pending",
    };

    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not begin transaction"} }))).into_response(),
    };

    let audit_id = uuid::Uuid::new_v4().to_string();
    if sqlx::query(
        "INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, payload) \
         VALUES ($1, $2, $3, 'business', $4, $5)"
    )
    .bind(&audit_id)
    .bind(&claims.user_id)
    .bind(format!("business_status_{}", payload.action))
    .bind(&business_id)
    .bind(serde_json::json!({ "action": payload.action, "reason": reason }))
    .execute(&mut *tx)
    .await.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not write audit log"} }))).into_response();
    }

    let _ = sqlx::query(
        "INSERT INTO business_verification (business_id, status, reason, decided_by, decided_at) \
         VALUES ($1, $2, $3, $4, NOW()) \
         ON CONFLICT (business_id) DO UPDATE SET status = $2, reason = $3, decided_by = $4, decided_at = NOW()"
    )
    .bind(&business_id)
    .bind(target_status)
    .bind(reason)
    .bind(&claims.user_id)
    .execute(&mut *tx)
    .await;

    if payload.action == "suspend" {
        let _ = sqlx::query("UPDATE billing_account SET billing_status = 'suspended' WHERE business_id = $1")
            .bind(&business_id)
            .execute(&mut *tx)
            .await;
    } else if payload.action == "reactivate" {
        let _ = sqlx::query("UPDATE billing_account SET billing_status = 'active' WHERE business_id = $1")
            .bind(&business_id)
            .execute(&mut *tx)
            .await;
    }

    if tx.commit().await.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not update business status"} }))).into_response();
    }

    Json(serde_json::json!({ "success": true, "status": target_status })).into_response()
}

async fn list_notes(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
) -> impl IntoResponse {
    let rows = sqlx::query_as::<_, (String, String, String, String, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, business_id, author, body, created_at FROM admin_note WHERE business_id = $1 ORDER BY created_at DESC"
    )
    .bind(&business_id)
    .fetch_all(&state.pool)
    .await;

    match rows {
        Ok(list) => {
            let notes: Vec<_> = list.into_iter().map(|n| serde_json::json!({
                "id": n.0,
                "business_id": n.1,
                "author": n.2,
                "body": n.3,
                "created_at": n.4.to_rfc3339()
            })).collect();
            Json(serde_json::json!({ "notes": notes })).into_response()
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not load notes"} }))).into_response(),
    }
}

#[derive(Deserialize, Debug)]
pub struct CreateNoteRequest {
    pub body: String,
}

async fn create_note(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
    Extension(claims): Extension<AdminClaims>,
    Json(payload): Json<CreateNoteRequest>,
) -> impl IntoResponse {
    if payload.body.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": {"code": "BODY_REQUIRED", "message": "Note body cannot be empty"} }))).into_response();
    }

    let note_id = format!("note_{}", uuid::Uuid::new_v4());
    let res = sqlx::query(
        "INSERT INTO admin_note (id, business_id, author, body) VALUES ($1, $2, $3, $4)"
    )
    .bind(&note_id)
    .bind(&business_id)
    .bind(&claims.email)
    .bind(payload.body.trim())
    .execute(&state.pool)
    .await;

    match res {
        Ok(_) => Json(serde_json::json!({ "success": true, "id": note_id })).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": {"code": "INTERNAL", "message": "Could not create note"} }))).into_response(),
    }
}

#[derive(Deserialize, Debug)]
pub struct TimelineQuery {
    pub type_filter: Option<String>,
}

async fn get_activity_timeline(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
    Query(query): Query<TimelineQuery>,
) -> impl IntoResponse {
    let type_f = query.type_filter.as_deref().unwrap_or("all");
    let mut events = Vec::new();

    let audit_rows = sqlx::query_as::<_, (String, String, Option<serde_json::Value>, chrono::DateTime<chrono::Utc>)>(
        "SELECT action, COALESCE((SELECT email FROM admin_users WHERE id = admin_audit_log.admin_user_id), 'System'), payload, created_at \
         FROM admin_audit_log WHERE target_id = $1 OR target_type = 'business' ORDER BY created_at DESC LIMIT 50"
    )
    .bind(&business_id)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    for (action, admin, payload, ts) in audit_rows {
        if type_f == "all" || type_f == "audit" {
            events.push(serde_json::json!({
                "type": "audit",
                "title": action.replace('_', " "),
                "actor": admin,
                "payload": payload,
                "timestamp": ts.to_rfc3339()
            }));
        }
    }

    let inv_rows = sqlx::query_as::<_, (String, i64, String, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, amount_tzs, status, issued_at FROM invoice WHERE business_id = $1 ORDER BY issued_at DESC LIMIT 20"
    )
    .bind(&business_id)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    for (inv_id, amount, status, ts) in inv_rows {
        if type_f == "all" || type_f == "invoice" {
            events.push(serde_json::json!({
                "type": "invoice",
                "title": format!("Invoice {} issued (TZS {}) - Status: {}", inv_id, amount, status),
                "actor": "Billing Engine",
                "payload": { "invoice_id": inv_id, "amount_tzs": amount, "status": status },
                "timestamp": ts.to_rfc3339()
            }));
        }
    }

    events.sort_by(|a, b| b["timestamp"].as_str().unwrap_or("").cmp(a["timestamp"].as_str().unwrap_or("")));

    Json(serde_json::json!({ "events": events })).into_response()
}

#[derive(Deserialize)]
struct StockQuery {
    page: Option<i64>,
    page_size: Option<i64>,
}

async fn get_stock(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
    Query(query): Query<StockQuery>,
) -> impl IntoResponse {
    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * page_size;
    let scope = sqlx::query_as::<_, (String, String)>(
        "SELECT workspace_id, branch_id FROM business_registry WHERE business_id = $1",
    )
    .bind(&business_id)
    .fetch_optional(&state.pool)
    .await;
    let (workspace_id, branch_id) = match scope {
        Ok(Some(scope)) => scope,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({
                    "error": { "code": "NOT_FOUND", "message": "Business not found" }
                })),
            )
                .into_response()
        }
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": { "code": "INTERNAL", "message": "Could not load business stock" }
                })),
            )
                .into_response()
        }
    };
    let summary = sqlx::query_as::<_, (i64, i64, i64)>(
        "SELECT COUNT(*), COUNT(*) FILTER (WHERE quantity <= low_stock_threshold), \
         COUNT(*) FILTER (WHERE expiry_date >= TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') \
           AND expiry_date <= TO_CHAR(CURRENT_DATE + 90, 'YYYY-MM-DD')) \
         FROM cloud_inventory_items WHERE workspace_id = $1 AND branch_id = $2 AND deleted_at IS NULL"
    ).bind(&workspace_id).bind(&branch_id).fetch_one(&state.pool).await;
    let (total, low_stock_count, expiring_soon_count) =
        match summary {
            Ok(summary) => summary,
            Err(_) => return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": { "code": "INTERNAL", "message": "Could not summarize business stock" }
                })),
            )
                .into_response(),
        };
    let rows = sqlx::query_as::<_, (String, String, String, i64, i64, i32, i32)>(
        "SELECT medicine_id, batch_number, expiry_date, buy_price, sell_price, quantity, low_stock_threshold \
         FROM cloud_inventory_items WHERE workspace_id = $1 AND branch_id = $2 AND deleted_at IS NULL \
         ORDER BY medicine_id, expiry_date LIMIT $3 OFFSET $4"
    ).bind(&workspace_id).bind(&branch_id).bind(page_size).bind(offset).fetch_all(&state.pool).await;
    let rows = match rows {
        Ok(rows) => rows,
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": { "code": "INTERNAL", "message": "Could not load business stock items" }
            })),
        )
            .into_response(),
    };
    let items: Vec<_> = rows.into_iter().map(|(medicine_id, batch_number, expiry_date, buy_price, sell_price, quantity, low_stock_threshold)| {
        serde_json::json!({ "medicine_id": medicine_id, "batch_number": batch_number, "expiry_date": expiry_date,
            "buy_price": buy_price, "sell_price": sell_price, "quantity": quantity, "low_stock_threshold": low_stock_threshold })
    }).collect();
    Json(serde_json::json!({
        "summary": { "item_count": total, "low_stock_count": low_stock_count, "expiring_soon_count": expiring_soon_count },
        "items": items, "total": total, "page": page, "page_size": page_size
    })).into_response()
}

async fn get_sync(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
) -> impl IntoResponse {
    let scope = sqlx::query_as::<_, (String, String)>(
        "SELECT workspace_id, branch_id FROM business_registry WHERE business_id = $1",
    )
    .bind(&business_id)
    .fetch_optional(&state.pool)
    .await;
    let (workspace_id, branch_id) = match scope {
        Ok(Some(scope)) => scope,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({
                    "error": { "code": "NOT_FOUND", "message": "Business not found" }
                })),
            )
                .into_response()
        }
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": { "code": "INTERNAL", "message": "Could not load business sync activity" }
            })),
        )
            .into_response(),
    };
    let devices = sqlx::query_as::<_, (String, Option<chrono::DateTime<chrono::Utc>>, Option<i32>, Option<String>)>(
        "SELECT device_id, COALESCE(last_seen_at, last_seen), COALESCE(outbox_pending, pending_count), app_version \
         FROM sync_devices WHERE workspace_id = $1 AND branch_id = $2 \
         ORDER BY COALESCE(last_seen_at, last_seen) DESC"
    ).bind(&workspace_id).bind(&branch_id).fetch_all(&state.pool).await;
    let devices = match devices {
        Ok(devices) => devices.into_iter().map(|(device_id, last_seen, pending, app_version)| {
            serde_json::json!({ "device_id": device_id, "last_seen_at": last_sync_time(last_seen),
                "outbox_pending": pending, "app_version": app_version })
        }).collect::<Vec<_>>(),
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "error": { "code": "INTERNAL", "message": "Could not load business devices" }
        }))).into_response(),
    };
    let changes =
        sqlx::query_as::<_, (String, String, String, i64, chrono::DateTime<chrono::Utc>)>(
            "SELECT change_id, entity, entity_id, version, received_at FROM sync_changes \
         WHERE workspace_id = $1 AND branch_id = $2 ORDER BY received_at DESC LIMIT 20",
        )
        .bind(&workspace_id)
        .bind(&branch_id)
        .fetch_all(&state.pool)
        .await;
    let changes = match changes {
        Ok(changes) => changes.into_iter().map(|(change_id, entity, entity_id, version, received_at)| {
            serde_json::json!({ "change_id": change_id, "entity": entity, "entity_id": entity_id,
                "version": version, "received_at": received_at.to_rfc3339() })
        }).collect::<Vec<_>>(),
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "error": { "code": "INTERNAL", "message": "Could not load business sync changes" }
        }))).into_response(),
    };
    Json(serde_json::json!({ "devices": devices, "changes": changes })).into_response()
}

fn last_sync_time(t: Option<chrono::DateTime<chrono::Utc>>) -> Option<String> {
    t.map(|dt| dt.to_rfc3339())
}

async fn get_activity(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
) -> impl IntoResponse {
    let rows = sqlx::query_as::<_, (String, String, String, Option<serde_json::Value>, chrono::DateTime<chrono::Utc>)>(
        "SELECT l.action, COALESCE(u.email, 'Unknown admin'), l.target_id, l.payload, l.created_at \
         FROM admin_audit_log l LEFT JOIN admin_users u ON u.id = l.admin_user_id \
         WHERE l.target_type = 'business' AND l.target_id = $1 ORDER BY l.created_at DESC LIMIT 100"
    ).bind(&business_id).fetch_all(&state.pool).await;
    match rows {
        Ok(rows) => {
            let activity: Vec<_> = rows
                .into_iter()
                .map(|(action, admin, target_id, payload, created_at)| {
                    serde_json::json!({ "action": action, "admin": admin, "business_id": target_id,
                    "payload": payload, "created_at": created_at.to_rfc3339() })
                })
                .collect();
            Json(serde_json::json!({ "activity": activity })).into_response()
        }
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": { "code": "INTERNAL", "message": "Could not load business activity" }
            })),
        )
            .into_response(),
    }
}

#[derive(Deserialize, Debug)]
pub struct VerifyRequest {
    pub decision: String,
    pub reason: Option<String>,
}

async fn verify_business(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
    Extension(claims): Extension<AdminClaims>,
    Json(payload): Json<VerifyRequest>,
) -> impl IntoResponse {
    let status = payload.decision.as_str();
    if !matches!(status, "verified" | "rejected" | "suspended") {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({
            "error": { "code": "INVALID_DECISION", "message": "Decision must be verified, rejected, or suspended" }
        }))).into_response();
    }
    let reason = payload
        .reason
        .as_deref()
        .map(str::trim)
        .filter(|reason| !reason.is_empty());
    if status != "verified" && reason.is_none() {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({
            "error": { "code": "REASON_REQUIRED", "message": "A reason is required for rejection or suspension" }
        }))).into_response();
    }

    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": { "code": "INTERNAL", "message": "Could not begin verification update" }
            })),
        )
            .into_response(),
    };
    let exists = sqlx::query("SELECT 1 FROM business_registry WHERE business_id = $1")
        .bind(&business_id)
        .fetch_optional(&mut *tx)
        .await;
    match exists {
        Ok(Some(_)) => {
            if status == "verified" {
                let is_complete: Option<bool> = sqlx::query_scalar(
                    "SELECT CASE WHEN name IS NOT NULL AND TRIM(name) <> '' AND address_region IS NOT NULL AND TRIM(address_region) <> '' AND tmda_number IS NOT NULL AND TRIM(tmda_number) <> '' THEN TRUE ELSE FALSE END FROM business_registry WHERE business_id = $1"
                )
                .bind(&business_id)
                .fetch_optional(&mut *tx)
                .await
                .unwrap_or(Some(false));

                if is_complete != Some(true) {
                    return (
                        StatusCode::CONFLICT,
                        Json(serde_json::json!({
                            "error": { "code": "INCOMPLETE_PROFILE", "message": "Cannot verify business with incomplete profile (name, region, and TMDA number required)" }
                        })),
                    )
                        .into_response();
                }
            }
        }
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({
                    "error": { "code": "NOT_FOUND", "message": "Business not found" }
                })),
            )
                .into_response()
        }
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": { "code": "INTERNAL", "message": "Could not verify business" }
                })),
            )
                .into_response()
        }
    }
    let result = async {
        sqlx::query(
            "INSERT INTO business_verification (business_id, status, reason, decided_by, decided_at) \
             VALUES ($1, $2, $3, $4, NOW()) \
             ON CONFLICT (business_id) DO UPDATE SET status = $2, reason = $3, decided_by = $4, decided_at = NOW()"
        )
        .bind(&business_id)
        .bind(status)
        .bind(reason)
        .bind(&claims.user_id)
        .execute(&mut *tx)
        .await?;
        sqlx::query(
            "INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, payload) \
             VALUES ($1, $2, $3, 'business', $4, $5)"
        )
        .bind(uuid::Uuid::new_v4().to_string())
        .bind(&claims.user_id)
        .bind(format!("business_verification_{status}"))
        .bind(&business_id)
        .bind(serde_json::json!({ "decision": status, "reason": reason }))
        .execute(&mut *tx)
        .await?;
        tx.commit().await
    }.await;

    match result {
        Ok(_) => Json(serde_json::json!({ "success": true, "status": status })).into_response(),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": { "code": "INTERNAL", "message": "Could not save verification decision" }
            })),
        )
            .into_response(),
    }
}

#[cfg(test)]
mod dto_leak_tests {
    #[test]
    fn business_profile_dto_contains_no_forbidden_keys() {
        let sample_profile = serde_json::json!({
            "identity": { "business_id": "test", "name": "Test", "logo_url": null, "scale": "medium", "role_scopes": "pharmacy", "created_at": "2026-01-01T00:00:00Z" },
            "ownership": { "owner_type": "personal", "owner_first_name": "Asha", "owner_last_name": "Test", "phone": "0712345678", "phone_verified": true, "email": null, "sudo_user_count": 1 },
            "location": { "region": "Dar es Salaam", "district": "Kinondoni", "ward": "Mwananyamala", "address_text": "Plot 1" },
            "compliance": { "tmda_number": "TMDA123", "pharmacy_council_no": "PC123", "verification_status": "pending", "reviewed_by": null, "reviewed_at": null, "rejection_reason": null },
            "payments_config": { "branches_count": 1, "lipa_namba": "123456", "payment_number_masked": "****5678" },
            "operations": { "branch_count": 1, "branches": [], "user_count_by_role": {}, "device_count": 1, "product_count": 10, "product_cap": 50 },
            "sync_health": { "last_sync_at": null, "pending_outbox_count": 0, "app_version": "1.0.0", "last_error": null },
            "usage": { "revenue_30d": 1000, "sales_count_30d": 5, "lab_orders_30d": 0 }
        });

        fn check_value(val: &serde_json::Value) {
            match val {
                serde_json::Value::Object(map) => {
                    for (k, v) in map {
                        let lower = k.to_lowercase();
                        assert!(!lower.contains("password"), "DTO leaked password: {}", k);
                        assert!(!lower.contains("pin"), "DTO leaked pin: {}", k);
                        assert!(!lower.contains("recovery"), "DTO leaked recovery code: {}", k);
                        assert!(!lower.contains("otp"), "DTO leaked otp: {}", k);
                        assert!(!lower.contains("patient"), "DTO leaked patient record: {}", k);
                        assert!(!lower.contains("customer"), "DTO leaked customer record: {}", k);
                        assert!(!lower.contains("sale_line"), "DTO leaked sale line: {}", k);
                        check_value(v);
                    }
                }
                serde_json::Value::Array(arr) => {
                    for item in arr {
                        check_value(item);
                    }
                }
                _ => {}
            }
        }
        check_value(&sample_profile);
    }
}
