use api_core::{
    admin::{
        self,
        auth::{encrypt_secret, generate_totp_secret, hash_password},
    },
    config::{Config, DeviceTokenKeys},
    ratelimit::RateLimiter,
    routes::activation::AppState,
    sms::{console::ConsoleOtpProvider, OtpProvider},
};
use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::sync::Arc;
use tower::ServiceExt;

fn config(url: String) -> Config {
    Config {
        database_url: url,
        nextsms_base_url: String::new(),
        nextsms_api_token: String::new(),
        nextsms_username: String::new(),
        nextsms_password: String::new(),
        nextsms_sender_id: String::new(),
        sms_mode: "test".into(),
        otp_provider: "console".into(),
        app_env: "test".into(),
        otp_enabled: false,
        otp_daily_max: 1,
        activation_signing_key: "00".repeat(32),
        port: 3000,
        admin_web_origin: "http://localhost:5174".into(),
        totp_enc_key: "00".repeat(32),
        admin_debug_otp: false,
        device_token_keys: DeviceTokenKeys::parse(
            "test".into(),
            r#"{"test":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"}"#,
        )
        .unwrap(),
    }
}

async fn test_pool() -> PgPool {
    let url = std::env::var("API_CORE_TEST_DATABASE_URL")
        .expect("API_CORE_TEST_DATABASE_URL must name an isolated test database");
    let pool = PgPoolOptions::new()
        .max_connections(6)
        .acquire_timeout(std::time::Duration::from_secs(15))
        .connect(&url)
        .await
        .expect("connect isolated test database");
    let mut lock = pool
        .acquire()
        .await
        .expect("acquire migration lock connection");
    sqlx::query("SELECT pg_advisory_lock($1)")
        .bind(40_011_202_611_130_001_i64)
        .execute(&mut *lock)
        .await
        .expect("serialize isolated test migrations");
    api_core::migrations::run(&pool)
        .await
        .expect("apply test migrations");
    sqlx::query("SELECT pg_advisory_unlock($1)")
        .bind(40_011_202_611_130_001_i64)
        .execute(&mut *lock)
        .await
        .expect("release test migration lock");
    drop(lock);
    pool
}

fn state(pool: PgPool) -> AppState {
    let url = std::env::var("API_CORE_TEST_DATABASE_URL").unwrap();
    AppState {
        pool,
        config: config(url),
        sms_sender: Arc::new(ConsoleOtpProvider::new()) as Arc<dyn OtpProvider>,
        rate_limiter: RateLimiter::new(),
    }
}

async fn insert_admin(pool: &PgPool, id: &str, role: &str, totp_enc: Option<&str>) {
    let hash = hash_password("test-password-only-for-isolated-integration-tests").unwrap();
    sqlx::query("INSERT INTO admin_users(id,email,password_hash,totp_secret_enc,role) VALUES($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING")
        .bind(id).bind(format!("{id}@test.invalid")).bind(hash).bind(totp_enc).bind(role).execute(pool).await.unwrap();
}

