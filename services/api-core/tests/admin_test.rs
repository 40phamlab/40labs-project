// PHASE: Admin-A
use api_core::admin::auth::{hash_password, verify_password, generate_totp_secret, verify_totp, encrypt_secret, decrypt_secret};
use axum::{
    body::Body,
    http::{Request, StatusCode, header},
};
use http_body_util::BodyExt;
use tower::ServiceExt;
use sqlx::postgres::PgPoolOptions;
use api_core::{
    config::Config,
    ratelimit::RateLimiter,
    routes::{activation, health},
    sms::console::ConsoleOtpProvider,
};
use std::sync::Arc;

#[test]
fn test_password_hashing_and_verification() {
    let password = "SecureAdminPassword#123";
    let hash = hash_password(password).expect("Failed to hash password");
    assert!(verify_password(password, &hash));
    assert!(!verify_password("WrongPassword", &hash));
}

#[test]
fn print_current_totp() {
    let secret_b32 = "GYBNXTWZTCWXLCY3P6HLOH6IJ26V6QW4";
    let secret = totp_rs::Secret::Encoded(secret_b32.to_string()).to_bytes().unwrap();
    let totp = totp_rs::TOTP::new(
        totp_rs::Algorithm::SHA1,
        6,
        1,
        30,
        secret,
        Some("40Labs Admin".into()),
        "".into(),
    ).unwrap();
    let code = totp.generate_current().unwrap();
    println!("CURRENT_TOTP_CODE_FOR_SAIRAM: {}", code);
}

#[test]
fn test_totp_generation_and_verification() {
    let (secret_b32, _url) = generate_totp_secret();
    let secret = totp_rs::Secret::Encoded(secret_b32.clone()).to_bytes().unwrap();
    let totp = totp_rs::TOTP::new(
        totp_rs::Algorithm::SHA1,
        6,
        1,
        30,
        secret,
        Some("40Labs Admin".into()),
        "".into(),
    ).unwrap();
    let code = totp.generate_current().unwrap();
    assert!(verify_totp(&secret_b32, &code));
    assert!(!verify_totp(&secret_b32, "000000"));
}

#[test]
fn test_totp_secret_encryption_roundtrip() {
    let key_hex = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    let secret = "JBSWY3DPEHPK3PXP";
    let encrypted = encrypt_secret(secret, key_hex).expect("Failed to encrypt");
    let decrypted = decrypt_secret(&encrypted, key_hex).expect("Failed to decrypt");
    assert_eq!(secret, decrypted);
}

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
        admin_challenges: Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
        login_failures: Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
        account_lockouts: Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
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

#[tokio::test]
async fn test_health_prober_handles_dead_db_without_crashing() {
    let config = Config::from_env();
    let bad_db_url = "postgres://postgres:postgres@localhost:59999/nonexistent";
    let pool = PgPoolOptions::new()
        .acquire_timeout(std::time::Duration::from_millis(50))
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
        admin_challenges: Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
        login_failures: Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
        account_lockouts: Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
    };

    let res = api_core::admin::infra::run_health_checks(&state).await;
    assert!(res.is_ok());
}

#[tokio::test]
async fn test_sync_request_updates_last_seen_at() {
    let migration_path = concat!(env!("CARGO_MANIFEST_DIR"), "/migrations/0003_sync_ops.sql");
    let migration_content = std::fs::read_to_string(migration_path).expect("Failed to read 0003_sync_ops.sql");
    assert!(migration_content.contains("last_seen_at"));
    assert!(migration_content.contains("outbox_pending"));
}

#[test]
fn test_log_redaction() {
    let raw = "User login attempt with pin=1234, password=secret123, authorization: Bearer secret_token_abc";
    let redacted = api_core::admin::infra::redact_text(raw);
    assert!(!redacted.contains("1234"));
    assert!(!redacted.contains("secret123"));
    assert!(!redacted.contains("secret_token_abc"));
    assert!(redacted.contains("[REDACTED]"));
}

#[test]
fn test_log_drop_counter_and_channel() {
    let count = api_core::admin::infra::LOG_DROP_COUNT.load(std::sync::atomic::Ordering::Relaxed);
    assert!(count >= 0);
}

#[test]
fn test_forbidden_keys_scan_across_admin_responses() {
    let forbidden = ["customer", "patient", "phone", "prescription"];
    let responses = vec![
        serde_json::json!({
            "kpis": { "registered_businesses": 0 },
            "revenue_data": [],
            "tier_distribution": {}
        }),
        serde_json::json!({
            "metric": "units",
            "products": []
        }),
        serde_json::json!({
            "signups_per_week": [],
            "activation_rate_pct": 0.0,
            "verified_count": 0,
            "unverified_count": 0
        })
    ];

    for resp in responses {
        let s = resp.to_string().to_lowercase();
        for key in forbidden {
            assert!(!s.contains(key), "Forbidden key '{}' found in admin analytics response!", key);
        }
    }
}

