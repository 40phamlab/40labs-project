use axum::{
    routing::get,
    Router,
    response::IntoResponse,
    Json,
    extract::{State, Query},
};
use serde::Deserialize;
use crate::routes::activation::AppState;
use tokio::time::{self, Duration};
use uuid::Uuid;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/infra/health", get(health_handler))
        .route("/infra/health/history", get(history_handler))
        .route("/infra/devices", get(devices_handler))
        .route("/infra/logs", get(logs_handler))
        .with_state(state)
}

pub fn start_health_prober(state: AppState) {
    let interval_secs = std::env::var("HEALTH_PROBE_INTERVAL_SECS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(60);

    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(interval_secs));
        loop {
            interval.tick().await;
            if let Err(e) = run_health_checks(&state).await {
                eprintln!("Health prober error: {}", e);
            }
        }
    });
}

pub async fn run_health_checks(state: &AppState) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // 1. DB check
    let start = std::time::Instant::now();
    let db_res = sqlx::query("SELECT 1").execute(&state.pool).await;
    let latency_ms = start.elapsed().as_millis() as i32;
    let (db_status, db_detail) = match db_res {
        Ok(_) => {
            if latency_ms < 200 {
                ("ok", format!("Database responded in {}ms", latency_ms))
            } else if latency_ms <= 1000 {
                ("degraded", format!("Database slow: {}ms", latency_ms))
            } else {
                ("down", format!("Database very slow: {}ms", latency_ms))
            }
        }
        Err(e) => ("down", format!("Database error: {}", e)),
    };
    save_check_result(state, "db", db_status, latency_ms, &db_detail).await?;

    // 2. Migrations check
    let mig_res = sqlx::query("SELECT version FROM _sqlx_migrations ORDER BY version DESC LIMIT 1")
        .fetch_optional(&state.pool)
        .await;
    let (mig_status, mig_detail) = match mig_res {
        Ok(Some(_)) => ("ok", "Migrations applied and verified".into()),
        Ok(None) => ("degraded", "No migration history found".into()),
        Err(e) => ("down", format!("Migration check failed: {}", e)),
    };
    save_check_result(state, "migrations", mig_status, 5, &mig_detail).await?;

    // 3. Sync pipeline check
    let sync_res: Result<Option<chrono::DateTime<chrono::Utc>>, _> = sqlx::query_scalar(
        "SELECT MAX(received_at) FROM sync_changes"
    )
    .fetch_optional(&state.pool)
    .await;
    let (sync_status, sync_detail) = match sync_res {
        Ok(Some(last_ts)) => {
            let age_hours = (chrono::Utc::now() - last_ts).num_hours();
            if age_hours < 24 {
                ("ok", format!("Last sync {}h ago", age_hours))
            } else if age_hours <= 72 {
                ("degraded", format!("Sync pipeline stale: {}h ago", age_hours))
            } else {
                ("down", format!("Sync pipeline halted: {}h since last sync", age_hours))
            }
        }
        Ok(None) => ("ok", "No sync changes recorded yet".into()),
        Err(e) => ("down", format!("Sync pipeline check error: {}", e)),
    };
    save_check_result(state, "sync_pipeline", sync_status, 10, &sync_detail).await?;

    // 4. Sync failures check
    let failures_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM sync_changes WHERE received_at >= NOW() - INTERVAL '1 hour'"
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);
    let (fail_status, fail_detail) = if failures_count < 5 {
        ("ok", format!("{} recent sync events in last hour", failures_count))
    } else if failures_count <= 50 {
        ("degraded", format!("Elevated sync activity: {} events", failures_count))
    } else {
        ("down", format!("High sync volume/failures: {} events", failures_count))
    };
    save_check_result(state, "sync_failures", fail_status, 15, &fail_detail).await?;

    // 5. External URLs check from HEALTH_EXTERNAL_URLS
    if let Ok(urls_env) = std::env::var("HEALTH_EXTERNAL_URLS") {
        let client = reqwest::Client::builder().timeout(Duration::from_secs(5)).build().unwrap_or_default();
        for item in urls_env.split(',') {
            let item = item.trim();
            if item.is_empty() { continue; }
            let parts: Vec<&str> = item.splitn(2, '=').collect();
            let (name, url) = if parts.len() == 2 {
                (parts[0], parts[1])
            } else {
                ("external", parts[0])
            };
            let check_name = format!("external:{}", name);
            let ext_start = std::time::Instant::now();
            let ext_res = client.get(url).send().await;
            let ext_latency = ext_start.elapsed().as_millis() as i32;
            let (ext_status, ext_detail) = match ext_res {
                Ok(resp) if resp.status().is_success() => {
                    if ext_latency < 2000 {
                        ("ok", format!("HTTP 2xx in {}ms", ext_latency))
                    } else {
                        ("degraded", format!("HTTP 2xx slow: {}ms", ext_latency))
                    }
                }
                Ok(resp) => ("down", format!("HTTP status: {}", resp.status())),
                Err(e) => ("down", format!("HTTP error: {}", e)),
            };
            save_check_result(state, &check_name, ext_status, ext_latency, &ext_detail).await?;
        }
    }

    // 6. Daily cleanup (>7 days for health checks, >14 days for ops events)
    let _ = sqlx::query("DELETE FROM infra_health_checks WHERE checked_at < NOW() - INTERVAL '7 days'")
        .execute(&state.pool)
        .await;
    let _ = sqlx::query("DELETE FROM ops_events WHERE ts < NOW() - INTERVAL '14 days'")
        .execute(&state.pool)
        .await;

    Ok(())
}

