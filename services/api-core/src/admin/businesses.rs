use axum::{
    routing::{get, post},
    Router,
    http::StatusCode,
    response::IntoResponse,
    Json,
    extract::{State, Query, Path},
};
use serde::{Deserialize, Serialize};
use crate::routes::activation::AppState;
use crate::admin::AdminClaims;
use axum::Extension;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/businesses", get(list_businesses))
        .route("/businesses/:business_id", get(get_business))
        .route("/businesses/:business_id/stock", get(get_stock))
        .route("/businesses/:business_id/sync", get(get_sync))
        .route("/businesses/:business_id/verification", post(verify_business))
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
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Serialize, Debug)]
pub struct BusinessListItem {
    pub business_id: String,
    pub name: String,
    pub region: Option<String>,
    pub tmda_number: Option<String>,
    pub tier: String,
    pub verification_status: String,
    pub last_sync: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Debug)]
pub struct ListResponse {
    pub items: Vec<BusinessListItem>,
    pub total: i64,
    pub page: i64,
    pub limit: i64,
    pub total_pages: i64,
}

async fn list_businesses(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> impl IntoResponse {
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(25).max(1).min(100);
    let offset = (page - 1) * limit;

    let status_filter = query.status.as_deref().unwrap_or("all");
    let search_q = query.q.as_deref().unwrap_or("").trim();
    let region_filter = query.region.as_deref();
    let tier_filter = query.tier.as_deref();
    let sort_col = query.sort.as_deref().unwrap_or("created_at");
    let sort_dir = query.direction.as_deref().unwrap_or("desc").to_uppercase();
    let sort_dir = if sort_dir != "ASC" && sort_dir != "DESC" { "DESC".to_string() } else { sort_dir };

    let mut qb = sqlx::QueryBuilder::new(
        r#"
        SELECT
            b.business_id,
            COALESCE(b.name, 'Unnamed Business') AS name,
            b.address_region AS region,
            b.tmda_number,
            COALESCE(b.tier, 'free') AS tier,
            COALESCE(v.status, 'pending') AS verification_status,
            COALESCE(b.updated_at, b.created_at::timestamptz, NOW()) AS last_sync,
            COALESCE(b.created_at, NOW()::text) AS created_at
        FROM business_registry b
        LEFT JOIN business_verification v ON b.business_id = v.business_id
        WHERE 1=1
        "#
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

    let total: i64 = match count_qb.build_query_scalar().fetch_one(&state.pool).await {
        Ok(t) => t,
        Err(_) => 0,
    };

    let safe_sort = match sort_col {
        "name" => "b.name",
        "business_id" => "b.business_id",
        "region" => "b.address_region",
        "tier" => "b.tier",
        "created_at" => "b.created_at",
        "last_sync" => "last_sync",
        _ => "b.created_at",
    };
    qb.push(format!(" ORDER BY {} {}", safe_sort, sort_dir));
    qb.push(" LIMIT ");
    qb.push_bind(limit);
    qb.push(" OFFSET ");
    qb.push_bind(offset);

    let rows = match qb.build_query_as::<(String, String, Option<String>, Option<String>, String, String, chrono::DateTime<chrono::Utc>, String)>().fetch_all(&state.pool).await {
        Ok(r) => r,
        Err(_) => Vec::new(),
    };

    let items: Vec<BusinessListItem> = rows.into_iter().map(|row| {
        BusinessListItem {
            business_id: row.0,
            name: row.1,
            region: row.2,
            tmda_number: row.3,
            tier: row.4,
            verification_status: row.5,
            last_sync: Some(row.6.to_rfc3339()),
            created_at: row.7,
        }
    }).collect();

    let total_pages = if limit > 0 { (total + limit - 1) / limit } else { 1 };

    Json(ListResponse {
        items,
        total,
        page,
        limit,
        total_pages,
    }).into_response()
}

async fn get_business(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
) -> impl IntoResponse {
    let row = sqlx::query_as::<_, (String, String, Option<String>, Option<String>, String, String, Option<String>, String)>(
        r#"
        SELECT
            b.business_id,
            COALESCE(b.name, 'Unnamed Business'),
            b.address_region,
            b.tmda_number,
            COALESCE(b.tier, 'free'),
            COALESCE(v.status, 'pending'),
            v.reason,
            COALESCE(b.created_at, NOW()::text)
        FROM business_registry b
        LEFT JOIN business_verification v ON b.business_id = v.business_id
        WHERE b.business_id = $1
        "#
    )
    .bind(&business_id)
    .fetch_optional(&state.pool)
    .await;

    match row {
        Ok(Some(r)) => Json(serde_json::json!({
            "business_id": r.0,
            "name": r.1,
            "region": r.2,
            "tmda_number": r.3,
            "tier": r.4,
            "verification_status": r.5,
            "rejection_reason": r.6,
            "created_at": r.7,
        })).into_response(),
        _ => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Business not found" }))).into_response(),
    }
}

async fn get_stock(
    State(_state): State<AppState>,
    Path(_business_id): Path<String>,
) -> impl IntoResponse {
    Json(serde_json::json!({ "items": [], "total": 0 })).into_response()
}

async fn get_sync(
    State(_state): State<AppState>,
    Path(_business_id): Path<String>,
) -> impl IntoResponse {
    Json(serde_json::json!({ "devices": [], "changes": [] })).into_response()
}

#[derive(Deserialize, Debug)]
pub struct VerifyRequest {
    pub reason: Option<String>,
}

async fn verify_business(
    State(state): State<AppState>,
    Path(business_id): Path<String>,
    Extension(claims): Extension<AdminClaims>,
    Json(payload): Json<VerifyRequest>,
) -> impl IntoResponse {
    let status = if payload.reason.is_some() { "rejected" } else { "verified" };

    let res = sqlx::query(
        r#"
        INSERT INTO business_verification (business_id, status, reason, decided_by, decided_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (business_id) DO UPDATE
        SET status = $2, reason = $3, decided_by = $4, decided_at = NOW()
        "#
    )
    .bind(&business_id)
    .bind(status)
    .bind(&payload.reason)
    .bind(&claims.email)
    .execute(&state.pool)
    .await;

    match res {
        Ok(_) => Json(serde_json::json!({ "success": true, "status": status })).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}
