use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;

use axum::{
    extract::State,
    http::{Request, StatusCode},
    middleware::Next,
    response::Response,
    routing::get,
    Router,
};

use crate::routes::activation::AppState;

static REQUESTS: AtomicU64 = AtomicU64::new(0);
static ERRORS: AtomicU64 = AtomicU64::new(0);
static LATENCY_MS_TOTAL: AtomicU64 = AtomicU64::new(0);
static LATENCY_BUCKETS: [AtomicU64; 6] = [const { AtomicU64::new(0) }; 6];
const LATENCY_BUCKET_LIMITS_MS: [u64; 6] = [10, 50, 100, 250, 500, 1000];
static SYNC_PUSH_OK: AtomicU64 = AtomicU64::new(0);
static SYNC_PUSH_FAILED: AtomicU64 = AtomicU64::new(0);
static HEARTBEATS_OK: AtomicU64 = AtomicU64::new(0);
static HEARTBEATS_FAILED: AtomicU64 = AtomicU64::new(0);

pub async fn track_request(request: Request<axum::body::Body>, next: Next) -> Response {
    let path = request.uri().path().to_owned();
    let started = Instant::now();
    let response = next.run(request).await;
    let elapsed_ms = started.elapsed().as_millis().min(u64::MAX as u128) as u64;
    REQUESTS.fetch_add(1, Ordering::Relaxed);
    LATENCY_MS_TOTAL.fetch_add(elapsed_ms, Ordering::Relaxed);
    for (limit, bucket) in LATENCY_BUCKET_LIMITS_MS.iter().zip(LATENCY_BUCKETS.iter()) {
        if elapsed_ms <= *limit {
            bucket.fetch_add(1, Ordering::Relaxed);
        }
    }
    let failed = response.status().is_server_error();
    if failed {
        ERRORS.fetch_add(1, Ordering::Relaxed);
        tracing::error!(
            status_code = response.status().as_u16(),
            elapsed_ms,
            "api_request_failed"
        );
    }
    if path == "/v1/sync/push" {
        (if failed {
            &SYNC_PUSH_FAILED
        } else {
            &SYNC_PUSH_OK
        })
        .fetch_add(1, Ordering::Relaxed);
    } else if path == "/v1/sync/heartbeat" {
        (if failed {
            &HEARTBEATS_FAILED
        } else {
            &HEARTBEATS_OK
        })
        .fetch_add(1, Ordering::Relaxed);
    }
    response
}

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/metrics", get(metrics))
        .with_state(state)
}

async fn metrics(State(state): State<AppState>) -> (StatusCode, String) {
    let pool = &state.pool;
    let requests = REQUESTS.load(Ordering::Relaxed);
    let latency_total = LATENCY_MS_TOTAL.load(Ordering::Relaxed);
    let body = format!(
        "# HELP api_http_requests_total Total HTTP requests\n# TYPE api_http_requests_total counter\napi_http_requests_total {requests}\n\
# HELP api_http_errors_total Total HTTP 5xx responses\n# TYPE api_http_errors_total counter\napi_http_errors_total {}\n\
# HELP api_http_request_latency_ms_avg Average HTTP request latency in milliseconds\n# TYPE api_http_request_latency_ms_avg gauge\napi_http_request_latency_ms_avg {}\n\
# HELP api_db_pool_connections Current SQLx PostgreSQL pool connections\n# TYPE api_db_pool_connections gauge\napi_db_pool_connections {}\n\
# HELP api_db_pool_idle_connections Idle SQLx PostgreSQL pool connections\n# TYPE api_db_pool_idle_connections gauge\napi_db_pool_idle_connections {}\n\
# HELP api_sync_push_total Sync push responses by result\n# TYPE api_sync_push_total counter\napi_sync_push_total{{result=\"success\"}} {}\napi_sync_push_total{{result=\"server_error\"}} {}\n\
# HELP api_device_heartbeat_total Heartbeat responses by result\n# TYPE api_device_heartbeat_total counter\napi_device_heartbeat_total{{result=\"success\"}} {}\napi_device_heartbeat_total{{result=\"server_error\"}} {}\n",
        ERRORS.load(Ordering::Relaxed),
        if requests == 0 { 0 } else { latency_total / requests },
        pool.size(), pool.num_idle(),
        SYNC_PUSH_OK.load(Ordering::Relaxed), SYNC_PUSH_FAILED.load(Ordering::Relaxed),
        HEARTBEATS_OK.load(Ordering::Relaxed), HEARTBEATS_FAILED.load(Ordering::Relaxed),
    );
    let histogram = format!(
        "# HELP api_http_request_duration_ms API request latency in milliseconds\n# TYPE api_http_request_duration_ms histogram\n{}api_http_request_duration_ms_bucket{{le=\"+Inf\"}} {requests}\napi_http_request_duration_ms_sum {latency_total}\napi_http_request_duration_ms_count {requests}\n",
        LATENCY_BUCKET_LIMITS_MS
            .iter()
            .zip(LATENCY_BUCKETS.iter())
            .map(|(limit, bucket)| format!(
                "api_http_request_duration_ms_bucket{{le=\"{limit}\"}} {}\n",
                bucket.load(Ordering::Relaxed)
            ))
            .collect::<String>()
    );
    (StatusCode::OK, format!("{body}{histogram}"))
}
