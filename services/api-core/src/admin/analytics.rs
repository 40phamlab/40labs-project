use crate::routes::activation::AppState;
use axum::{extract::{Query, State}, http::StatusCode, response::{IntoResponse, Response}, routing::get, Json, Router};
use serde::Deserialize;

fn db_error(message: &'static str) -> Response {
    (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":{"code":"INTERNAL","message":message}}))).into_response()
}

fn validation_error(message: &'static str) -> Response {
    (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":{"code":"VALIDATION","message":message}}))).into_response()
}

macro_rules! db_or_return {
    ($query:expr, $message:literal) => {
        match $query.await { Ok(value) => value, Err(_) => return db_error($message) }
    };
}

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/overview", get(overview_handler))
        .route("/analytics/revenue", get(revenue_handler))
        .route("/analytics/products", get(products_handler))
        .route("/analytics/growth", get(growth_handler))
        .with_state(state)
}

async fn overview_handler(State(state): State<AppState>) -> Response {
    let registered: i64 = db_or_return!(sqlx::query_scalar("SELECT COUNT(*) FROM business_registry").fetch_one(&state.pool), "Could not load business totals");
    let verified: i64 = db_or_return!(sqlx::query_scalar("SELECT COUNT(*) FROM business_verification WHERE status = 'verified'").fetch_one(&state.pool), "Could not load verification totals");
    let pending: i64 = db_or_return!(sqlx::query_scalar("SELECT COUNT(*) FROM business_registry b LEFT JOIN business_verification v ON b.business_id = v.business_id WHERE v.status IS NULL OR v.status = 'pending'").fetch_one(&state.pool), "Could not load pending verifications");
    let active: i64 = db_or_return!(sqlx::query_scalar("SELECT COUNT(DISTINCT b.business_id) FROM sync_changes c JOIN business_registry b ON b.workspace_id = c.workspace_id AND b.branch_id = c.branch_id WHERE c.received_at >= NOW() - INTERVAL '24 hours'").fetch_one(&state.pool), "Could not load active business totals");
    let sales: i64 = db_or_return!(sqlx::query_scalar("SELECT COALESCE(SUM(revenue_total), 0) FROM cloud_daily_summaries WHERE summary_date = CURRENT_DATE").fetch_one(&state.pool), "Could not load today's platform sales");
    let alerts: i64 = db_or_return!(sqlx::query_scalar("SELECT COUNT(*) FROM (SELECT DISTINCT ON (check_name) status FROM infra_health_checks ORDER BY check_name, checked_at DESC) latest WHERE status IN ('degraded','down')").fetch_one(&state.pool), "Could not load infrastructure alerts");
    let signups: Vec<(String, i64)> = db_or_return!(sqlx::query_as("SELECT TO_CHAR(created_at::timestamptz, 'YYYY-MM-DD'), COUNT(*) FROM business_registry WHERE created_at::timestamptz >= NOW() - INTERVAL '30 days' GROUP BY 1 ORDER BY 1").fetch_all(&state.pool), "Could not load signup history");
    let daily_sales: Vec<(String, i64)> = db_or_return!(sqlx::query_as("SELECT TO_CHAR(summary_date, 'YYYY-MM-DD'), COALESCE(SUM(revenue_total),0) FROM cloud_daily_summaries WHERE summary_date >= CURRENT_DATE - INTERVAL '30 days' GROUP BY 1 ORDER BY 1").fetch_all(&state.pool), "Could not load sales history");
    let attention: Vec<(String, String, String)> = db_or_return!(sqlx::query_as("SELECT b.business_id, COALESCE(b.name, 'Unnamed Business'), COALESCE(b.created_at, NOW()::text) FROM business_registry b LEFT JOIN business_verification v ON b.business_id = v.business_id WHERE v.status IS NULL OR v.status = 'pending' ORDER BY b.created_at ASC LIMIT 5").fetch_all(&state.pool), "Could not load pending business reviews");
    let needs_attention: Vec<_> = attention.into_iter().map(|(id, name, time)| serde_json::json!({"type":"pending_verification","id":id,"name":name,"description":"Pending verification review","time":time,"link":format!("/businesses/{id}")})).collect();
    Json(serde_json::json!({
        "kpis": {"registered_businesses": registered, "verified_percentage": if registered == 0 { 0.0 } else { verified as f64 * 100.0 / registered as f64 }, "pending_count": pending, "active_businesses": active, "platform_sales_today": sales, "open_infra_alerts": alerts},
        "signups_per_day": signups.into_iter().map(|(date,count)| serde_json::json!({"date":date,"count":count})).collect::<Vec<_>>(),
        "platform_daily_sales": daily_sales.into_iter().map(|(date,revenue)| serde_json::json!({"date":date,"revenue":revenue})).collect::<Vec<_>>(),
        "needs_attention": needs_attention
    })).into_response()
}

#[derive(Deserialize)]
pub struct RevenueQuery { pub range: Option<String>, pub group: Option<String> }

async fn revenue_handler(State(state): State<AppState>, Query(query): Query<RevenueQuery>) -> Response {
    let range = query.range.as_deref().unwrap_or("30d");
    let group = query.group.as_deref().unwrap_or("day");
    let days = match range { "7d" => 7, "30d" => 30, "90d" => 90, _ => return validation_error("range must be 7d, 30d, or 90d") };
    if !["day", "week", "region"].contains(&group) { return validation_error("group must be day, week, or region"); }
    let rows: Vec<(String, i64, String, String)> = db_or_return!(sqlx::query_as(
        "SELECT CASE WHEN $2 = 'region' THEN COALESCE(b.address_region, 'Unknown') WHEN $2 = 'week' THEN TO_CHAR(DATE_TRUNC('week', d.summary_date::timestamp), 'YYYY-MM-DD') ELSE TO_CHAR(d.summary_date, 'YYYY-MM-DD') END, COALESCE(SUM(d.revenue_total),0), COALESCE(b.address_region,'Unknown'), COALESCE(b.tier,'free') FROM cloud_daily_summaries d LEFT JOIN business_registry b ON b.workspace_id = d.workspace_id AND b.branch_id = d.branch_id WHERE d.summary_date >= CURRENT_DATE - make_interval(days => $1) GROUP BY 1,3,4 ORDER BY 1"
    ).bind(days).bind(group).fetch_all(&state.pool), "Could not calculate platform revenue");
    let tiers: Vec<(String, i64)> = db_or_return!(sqlx::query_as("SELECT COALESCE(tier,'free'), COUNT(*) FROM business_registry GROUP BY 1 ORDER BY 1").fetch_all(&state.pool), "Could not calculate tier distribution");
    let revenue_data: Vec<_> = rows.into_iter().map(|(bucket,revenue,region,tier)| serde_json::json!({"bucket":bucket,"revenue":revenue,"region":region,"tier":tier})).collect();
    let tier_distribution: std::collections::HashMap<_,_> = tiers.into_iter().collect();
    Json(serde_json::json!({"range":range,"group":group,"revenue_data":revenue_data,"tier_distribution":tier_distribution})).into_response()
}

#[derive(Deserialize)]
pub struct ProductsQuery { pub metric: Option<String>, pub limit: Option<i64> }

async fn products_handler(State(state): State<AppState>, Query(query): Query<ProductsQuery>) -> Response {
    let metric = query.metric.as_deref().unwrap_or("units");
    if !["units", "revenue", "stockouts"].contains(&metric) { return validation_error("metric must be units, revenue, or stockouts"); }
    let limit = query.limit.unwrap_or(20);
    if !(1..=50).contains(&limit) { return validation_error("limit must be between 1 and 50"); }
    let rows: Vec<serde_json::Value> = match metric {
        "stockouts" => {
            let rows: Vec<(String,i64)> = db_or_return!(sqlx::query_as("SELECT medicine_id, COUNT(*) FILTER (WHERE quantity <= low_stock_threshold) FROM cloud_inventory_items WHERE deleted_at IS NULL GROUP BY medicine_id ORDER BY 2 DESC, medicine_id LIMIT $1").bind(limit).fetch_all(&state.pool), "Could not calculate product stockouts");
            rows.into_iter().map(|(medicine_id,stockouts)| serde_json::json!({"medicine_id":medicine_id,"stockouts":stockouts})).collect()
        }
        "revenue" => {
            let rows: Vec<(String,i64,i64)> = db_or_return!(sqlx::query_as("SELECT medicine_id, COALESCE(SUM(quantity),0), COALESCE(SUM(quantity * sell_price),0) FROM cloud_inventory_items WHERE deleted_at IS NULL GROUP BY medicine_id ORDER BY 3 DESC, medicine_id LIMIT $1").bind(limit).fetch_all(&state.pool), "Could not calculate product inventory value");
            rows.into_iter().map(|(medicine_id,units,revenue)| serde_json::json!({"medicine_id":medicine_id,"units":units,"revenue":revenue})).collect()
        }
        _ => {
            let rows: Vec<(String,i64,i64)> = db_or_return!(sqlx::query_as("SELECT medicine_id, COALESCE(SUM(quantity),0), COALESCE(SUM(quantity * sell_price),0) FROM cloud_inventory_items WHERE deleted_at IS NULL GROUP BY medicine_id ORDER BY 2 DESC, medicine_id LIMIT $1").bind(limit).fetch_all(&state.pool), "Could not calculate product stock");
            rows.into_iter().map(|(medicine_id,units,revenue)| serde_json::json!({"medicine_id":medicine_id,"units":units,"revenue":revenue})).collect()
        }
    };
    Json(serde_json::json!({"metric":metric,"limit":limit,"products":rows})).into_response()
}

#[derive(Deserialize)]
pub struct GrowthQuery { pub range: Option<String> }

async fn growth_handler(State(state): State<AppState>, Query(query): Query<GrowthQuery>) -> Response {
    let range = query.range.as_deref().unwrap_or("90d");
    let days = match range { "7d" => 7, "30d" => 30, "90d" => 90, _ => return validation_error("range must be 7d, 30d, or 90d") };
    let signups: Vec<(String,i64)> = db_or_return!(sqlx::query_as("SELECT TO_CHAR(DATE_TRUNC('week', created_at::timestamptz), 'YYYY-MM-DD'), COUNT(*) FROM business_registry WHERE created_at::timestamptz >= NOW() - make_interval(days => $1) GROUP BY 1 ORDER BY 1").bind(days).fetch_all(&state.pool), "Could not load business signup history");
    let total: i64 = db_or_return!(sqlx::query_scalar("SELECT COUNT(*) FROM business_registry").fetch_one(&state.pool), "Could not count businesses");
    let activated: i64 = db_or_return!(sqlx::query_scalar("SELECT COUNT(DISTINCT b.business_id) FROM business_registry b JOIN cloud_daily_summaries d ON d.workspace_id = b.workspace_id AND d.branch_id = b.branch_id WHERE d.summary_date >= CURRENT_DATE - make_interval(days => $1)").bind(days).fetch_one(&state.pool), "Could not count activated businesses");
    let verified: i64 = db_or_return!(sqlx::query_scalar("SELECT COUNT(*) FROM business_verification WHERE status = 'verified'").fetch_one(&state.pool), "Could not count verified businesses");
    let percent = if total == 0 { 0.0 } else { activated as f64 * 100.0 / total as f64 };
    Json(serde_json::json!({"range":range,"signups_per_week":signups.into_iter().map(|(week,signups)| serde_json::json!({"week":week,"signups":signups})).collect::<Vec<_>>(),"activation_rate_pct":percent,"total_registered":total,"activated_businesses":activated,"verified_count":verified,"unverified_count":total.saturating_sub(verified)})).into_response()
}
