use api_core::{
    auth::device::{issue_access_token, DeviceIdentity},
    config::{Config, DeviceTokenKeys},
    ratelimit::RateLimiter,
    routes::activation::AppState,
    sms::{console::ConsoleOtpProvider, OtpProvider},
    sync,
};
use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use serde_json::json;
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};
use tower::ServiceExt;

fn test_keys() -> DeviceTokenKeys {
    DeviceTokenKeys::parse(
        "test".into(),
        r#"{"test":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"}"#,
    )
    .unwrap()
}

fn test_config(url: String) -> Config {
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
        admin_web_origin: String::new(),
        totp_enc_key: "00".repeat(32),
        admin_debug_otp: false,
        device_token_keys: test_keys(),
    }
}

async fn request(
    app: axum::Router,
    method: &str,
    uri: &str,
    token: Option<&str>,
    body: serde_json::Value,
) -> StatusCode {
    let mut builder = Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json");
    if let Some(token) = token {
        builder = builder.header("authorization", format!("Bearer {token}"));
    }
    let response = app
        .oneshot(builder.body(Body::from(body.to_string())).unwrap())
        .await
        .unwrap();
    response.status()
}

async fn verification_response(app: axum::Router, token: &str) -> (StatusCode, serde_json::Value) {
    let response = app
        .oneshot(
            Request::get("/v1/business/verification")
                .header("authorization", format!("Bearer {token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let status = response.status();
    let bytes = axum::body::to_bytes(response.into_body(), 16_384)
        .await
        .unwrap();
    (status, serde_json::from_slice(&bytes).unwrap())
}

async fn seed(pool: &PgPool) {
    sqlx::query("INSERT INTO business_registry(business_id,workspace_id,branch_id,phone_hash,terms_version,terms_locale,terms_text_sha256,terms_accepted_at,created_at,version) VALUES('biz-a','ws-a','branch-a','ph-a','1','en','hash',NOW()::text,NOW()::text,1),('biz-b','ws-b','branch-b','ph-b','1','en','hash',NOW()::text,NOW()::text,1)").execute(pool).await.unwrap();
    for (device, ws, biz, branch) in [
        ("device-a", "ws-a", "biz-a", "branch-a"),
        ("device-b", "ws-b", "biz-b", "branch-b"),
    ] {
        sqlx::query("INSERT INTO device_enrollments(device_id,business_id,workspace_id,branch_id,refresh_token_hash,refresh_expires_at) VALUES($1,$2,$3,$4,'hash',NOW()+INTERVAL '30 days')").bind(device).bind(biz).bind(ws).bind(branch).execute(pool).await.unwrap();
        sqlx::query("INSERT INTO sync_devices(device_id,workspace_id,business_id,branch_id) VALUES($1,$2,$3,$4)").bind(device).bind(ws).bind(biz).bind(branch).execute(pool).await.unwrap();
    }
}

#[tokio::test]
async fn postgres_enrolled_device_isolation_and_atomic_sync() {
    let Ok(url) = std::env::var("API_CORE_TEST_DATABASE_URL") else {
        panic!("Set API_CORE_TEST_DATABASE_URL to a disposable isolated PostgreSQL database")
    };
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&url)
        .await
        .expect("connect isolated test PostgreSQL");
    api_core::migrations::run(&pool)
        .await
        .expect("apply migrations to isolated test PostgreSQL");
    sqlx::raw_sql("TRUNCATE sync_changes, sync_devices, device_enrollment_grants, device_enrollments, cloud_inventory_items, cloud_prices, cloud_price_history, cloud_daily_summaries, business_registry CASCADE").execute(&pool).await.unwrap();
    seed(&pool).await;
    sqlx::query("UPDATE business_registry SET verification_status=CASE business_id WHEN 'biz-a' THEN 'pending_review' ELSE 'rejected' END")
        .execute(&pool).await.unwrap();
    let app = sync::router(AppState {
        pool: pool.clone(),
        config: test_config(url),
        sms_sender: Arc::new(ConsoleOtpProvider::new()) as Arc<dyn OtpProvider>,
        rate_limiter: RateLimiter::new(),
        admin_challenges: Arc::new(Mutex::new(HashMap::new())),
        login_failures: Arc::new(Mutex::new(HashMap::new())),
        account_lockouts: Arc::new(Mutex::new(HashMap::new())),
    });
    let now = chrono::Utc::now();
    let a = issue_access_token(
        &test_keys(),
        &DeviceIdentity {
            device_id: "device-a".into(),
            workspace_id: "ws-a".into(),
            business_id: "biz-a".into(),
            branch_id: "branch-a".into(),
            token_version: 1,
        },
        now,
    )
    .unwrap();
    let b = issue_access_token(
        &test_keys(),
        &DeviceIdentity {
            device_id: "device-b".into(),
            workspace_id: "ws-b".into(),
            business_id: "biz-b".into(),
            branch_id: "branch-b".into(),
            token_version: 1,
        },
        now,
    )
    .unwrap();

    let (read_status, read_body) = verification_response(app.clone(), &a).await;
    assert_eq!(read_status, StatusCode::OK);
    assert_eq!(read_body["status"], "pending_review");

    assert_eq!(
        request(
            app.clone(),
            "POST",
            "/v1/sync/heartbeat",
            Some("eyJkZXZpY2VfaWQiOiJmb3JnZWQifQ"),
            json!({"device_id":"device-a","pending_count":0,"app_version":"test"})
        )
        .await,
        StatusCode::UNAUTHORIZED
    );
    let mut modified = a.clone();
    modified.push('x');
    assert_eq!(
        request(
            app.clone(),
            "POST",
            "/v1/sync/heartbeat",
            Some(&modified),
            json!({"device_id":"device-a","pending_count":0,"app_version":"test"})
        )
        .await,
        StatusCode::UNAUTHORIZED
    );
    assert_eq!(
        request(
            app.clone(),
            "POST",
            "/v1/sync/heartbeat",
            Some(&a),
            json!({"device_id":"device-b","pending_count":0,"app_version":"test"})
        )
        .await,
        StatusCode::UNAUTHORIZED
    );
    assert_eq!(
        request(
            app.clone(),
            "POST",
            "/v1/sync/heartbeat",
            Some(&a),
            json!({"device_id":"device-a","pending_count":0,"app_version":"test"})
        )
        .await,
        StatusCode::OK
    );

    let change = |change_id: &str, id: &str, workspace: &str, branch: &str, qty: i32| json!({"change_id":change_id,"entity":"inventory_item","entity_id":id,"op":"upsert","version":2,"created_at":"2026-01-01T00:00:00Z","payload":{"id":id,"workspace_id":workspace,"branch_id":branch,"medicine_id":"med","batch_number":"batch","expiry_date":"2027-01-01","buy_price":100,"sell_price":200,"quantity":qty,"low_stock_threshold":5,"cold_chain_required":false,"is_deactivated":false,"version":2,"deleted_at":null,"created_at":"2026-01-01T00:00:00Z","updated_at":"2026-01-01T00:00:00Z"}});
    let push = |device: &str, changes: Vec<serde_json::Value>| json!({"device_id":device,"batch_id":"batch","app_version":"test","changes":changes});
    assert_eq!(
        request(
            app.clone(),
            "POST",
            "/v1/sync/push",
            Some(&a),
            push(
                "device-a",
                vec![change("cross-ws", "x", "ws-b", "branch-b", 9)]
            )
        )
        .await,
        StatusCode::OK
    );
    assert_eq!(
        request(
            app.clone(),
            "POST",
            "/v1/sync/push",
            Some(&a),
            push(
                "device-a",
                vec![change("cross-branch", "x", "ws-a", "branch-b", 9)]
            )
        )
        .await,
        StatusCode::OK
    );
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM cloud_inventory_items WHERE id='x'")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(count, 0);

    let valid_status = request(
        app.clone(),
        "POST",
        "/v1/sync/push",
        Some(&a),
        push(
            "device-a",
            vec![change("valid", "x", "ws-a", "branch-a", 5)],
        ),
    )
    .await;
    assert_eq!(valid_status, StatusCode::OK);
    let stored:i32=sqlx::query_scalar("SELECT quantity FROM cloud_inventory_items WHERE id='x' AND workspace_id='ws-a' AND branch_id='branch-a'").fetch_one(&pool).await.unwrap();
    assert_eq!(stored, 5);
    // A second tenant cannot reassign an existing ID even when its payload claims its own scope.
    let a2 = issue_access_token(
        &test_keys(),
        &DeviceIdentity {
            device_id: "device-a".into(),
            workspace_id: "ws-a".into(),
            business_id: "biz-a".into(),
            branch_id: "branch-a".into(),
            token_version: 1,
        },
        now,
    )
    .unwrap();
    let other = change("reassign", "x", "ws-b", "branch-b", 99);
    request(
        app.clone(),
        "POST",
        "/v1/sync/push",
        Some(&b),
        push("device-b", vec![other]),
    )
    .await;
    let unchanged: i32 =
        sqlx::query_scalar("SELECT quantity FROM cloud_inventory_items WHERE id='x'")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(unchanged, 5);

    sqlx::query("UPDATE device_enrollments SET revoked_at=NOW(),token_version=token_version+1 WHERE device_id='device-a'").execute(&pool).await.unwrap();
    assert_eq!(
        request(
            app,
            "POST",
            "/v1/sync/heartbeat",
            Some(&a2),
            json!({"device_id":"device-a","pending_count":0,"app_version":"test"})
        )
        .await,
        StatusCode::UNAUTHORIZED
    );
    pool.close().await;
}
