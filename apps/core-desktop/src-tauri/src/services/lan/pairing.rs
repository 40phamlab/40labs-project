use axum::{
    extract::{ConnectInfo, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::net::{IpAddr, SocketAddr};
use std::sync::Arc;
use std::time::{Duration as StdDuration, Instant};
use uuid::Uuid;

use crate::models::device::{PairDeviceRequest, PairDeviceResponse};
use crate::models::audit::AuditLogEntry;
use crate::repositories::{device_repo, audit_repo::AuditRepository};
use super::LanServerState;

pub async fn health_handler() -> Json<Value> {
    Json(json!({
        "status": "ok",
        "service": "40labs-core-lan"
    }))
}

pub async fn pair_handler(
    State(state): State<Arc<LanServerState>>,
    connect_info: Option<ConnectInfo<SocketAddr>>,
    Json(req): Json<PairDeviceRequest>,
) -> Result<Json<PairDeviceResponse>, (StatusCode, Json<Value>)> {
    let client_ip = connect_info.map(|ci| ci.0.ip()).unwrap_or_else(|| IpAddr::V4(std::net::Ipv4Addr::LOCALHOST));

    // 1. Brute-force rate limiting check
    {
        let mut failures = state.pair_failures.lock().await;
        if let Some((count, instant)) = failures.get(&client_ip) {
            if *count >= 5 {
                if instant.elapsed() < StdDuration::from_secs(900) {
                    return Err((
                        StatusCode::TOO_MANY_REQUESTS,
                        Json(json!({ "error": "Too many pairing failures. Please retry later." }))
                    ));
                } else {
                    failures.remove(&client_ip);
                }
            }
        }
    }

    let record_failure = async |state: &LanServerState, ip: IpAddr| {
        let mut failures = state.pair_failures.lock().await;
        let entry = failures.entry(ip).or_insert((0, Instant::now()));
        entry.0 += 1;
        entry.1 = Instant::now();
    };

    // 2. Validate device label and type
    let label = req.device_label.trim();
    if label.is_empty() || label.len() > 100 {
        record_failure(&state, client_ip).await;
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Invalid or missing device label" }))
        ));
    }

    let dev_type = req.device_type.trim();
    if dev_type.is_empty() || dev_type.len() > 50 {
        record_failure(&state, client_ip).await;
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Invalid or missing device type" }))
        ));
    }

    // 3. Validate and consume session atomically
    let (user_id, permissions_json) = match state
        .validate_and_consume_session(&req.session_id, &req.token)
        .await
    {
        Ok(res) => res,
        Err(_) => {
            record_failure(&state, client_ip).await;
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": "Invalid or expired pairing session" }))
            ));
        }
    };

    // 4. Issue 32-byte secure random token and compute SHA-256 hash
    let raw_credential = format!("tok_{}{}", Uuid::new_v4().to_string(), Uuid::new_v4().to_string());
    let mut hasher = Sha256::new();
    hasher.update(raw_credential.as_bytes());
    let credential_hash = format!("{:x}", hasher.finalize());

    const DEFAULT_WORKSPACE_ID: &str = "ws_010101";
    const DEFAULT_BRANCH_ID: &str = "br_010101";

    // 5. Create paired device in database
    let device = match device_repo::create_paired_device(
        &state.pool,
        DEFAULT_WORKSPACE_ID,
        DEFAULT_BRANCH_ID,
        &user_id,
        label,
        dev_type,
        &permissions_json,
        &credential_hash,
    )
    .await {
        Ok(d) => d,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("DB Error: {}", e) }))
            ));
        }
    };

    // 6. Record immutable audit log entry
    let audit_entry = AuditLogEntry {
        id: format!("audit_{}", Uuid::new_v4()),
        workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
        branch_id: DEFAULT_BRANCH_ID.to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
        action: "device_pair".to_string(),
        performed_by_user_id: Some(user_id.clone()),
        target_entity_type: "PairedDevice".to_string(),
        target_entity_id: device.id.clone(),
        metadata: Some(serde_json::json!({ "device_label": label, "device_type": dev_type }).to_string()),
    };
    let _ = AuditRepository::create(&state.pool, &audit_entry).await;

    // Reset failure counter on success
    {
        let mut failures = state.pair_failures.lock().await;
        failures.remove(&client_ip);
    }

    Ok(Json(PairDeviceResponse {
        device,
        credential: raw_credential,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use tower::ServiceExt;
    use sqlx::sqlite::SqlitePoolOptions;
    use std::sync::Arc;
    use crate::services::lan::{LanServerState, router::create_router};

    async fn setup_test_state() -> Arc<LanServerState> {
        let pool = SqlitePoolOptions::new()
            .connect("sqlite::memory:")
            .await
            .unwrap();

        sqlx::migrate!("../../../infra/db/sqlite-schema/migrations")
            .run(&pool)
            .await
            .unwrap();

        sqlx::query(
            r#"
            INSERT INTO app_user (id, workspace_id, branch_id, username, first_name, last_name, full_name, role, role_preset, active, created_at, updated_at)
            VALUES ('user_active', 'ws_1', 'br_1', 'activeuser', 'Active', 'User', 'Active User', 'staff', 'admin', 1, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')
            "#,
        )
        .execute(&pool)
        .await
        .unwrap();

        Arc::new(LanServerState::new(pool, 4040))
    }

    #[tokio::test]
    async fn test_health_and_pairing_flow() {
        let state = setup_test_state().await;
        let session = state.create_session("user_active", "{\"can_view_reports\":true}").await.unwrap();
        let token = session.qr_payload.split("&token=").nth(1).unwrap();

        let app = create_router(state);

        // 1. Health check (unauthenticated)
        let response = app
            .clone()
            .oneshot(Request::builder().uri("/api/pairing/health").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        // 2. Pair request with correct token
        let pair_payload = serde_json::json!({
            "sessionId": session.session_id,
            "token": token,
            "deviceLabel": "Worker Phone",
            "deviceType": "android"
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/pairing/pair")
                    .header("content-type", "application/json")
                    .body(Body::from(pair_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        let status = response.status();
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let body_str = String::from_utf8_lossy(&body_bytes);
        assert_eq!(status, StatusCode::OK, "Response body: {}", body_str);
        let pair_res: Value = serde_json::from_slice(&body_bytes).unwrap();
        let credential = pair_res["credential"].as_str().unwrap();

        // 3. Authenticated request /api/v1/devices/me
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/v1/devices/me")
                    .header("authorization", format!("Bearer {}", credential))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        // 4. Missing or garbage credential returns 401
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/v1/devices/me")
                    .header("authorization", "Bearer invalid_token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn test_block_remove_and_null_credential_hash_rejection() {
        let state = setup_test_state().await;
        let app = create_router(Arc::clone(&state));

        // Insert pre-migration row with NULL credential_hash
        sqlx::query(
            r#"
            INSERT INTO paired_device (id, workspace_id, branch_id, user_id, device_label, device_type, status, permissions_json, credential_hash, paired_at, updated_at)
            VALUES ('dev_null', 'ws_1', 'br_1', 'user_active', 'Old Dev', 'android', 'active', '{}', NULL, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')
            "#,
        )
        .execute(&state.pool)
        .await
        .unwrap();

        // Try authenticating with any token (should fail because credential_hash is NULL)
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/v1/devices/me")
                    .header("authorization", "Bearer some_token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

        // Pair a valid device
        let session = state.create_session("user_active", "{}").await.unwrap();
        let token = session.qr_payload.split("&token=").nth(1).unwrap();
        let pair_payload = serde_json::json!({
            "sessionId": session.session_id,
            "token": token,
            "deviceLabel": "Active Dev",
            "deviceType": "android"
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/pairing/pair")
                    .header("content-type", "application/json")
                    .body(Body::from(pair_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let pair_res: Value = serde_json::from_slice(&body_bytes).unwrap();
        let credential = pair_res["credential"].as_str().unwrap();
        let device_id = pair_res["device"]["id"].as_str().unwrap();

        // Verify success
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/v1/devices/me")
                    .header("authorization", format!("Bearer {}", credential))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        // Block device immediately in DB
        device_repo::update_device_status(&state.pool, "ws_010101", device_id, "blocked").await.unwrap();

        // Next request should be forbidden immediately without restart
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/v1/devices/me")
                    .header("authorization", format!("Bearer {}", credential))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }
}
