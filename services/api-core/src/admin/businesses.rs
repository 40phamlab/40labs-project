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
        .route("/businesses/:business_id/activity", get(get_activity))
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
        "SELECT workspace_id, branch_id FROM business_registry WHERE business_id = $1"
    ).bind(&business_id).fetch_optional(&state.pool).await;
    let (workspace_id, branch_id) = match scope {
        Ok(Some(scope)) => scope,
        Ok(None) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({
            "error": { "code": "NOT_FOUND", "message": "Business not found" }
        }))).into_response(),
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "error": { "code": "INTERNAL", "message": "Could not load business stock" }
        }))).into_response(),
    };
    let summary = sqlx::query_as::<_, (i64, i64, i64)>(
        "SELECT COUNT(*), COUNT(*) FILTER (WHERE quantity <= low_stock_threshold), \
         COUNT(*) FILTER (WHERE expiry_date >= TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') \
           AND expiry_date <= TO_CHAR(CURRENT_DATE + 90, 'YYYY-MM-DD')) \
         FROM cloud_inventory_items WHERE workspace_id = $1 AND branch_id = $2 AND deleted_at IS NULL"
    ).bind(&workspace_id).bind(&branch_id).fetch_one(&state.pool).await;
    let (total, low_stock_count, expiring_soon_count) = match summary {
        Ok(summary) => summary,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "error": { "code": "INTERNAL", "message": "Could not summarize business stock" }
        }))).into_response(),
    };
    let rows = sqlx::query_as::<_, (String, String, String, i64, i64, i32, i32)>(
        "SELECT medicine_id, batch_number, expiry_date, buy_price, sell_price, quantity, low_stock_threshold \
         FROM cloud_inventory_items WHERE workspace_id = $1 AND branch_id = $2 AND deleted_at IS NULL \
         ORDER BY medicine_id, expiry_date LIMIT $3 OFFSET $4"
    ).bind(&workspace_id).bind(&branch_id).bind(page_size).bind(offset).fetch_all(&state.pool).await;
    let rows = match rows {
        Ok(rows) => rows,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "error": { "code": "INTERNAL", "message": "Could not load business stock items" }
        }))).into_response(),
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
        "SELECT workspace_id, branch_id FROM business_registry WHERE business_id = $1"
    ).bind(&business_id).fetch_optional(&state.pool).await;
    let (workspace_id, branch_id) = match scope {
        Ok(Some(scope)) => scope,
        Ok(None) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({
            "error": { "code": "NOT_FOUND", "message": "Business not found" }
        }))).into_response(),
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "error": { "code": "INTERNAL", "message": "Could not load business sync activity" }
        }))).into_response(),
    };
    let devices = sqlx::query_as::<_, (String, Option<chrono::DateTime<chrono::Utc>>, Option<i32>, Option<String>)>(
        "SELECT device_id, COALESCE(last_seen_at, last_seen), COALESCE(outbox_pending, pending_count), app_version \
         FROM sync_devices WHERE workspace_id = $1 AND branch_id = $2 \
         ORDER BY COALESCE(last_seen_at, last_seen) DESC"
    ).bind(&workspace_id).bind(&branch_id).fetch_all(&state.pool).await;
    let devices = match devices {
        Ok(devices) => devices.into_iter().map(|(device_id, last_seen, pending, app_version)| {
            serde_json::json!({ "device_id": device_id, "last_seen_at": last_seen.map(|t| t.to_rfc3339()),
                "outbox_pending": pending.unwrap_or(0), "app_version": app_version })
        }).collect::<Vec<_>>(),
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "error": { "code": "INTERNAL", "message": "Could not load business devices" }
        }))).into_response(),
    };
    let changes = sqlx::query_as::<_, (String, String, String, i64, chrono::DateTime<chrono::Utc>)>(
        "SELECT change_id, entity, entity_id, version, received_at FROM sync_changes \
         WHERE workspace_id = $1 AND branch_id = $2 ORDER BY received_at DESC LIMIT 20"
    ).bind(&workspace_id).bind(&branch_id).fetch_all(&state.pool).await;
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
            let activity: Vec<_> = rows.into_iter().map(|(action, admin, target_id, payload, created_at)| {
                serde_json::json!({ "action": action, "admin": admin, "business_id": target_id,
                    "payload": payload, "created_at": created_at.to_rfc3339() })
            }).collect();
            Json(serde_json::json!({ "activity": activity })).into_response()
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "error": { "code": "INTERNAL", "message": "Could not load business activity" }
        }))).into_response(),
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
    let reason = payload.reason.as_deref().map(str::trim).filter(|reason| !reason.is_empty());
    if status != "verified" && reason.is_none() {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({
            "error": { "code": "REASON_REQUIRED", "message": "A reason is required for rejection or suspension" }
        }))).into_response();
    }

    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "error": { "code": "INTERNAL", "message": "Could not begin verification update" }
        }))).into_response(),
    };
    let exists = sqlx::query("SELECT 1 FROM business_registry WHERE business_id = $1")
        .bind(&business_id)
        .fetch_optional(&mut *tx)
        .await;
    match exists {
        Ok(Some(_)) => {}
        Ok(None) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({
            "error": { "code": "NOT_FOUND", "message": "Business not found" }
        }))).into_response(),
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "error": { "code": "INTERNAL", "message": "Could not verify business" }
        }))).into_response(),
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
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "error": { "code": "INTERNAL", "message": "Could not save verification decision" }
        }))).into_response(),
    }
}