#[tokio::test]
async fn admin_roles_are_enforced_and_sessions_revoke_immediately() {
    let pool = test_pool().await;
    let suffix = uuid::Uuid::new_v4().to_string();
    let user_id = format!("viewer-{suffix}");
    let session_id = format!("session-{suffix}");
    insert_admin(&pool, &user_id, "viewer", None).await;
    sqlx::query("INSERT INTO admin_sessions(id,admin_user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '1 hour')")
        .bind(&session_id).bind(&user_id).execute(&pool).await.unwrap();
    let app = admin::router(state(pool.clone()));
    let denied = app
        .clone()
        .oneshot(
            Request::get("/admin/v1/infra/logs")
                .header("cookie", format!("admin_session={session_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(denied.status(), StatusCode::FORBIDDEN);
    let revoke = app
        .clone()
        .oneshot(
            Request::post(format!("/admin/v1/auth/sessions/{session_id}/revoke"))
                .header("cookie", format!("admin_session={session_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(revoke.status(), StatusCode::OK);
    let after = app
        .oneshot(
            Request::get("/admin/v1/me")
                .header("cookie", format!("admin_session={session_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(after.status(), StatusCode::UNAUTHORIZED);
    sqlx::query("DELETE FROM admin_sessions WHERE admin_user_id=$1")
        .bind(&user_id)
        .execute(&pool)
        .await
        .unwrap();
    sqlx::query("DELETE FROM admin_users WHERE id=$1")
        .bind(user_id)
        .execute(&pool)
        .await
        .unwrap();
    pool.close().await;
}

#[tokio::test]
async fn totp_step_replay_is_rejected_across_distinct_challenges() {
    let pool = test_pool().await;
    let suffix = uuid::Uuid::new_v4().to_string();
    let user_id = format!("totp-{suffix}");
    let (secret, _) = generate_totp_secret();
    let encrypted = encrypt_secret(&secret, &"00".repeat(32)).unwrap();
    insert_admin(&pool, &user_id, "admin", Some(&encrypted)).await;
    let challenges: Vec<_> = (0..6)
        .map(|index| format!("challenge-{index}-{suffix}"))
        .collect();
    for id in &challenges {
        sqlx::query("INSERT INTO admin_login_challenges(id,admin_user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '5 minutes')")
            .bind(id).bind(&user_id).execute(&pool).await.unwrap();
    }
    let totp_bytes = totp_rs::Secret::Encoded(secret).to_bytes().unwrap();
    let totp = totp_rs::TOTP::new(
        totp_rs::Algorithm::SHA1,
        6,
        1,
        30,
        totp_bytes,
        None,
        String::new(),
    )
    .unwrap();
    let code = totp.generate_current().unwrap();
    let app = admin::router(state(pool.clone()));
    let call = |id: String| {
        app.clone().oneshot(
            Request::post("/admin/v1/auth/totp")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::json!({"challenge_id":id,"code":code}).to_string(),
                ))
                .unwrap(),
        )
    };
    let first_response = call(challenges[0].clone()).await.unwrap();
    let first_status = first_response.status();
    let first_body = axum::body::to_bytes(first_response.into_body(), 16_384)
        .await
        .unwrap();
    assert_eq!(
        first_status,
        StatusCode::OK,
        "{}",
        String::from_utf8_lossy(&first_body)
    );
    assert_eq!(
        call(challenges[1].clone()).await.unwrap().status(),
        StatusCode::UNAUTHORIZED
    );
    for challenge in &challenges[2..5] {
        assert_eq!(
            call(challenge.clone()).await.unwrap().status(),
            StatusCode::UNAUTHORIZED
        );
    }
    assert_eq!(
        call(challenges[5].clone()).await.unwrap().status(),
        StatusCode::TOO_MANY_REQUESTS
    );
    sqlx::query("DELETE FROM admin_sessions WHERE admin_user_id=$1")
        .bind(&user_id)
        .execute(&pool)
        .await
        .unwrap();
    sqlx::query("DELETE FROM admin_login_challenges WHERE admin_user_id=$1")
        .bind(&user_id)
        .execute(&pool)
        .await
        .unwrap();
    sqlx::query("DELETE FROM admin_users WHERE id=$1")
        .bind(user_id)
        .execute(&pool)
        .await
        .unwrap();
    pool.close().await;
}

#[tokio::test]
async fn shared_rate_limit_cannot_be_bypassed_by_a_second_instance() {
    let pool = test_pool().await;
    let a = RateLimiter::new();
    let b = RateLimiter::new();
    let key = format!("integration-rate-{}", uuid::Uuid::new_v4());
    assert!(a
        .check_rate_limit_shared(&pool, &key, 1, std::time::Duration::from_secs(60))
        .await
        .is_ok());
    assert!(b
        .check_rate_limit_shared(&pool, &key, 1, std::time::Duration::from_secs(60))
        .await
        .is_err());
    pool.close().await;
}

#[tokio::test]
async fn recovery_codes_are_returned_once_and_consumed_once() {
    let pool = test_pool().await;
    let suffix = uuid::Uuid::new_v4().to_string();
    let user_id = format!("recovery-{suffix}");
    let session_id = format!("recovery-session-{suffix}");
    insert_admin(&pool, &user_id, "viewer", None).await;
    sqlx::query("INSERT INTO admin_sessions(id,admin_user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '1 hour')")
        .bind(&session_id).bind(&user_id).execute(&pool).await.unwrap();
    let app = admin::router(state(pool.clone()));
    let response = app
        .clone()
        .oneshot(
            Request::post("/admin/v1/auth/recovery-codes/regenerate")
                .header("cookie", format!("admin_session={session_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), 16_384)
        .await
        .unwrap();
    let codes: serde_json::Value = serde_json::from_slice(&body).unwrap();
    let code = codes["recovery_codes"][0].as_str().unwrap().to_string();
    let challenge_a = format!("recovery-challenge-a-{suffix}");
    let challenge_b = format!("recovery-challenge-b-{suffix}");
    for challenge in [&challenge_a, &challenge_b] {
        sqlx::query("INSERT INTO admin_login_challenges(id,admin_user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '5 minutes')")
            .bind(challenge).bind(&user_id).execute(&pool).await.unwrap();
    }
    let body_for = |challenge_id: &str| {
        Body::from(serde_json::json!({"challenge_id":challenge_id,"code":code}).to_string())
    };
    let first = app
        .clone()
        .oneshot(
            Request::post("/admin/v1/auth/recovery")
                .header("content-type", "application/json")
                .body(body_for(&challenge_a))
                .unwrap(),
        )
        .await
        .unwrap();
    let first_status = first.status();
    let first_body = axum::body::to_bytes(first.into_body(), 16_384)
        .await
        .unwrap();
    assert_eq!(
        first_status,
        StatusCode::OK,
        "{}",
        String::from_utf8_lossy(&first_body)
    );
    let second = app
        .oneshot(
            Request::post("/admin/v1/auth/recovery")
                .header("content-type", "application/json")
                .body(body_for(&challenge_b))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(second.status(), StatusCode::UNAUTHORIZED);
    sqlx::query("DELETE FROM admin_sessions WHERE admin_user_id=$1")
        .bind(&user_id)
        .execute(&pool)
        .await
        .unwrap();
    sqlx::query("DELETE FROM admin_login_challenges WHERE admin_user_id=$1")
        .bind(&user_id)
        .execute(&pool)
        .await
        .unwrap();
    sqlx::query("DELETE FROM admin_users WHERE id=$1")
        .bind(user_id)
        .execute(&pool)
        .await
        .unwrap();
    pool.close().await;
}
