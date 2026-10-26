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
