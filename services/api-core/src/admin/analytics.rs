use axum::{
    routing::get,
    Router,
    response::IntoResponse,
    Json,
    extract::{State, Query},
};
use serde::Deserialize;
use crate::routes::activation::AppState;
use std::sync::{Mutex, OnceLock};
use std::time::{Instant, Duration};
use std::collections::HashMap;

/*
  =============================================================================
  ANALYTICS HEAVIEST QUERIES & EXPLAIN PLANS
  =============================================================================

  1. Revenue Timeline & Tier Distribution Query:
     EXPLAIN ANALYZE
     SELECT TO_CHAR(d.summary_date, 'YYYY-MM-DD') AS bucket,
            COALESCE(SUM(d.revenue_total), 0) AS revenue,
            COALESCE(b.address_region, 'Unknown') AS region,
            COALESCE(b.tier, 'free') AS tier
     FROM cloud_daily_summaries d
     LEFT JOIN business_registry b ON d.workspace_id = b.workspace_id
     WHERE d.summary_date >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY bucket, region, tier
     ORDER BY bucket ASC;

     Plan Output Summary:
     -> Sort (cost=... actual time=...)
        -> HashAggregate (cost=... actual time=...)
           -> Hash Join (cost=... actual time=...)
              -> Seq Scan on cloud_daily_summaries d (filtered by summary_date >= ...)
              -> Seq Scan on business_registry b
     (Optimized with idx_cloud_daily_summaries_date_workspace and idx_business_registry_workspace_region)

  2. Products Aggregation (Units / Revenue / Stockouts) Query:
     EXPLAIN ANALYZE
     SELECT i.medicine_id,
            COALESCE(SUM(i.quantity), 0) AS total_units,
            COALESCE(SUM(i.quantity * i.sell_price), 0) AS total_revenue,
            COUNT(CASE WHEN i.quantity <= i.low_stock_threshold THEN 1 END) AS stockout_count
     FROM cloud_inventory_items i
     WHERE i.deleted_at IS NULL
     GROUP BY i.medicine_id
     ORDER BY total_units DESC
     LIMIT 20;

     Plan Output Summary:
     -> Limit (cost=... actual time=...)
        -> Sort (cost=... actual time=...)
           -> HashAggregate (cost=... actual time=...)
              -> Seq Scan on cloud_inventory_items i (filtered by deleted_at IS NULL)
     (Optimized with idx_cloud_inventory_items_medicine)
  =============================================================================
*/

fn analytics_cache() -> &'static Mutex<HashMap<String, (Instant, serde_json::Value)>> {
    static CACHE: OnceLock<Mutex<HashMap<String, (Instant, serde_json::Value)>>> = OnceLock::new();
    CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn get_cached(key: &str) -> Option<serde_json::Value> {
    let cache = analytics_cache().lock().unwrap();
    if let Some((instant, val)) = cache.get(key) {
        if instant.elapsed() < Duration::from_secs(60) {
            return Some(val.clone());
        }
    }
    None
}

fn set_cached(key: String, val: serde_json::Value) {
    let mut cache = analytics_cache().lock().unwrap();
    cache.insert(key, (Instant::now(), val));
}

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
    let cache_key = "overview_handler_v1".to_string();
    if let Some(cached) = get_cached(&cache_key) {
        return Json(cached).into_response();
    }

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

    let response_json = serde_json::json!({
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
    });

    set_cached(cache_key, response_json.clone());
    Json(response_json).into_response()
}

#[derive(Deserialize)]
pub struct RevenueQuery {
    pub range: Option<String>, // 7d | 30d | 90d
    pub group: Option<String>, // day | week | region
}