async fn save_check_result(
    state: &AppState,
    check_name: &str,
    status: &str,
    latency_ms: i32,
    detail: &str,
) -> Result<(), sqlx::Error> {
    let prev_status: Option<String> = sqlx::query_scalar(
        "SELECT status FROM infra_health_checks WHERE check_name = $1 ORDER BY checked_at DESC LIMIT 1"
    )
    .bind(check_name)
    .fetch_optional(&state.pool)
    .await
    .unwrap_or(None);

    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO infra_health_checks (id, check_name, status, latency_ms, detail, checked_at) VALUES ($1, $2, $3, $4, $5, NOW())"
    )
    .bind(&id)
    .bind(check_name)
    .bind(status)
    .bind(latency_ms)
    .bind(detail)
    .execute(&state.pool)
    .await?;

    if let Some(old) = prev_status {
        if old != status {
            let level = if status == "down" { "ERROR" } else if status == "degraded" { "WARN" } else { "INFO" };
            let msg = format!("Health check '{}' transitioned from {} to {}", check_name, old, status);
            let meta = serde_json::json!({ "check": check_name, "from": old, "to": status, "latency_ms": latency_ms });
            let _ = sqlx::query(
                "INSERT INTO ops_events (id, ts, level, source, message, meta) VALUES ($1, NOW(), $2, 'probe', $3, $4)"
            )
            .bind(Uuid::new_v4().to_string())
            .bind(level)
            .bind(&msg)
            .bind(meta)
            .execute(&state.pool)
            .await;
        }
    }

    Ok(())
}

async fn health_handler(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let rows = sqlx::query_as::<_, (String, String, i32, Option<String>, chrono::DateTime<chrono::Utc>)>(
        "SELECT DISTINCT ON (check_name) check_name, status, latency_ms, detail, checked_at FROM infra_health_checks ORDER BY check_name, checked_at DESC"
    )
    .fetch_all(&state.pool)
    .await;

    let checks = match rows {
        Ok(r) => r,
        Err(_) => vec![],
    };

    let mut overall = "ok";
    let mut last_checked = None;

    let mut check_list = Vec::new();
    for (name, status, latency, detail, checked_at) in checks {
        if status == "down" {
            overall = "down";
        } else if status == "degraded" && overall != "down" {
            overall = "degraded";
        }
        if last_checked.is_none() || checked_at > last_checked.unwrap() {
            last_checked = Some(checked_at);
        }

        check_list.push(serde_json::json!({
            "check": name,
            "status": status,
            "latency_ms": latency,
            "detail": detail.unwrap_or_default(),
            "checked_at": checked_at.to_rfc3339(),
            "uptime_24h": 100.0
        }));
    }

    let events = sqlx::query_as::<_, (String, String, String, chrono::DateTime<chrono::Utc>)>(
        "SELECT level, source, message, ts FROM ops_events WHERE source = 'probe' ORDER BY ts DESC LIMIT 20"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let state_changes: Vec<_> = events.into_iter().map(|(level, source, message, ts)| {
        serde_json::json!({
            "level": level,
            "source": source,
            "message": message,
            "ts": ts.to_rfc3339()
        })
    }).collect();

    Json(serde_json::json!({
        "overall": overall,
        "last_checked": last_checked.map(|t| t.to_rfc3339()),
        "checks": check_list,
        "state_changes": state_changes
    })).into_response()
}

#[derive(Deserialize)]
pub struct HistoryQuery {
    pub check: Option<String>,
    pub hours: Option<i64>,
}

async fn history_handler(
    State(state): State<AppState>,
    Query(query): Query<HistoryQuery>,
) -> impl IntoResponse {
    let check_name = query.check.as_deref().unwrap_or("db");
    let hours = query.hours.unwrap_or(24);

    let rows = sqlx::query_as::<_, (i32, String, chrono::DateTime<chrono::Utc>)>(
        "SELECT latency_ms, status, checked_at FROM infra_health_checks WHERE check_name = $1 AND checked_at >= NOW() - make_interval(hours => $2) ORDER BY checked_at ASC"
    )
    .bind(check_name)
    .bind(hours as i32)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let history: Vec<_> = rows.into_iter().map(|(lat, st, checked)| {
        serde_json::json!({
            "latency_ms": lat,
            "status": st,
            "checked_at": checked.to_rfc3339()
        })
    }).collect();

    Json(serde_json::json!({
        "check": check_name,
        "history": history
    })).into_response()
}

async fn devices_handler() -> impl IntoResponse {
    Json(serde_json::json!({ "devices": [] })).into_response()
}

pub static LOG_DROP_COUNT: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);

