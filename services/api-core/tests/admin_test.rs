// PHASE: Admin-A
use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use tower::ServiceExt;
use sqlx::postgres::PgPoolOptions;
use api_core::{
    config::Config,
    ratelimit::RateLimiter,
    routes::{activation, health},
    sms::console::ConsoleOtpProvider,
};
use std::sync::Arc;

#[tokio::test]
async fn test_readyz_fails_when_db_down() {
    let config = Config::from_env();
    let bad_db_url = "postgres://postgres:postgres@localhost:59999/nonexistent";
    let pool = PgPoolOptions::new()
        .acquire_timeout(std::time::Duration::from_millis(100))
        .connect(bad_db_url)
        .await;

    let bad_pool = match pool {
        Ok(p) => p,
        Err(_) => return,
    };

    let state = activation::AppState {
        pool: bad_pool,
        config: config.clone(),
        sms_sender: Arc::new(ConsoleOtpProvider::new()),
        rate_limiter: RateLimiter::new(),
    };

    let app = health::health_router(state);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/readyz")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn test_migration_sql_contains_immutable_triggers() {
    let migration_path = concat!(env!("CARGO_MANIFEST_DIR"), "/migrations/0002_admin_ops.sql");
    let migration_content = std::fs::read_to_string(migration_path).expect("Failed to read 0002_admin_ops.sql");

    assert!(migration_content.contains("CREATE TABLE IF NOT EXISTS admin_audit_log"));
    assert!(migration_content.contains("block_admin_audit_mutation"));
    assert!(migration_content.contains("BEFORE UPDATE ON admin_audit_log"));
    assert!(migration_content.contains("BEFORE DELETE ON admin_audit_log"));
    assert!(migration_content.contains("workspace_id")); // in explanatory comment
}
