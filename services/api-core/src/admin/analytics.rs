use axum::{
    routing::get,
    Router,
    http::StatusCode,
    response::IntoResponse,
    Json,
    extract::State,
};
use crate::routes::activation::AppState;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/overview", get(overview_handler))
        .route("/analytics/revenue", get(revenue_handler))
        .route("/analytics/products", get(products_handler))
        .route("/analytics/growth", get(growth_handler))
        .with_state(state)
}

async fn overview_handler(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let registered_businesses: i64 = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM business_registry")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let verified_count: i64 = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM business_verification WHERE status = 'verified'")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let pending_count: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM business_registry b LEFT JOIN business_verification v ON b.business_id = v.business_id WHERE v.status IS NULL OR v.status = 'pending'"
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    let verified_percentage = if registered_businesses > 0 {
        (verified_count as f64 / registered_businesses as f64) * 100.0
    } else {
        0.0
    };

    let active_businesses: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(DISTINCT business_id) FROM business_registry WHERE updated_at >= NOW() - INTERVAL '24 hours' OR created_at >= NOW() - INTERVAL '24 hours'"
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    let platform_sales_today: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(SUM(revenue_total), 0) FROM cloud_daily_summaries WHERE summary_date = CURRENT_DATE"
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    let open_infra_alerts: i64 = 0;

    let signups_rows = sqlx::query_as::<_, (String, i64)>(
        "SELECT TO_CHAR(created_at::timestamptz, 'YYYY-MM-DD') AS dt, COUNT(*) FROM business_registry WHERE created_at::timestamptz >= NOW() - INTERVAL '30 days' GROUP BY dt ORDER BY dt ASC"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let sales_rows = sqlx::query_as::<_, (String, i64)>(
        "SELECT TO_CHAR(summary_date, 'YYYY-MM-DD') AS dt, COALESCE(SUM(revenue_total), 0) FROM cloud_daily_summaries WHERE summary_date >= CURRENT_DATE - INTERVAL '30 days' GROUP BY dt ORDER BY dt ASC"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let pending_verifications = sqlx::query_as::<_, (String, String, String)>(
        "SELECT b.business_id, COALESCE(b.name, 'Unnamed'), COALESCE(b.created_at, NOW()::text) \
         FROM business_registry b \
         LEFT JOIN business_verification v ON b.business_id = v.business_id \
         WHERE v.status IS NULL OR v.status = 'pending' \
         ORDER BY b.created_at ASC \
         LIMIT 5"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let mut needs_attention = Vec::new();
    for (bid, name, created) in pending_verifications {
        needs_attention.push(serde_json::json!({
            "type": "pending_verification",
            "id": bid,
            "name": name,
            "description": "Pending verification review",
            "time": created,
            "link": format!("/businesses/{}", bid)
        }));
    }

    Json(serde_json::json!({
        "kpis": {
            "registered_businesses": registered_businesses,
            "verified_percentage": verified_percentage,
            "pending_count": pending_count,
            "active_businesses": active_businesses,
            "platform_sales_today": platform_sales_today,
            "open_infra_alerts": open_infra_alerts
        },
        "signups_per_day": signups_rows.into_iter().map(|(dt, c)| serde_json::json!({ "date": dt, "count": c })).collect::<Vec<_>>(),
        "platform_daily_sales": sales_rows.into_iter().map(|(dt, s)| serde_json::json!({ "date": dt, "revenue": s })).collect::<Vec<_>>(),
        "needs_attention": needs_attention
    })).into_response()
}

async fn revenue_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn products_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}

async fn growth_handler() -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ "error": "NOT_IMPLEMENTED" })))
}