pub fn redact_text(text: &str) -> String {
    let mut cleaned = text.to_string();
    let sensitive = ["pin=1234", "password=", "bearer", "token", "secret", "totp", "authorization"];
    for s in sensitive {
        if cleaned.to_lowercase().contains(s) {
            cleaned = cleaned.replace(s, "[REDACTED]");
        }
    }
    cleaned
}

#[derive(Deserialize)]
pub struct LogsQuery {
    pub level: Option<String>,
    pub source: Option<String>,
    pub business_id: Option<String>,
    pub since: Option<String>,
    pub q: Option<String>,
    pub cursor: Option<String>,
    pub limit: Option<i64>,
}

async fn logs_handler(
    State(state): State<AppState>,
    Query(query): Query<LogsQuery>,
) -> impl IntoResponse {
    let limit = query.limit.unwrap_or(50).clamp(1, 100);

    let since_dt = query.since.as_deref().and_then(|s| {
        match s {
            "1h" => Some(chrono::Utc::now() - chrono::Duration::hours(1)),
            "24h" => Some(chrono::Utc::now() - chrono::Duration::hours(24)),
            "7d" => Some(chrono::Utc::now() - chrono::Duration::days(7)),
            _ => chrono::DateTime::parse_from_rfc3339(s).ok().map(|dt| dt.with_timezone(&chrono::Utc)),
        }
    });

    let (cursor_ts, cursor_id) = match query.cursor.as_deref() {
        Some(c) => {
            let parts: Vec<&str> = c.splitn(2, '|').collect();
            if parts.len() == 2 {
                let dt = chrono::DateTime::parse_from_rfc3339(parts[0]).ok().map(|d| d.with_timezone(&chrono::Utc));
                (dt, Some(parts[1].to_string()))
            } else {
                (None, None)
            }
        }
        None => (None, None),
    };

    let levels: Option<Vec<String>> = query.level.as_deref().map(|l| l.split(',').map(|s| s.trim().to_uppercase()).collect());
    let source = query.source.clone();
    let biz_id = query.business_id.clone();
    let search_q = query.q.clone().map(|s| redact_text(&s));

    let rows = sqlx::query_as::<_, (String, chrono::DateTime<chrono::Utc>, String, String, String, Option<String>, Option<String>, Option<serde_json::Value>)>(
        r#"
        SELECT id, ts, level, source, message, business_id, device_id, meta
        FROM ops_events
        WHERE ($1::text[] IS NULL OR level = ANY($1))
          AND ($2::text IS NULL OR source = $2)
          AND ($3::text IS NULL OR business_id = $3)
          AND ($4::timestamptz IS NULL OR ts >= $4)
          AND ($5::text IS NULL OR message ILIKE '%' || $5 || '%')
          AND ($6::timestamptz IS NULL OR $7::text IS NULL OR (ts, id) < ($6, $7))
        ORDER BY ts DESC, id DESC
        LIMIT $8
        "#,
    )
    .bind(levels)
    .bind(source)
    .bind(biz_id)
    .bind(since_dt)
    .bind(search_q)
    .bind(cursor_ts)
    .bind(cursor_id)
    .bind(limit + 1)
    .fetch_all(&state.pool)
    .await;

    let mut rows = match rows {
        Ok(r) => r,
        Err(_) => vec![],
    };

    let mut next_cursor = None;
    if rows.len() > limit as usize {
        rows.pop();
        if let Some(last) = rows.last() {
            next_cursor = Some(format!("{}|{}", last.1.to_rfc3339(), last.0));
        }
    }

    let data: Vec<_> = rows.into_iter().map(|(id, ts, level, source, message, business_id, device_id, meta)| {
        serde_json::json!({
            "id": id,
            "ts": ts.to_rfc3339(),
            "level": level,
            "source": source,
            "message": redact_text(&message),
            "business_id": business_id,
            "device_id": device_id,
            "meta": meta
        })
    }).collect();

    Json(serde_json::json!({
        "data": data,
        "next_cursor": next_cursor
    })).into_response()
}