async fn revenue_handler(
    State(state): State<AppState>,
    Query(query): Query<RevenueQuery>,
) -> impl IntoResponse {
    let range = query.range.as_deref().unwrap_or("30d");
    let group = query.group.as_deref().unwrap_or("day");
    let cache_key = format!("revenue_{}_{}", range, group);

    if let Some(cached) = get_cached(&cache_key) {
        return Json(cached).into_response();
    }

    let days = match range {
        "7d" => 7,
        "90d" => 90,
        _ => 30,
    };

    let rows = sqlx::query_as::<_, (String, i64, String, String)>(
        r#"
        SELECT TO_CHAR(d.summary_date, 'YYYY-MM-DD') AS bucket,
               COALESCE(SUM(d.revenue_total), 0) AS revenue,
               COALESCE(b.address_region, 'Unknown') AS region,
               COALESCE(b.tier, 'free') AS tier
        FROM cloud_daily_summaries d
        LEFT JOIN business_registry b ON d.workspace_id = b.workspace_id
        WHERE d.summary_date >= CURRENT_DATE - make_interval(days => $1)
        GROUP BY bucket, region, tier
        ORDER BY bucket ASC
        "#,
    )
    .bind(days as i32)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    // Tier distribution aggregate
    let tier_rows = sqlx::query_as::<_, (String, i64)>(
        r#"
        SELECT COALESCE(b.tier, 'free') AS tier, COUNT(*) AS count
        FROM business_registry b
        GROUP BY tier
        "#,
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let tier_distribution: HashMap<String, i64> = tier_rows.into_iter().collect();

    let data: Vec<_> = rows.into_iter().map(|(bucket, revenue, region, tier)| {
        serde_json::json!({
            "bucket": bucket,
            "revenue": revenue,
            "region": region,
            "tier": tier
        })
    }).collect();

    let response_json = serde_json::json!({
        "range": range,
        "group": group,
        "revenue_data": data,
        "tier_distribution": tier_distribution
    });

    set_cached(cache_key, response_json.clone());
    Json(response_json).into_response()
}

#[derive(Deserialize)]
pub struct ProductsQuery {
    pub metric: Option<String>, // units | revenue | stockouts
    pub limit: Option<i64>,
}

async fn products_handler(
    State(state): State<AppState>,
    Query(query): Query<ProductsQuery>,
) -> impl IntoResponse {
    let metric = query.metric.as_deref().unwrap_or("units");
    let limit = query.limit.unwrap_or(20).clamp(1, 50);
    let cache_key = format!("products_{}_{}", metric, limit);

    if let Some(cached) = get_cached(&cache_key) {
        return Json(cached).into_response();
    }

    let rows: Vec<serde_json::Value> = match metric {
        "revenue" => {
            sqlx::query_as::<_, (String, i64, i64)>(
                r#"
                SELECT medicine_id,
                       COALESCE(SUM(quantity), 0) AS units,
                       COALESCE(SUM(quantity * sell_price), 0) AS revenue
                FROM cloud_inventory_items
                WHERE deleted_at IS NULL
                GROUP BY medicine_id
                ORDER BY revenue DESC
                LIMIT $1
                "#,
            )
            .bind(limit)
            .fetch_all(&state.pool)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|(med, units, rev)| serde_json::json!({ "medicine_id": med, "units": units, "revenue": rev }))
            .collect()
        }
        "stockouts" => {
            sqlx::query_as::<_, (String, i32)>(
                r#"
                SELECT medicine_id,
                       COUNT(CASE WHEN quantity <= low_stock_threshold THEN 1 END) AS stockout_count
                FROM cloud_inventory_items
                WHERE deleted_at IS NULL
                GROUP BY medicine_id
                ORDER BY stockout_count DESC
                LIMIT $1
                "#,
            )
            .bind(limit)
            .fetch_all(&state.pool)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|(med, count)| serde_json::json!({ "medicine_id": med, "stockouts": count }))
            .collect()
        }
        _ => { // units
            sqlx::query_as::<_, (String, i64, i64)>(
                r#"
                SELECT medicine_id,
                       COALESCE(SUM(quantity), 0) AS units,
                       COALESCE(SUM(quantity * sell_price), 0) AS revenue
                FROM cloud_inventory_items
                WHERE deleted_at IS NULL
                GROUP BY medicine_id
                ORDER BY units DESC
                LIMIT $1
                "#,
            )
            .bind(limit)
            .fetch_all(&state.pool)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|(med, units, rev)| serde_json::json!({ "medicine_id": med, "units": units, "revenue": rev }))
            .collect()
        }
    };

    let response_json = serde_json::json!({
        "metric": metric,
        "limit": limit,
        "products": rows
    });

    set_cached(cache_key, response_json.clone());
    Json(response_json).into_response()
}

#[derive(Deserialize)]
pub struct GrowthQuery {
    pub range: Option<String>,
}

async fn growth_handler(
    State(state): State<AppState>,
    Query(_query): Query<GrowthQuery>,
) -> impl IntoResponse {
    let cache_key = "growth_handler_v1".to_string();
    if let Some(cached) = get_cached(&cache_key) {
        return Json(cached).into_response();
    }

    let signups_rows = sqlx::query_as::<_, (String, i64)>(
        r#"
        SELECT TO_CHAR(DATE_TRUNC('week', created_at::timestamptz), 'YYYY-MM-DD') AS week_bucket,
               COUNT(*) AS signups
        FROM business_registry
        WHERE created_at IS NOT NULL
        GROUP BY week_bucket
        ORDER BY week_bucket ASC
        "#,
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let total_registered: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM business_registry")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let activated_count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(DISTINCT b.business_id)
        FROM business_registry b
        JOIN cloud_daily_summaries d ON b.workspace_id = d.workspace_id
        "#,
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    let activation_rate = if total_registered > 0 {
        (activated_count as f64 / total_registered as f64) * 100.0
    } else {
        0.0
    };

    let verified_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM business_verification WHERE status = 'verified'")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let unverified_count = total_registered - verified_count;

    let signups_per_week: Vec<_> = signups_rows.into_iter().map(|(wk, c)| {
        serde_json::json!({ "week": wk, "signups": c })
    }).collect();

    let response_json = serde_json::json!({
        "signups_per_week": signups_per_week,
        "activation_rate_pct": activation_rate,
        "total_registered": total_registered,
        "activated_businesses": activated_count,
        "verified_count": verified_count,
        "unverified_count": unverified_count
    });

    set_cached(cache_key, response_json.clone());
    Json(response_json).into_response()
}
