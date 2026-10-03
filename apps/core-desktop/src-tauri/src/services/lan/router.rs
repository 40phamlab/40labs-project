use axum::{
    extract::{Extension, State, Path, Query},
    http::{StatusCode, HeaderMap},
    middleware,
    routing::{get, post, patch},
    Json, Router,
};
use serde_json::{json, Value};
use sqlx::Row;
use std::sync::Arc;
use std::collections::HashMap;
use uuid::Uuid;

use super::{pairing, auth::{AuthedDevice, auth_middleware}, LanServerState};
use crate::models::staff_notification::{StaffNotification, CreateStaffNotificationPayload};
use crate::repositories::staff_notification_repo::StaffNotificationRepository;
use crate::models::audit::AuditLogEntry;
use crate::repositories::audit_repo::AuditRepository;

pub async fn devices_me_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
) -> Json<Value> {
    let mut permissions: Value = serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));

    if let Some(obj) = permissions.as_object_mut() {
        obj.entry("can_view_stock").or_insert(json!(true));
        obj.entry("can_create_sale").or_insert(json!(true));
        obj.entry("can_manage_customers").or_insert(json!(true));
        obj.entry("can_record_lab_result").or_insert(json!(true));
        obj.entry("can_send_notifications").or_insert(json!(true));
    }

    let user_record = sqlx::query("SELECT id, full_name, role FROM app_user WHERE id = ?")
        .bind(&device.user_id)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();

    let user_info = match user_record {
        Some(u) => {
            let id: String = u.get("id");
            let full_name: String = u.get("full_name");
            let role: String = u.get("role");
            json!({
                "id": id,
                "name": full_name,
                "role": role
            })
        }
        None => json!({
            "id": device.user_id,
            "name": "Assigned Staff",
            "role": "staff"
        }),
    };

    Json(json!({
        "device": {
            "id": device.id,
            "deviceLabel": device.device_label,
            "deviceType": device.device_type,
            "status": device.status
        },
        "permissions": permissions,
        "user": user_info,
        "businessName": "40Labs Pharmacy"
    }))
}

pub async fn staff_roster_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(_auth): Extension<AuthedDevice>,
) -> Json<Value> {
    let staff_rows = sqlx::query("SELECT id, full_name, role FROM app_user WHERE active = 1")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let roster: Vec<Value> = staff_rows
        .into_iter()
        .map(|row| {
            let id: String = row.get("id");
            let full_name: String = row.get("full_name");
            let role: String = row.get("role");
            json!({
                "id": id,
                "displayName": full_name,
                "jobRole": role
            })
        })
        .collect();

    Json(json!(roster))
}

pub async fn summary_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(_auth): Extension<AuthedDevice>,
) -> Json<Value> {
    let today_date_row = sqlx::query("SELECT date('now', '+3 hours') as dt")
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();

    let today_str = today_date_row
        .and_then(|r| r.try_get::<String, _>("dt").ok())
        .unwrap_or_else(|| "2026-10-02".to_string());

    let sales_row = sqlx::query("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as total FROM sale WHERE date(created_at, '+3 hours') = ?")
        .bind(&today_str)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let sales_total: i64 = sales_row.as_ref().and_then(|r| r.try_get("total").ok()).unwrap_or(0);

    let patients_row = sqlx::query("SELECT COUNT(*) as cnt FROM customer WHERE date(created_at, '+3 hours') = ?")
        .bind(&today_str)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let patients_count: i64 = patients_row.and_then(|r| r.try_get("cnt").ok()).unwrap_or(0);

    let samples_row = sqlx::query("SELECT COUNT(*) as cnt FROM lab_sample WHERE date(created_at, '+3 hours') = ?")
        .bind(&today_str)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let samples_count: i64 = samples_row.and_then(|r| r.try_get("cnt").ok()).unwrap_or(0);

    let results_row = sqlx::query("SELECT COUNT(*) as cnt FROM lab_order WHERE status = 'completed' AND date(updated_at, '+3 hours') = ?")
        .bind(&today_str)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let results_count: i64 = results_row.and_then(|r| r.try_get("cnt").ok()).unwrap_or(0);

    let low_stock_row = sqlx::query("SELECT COUNT(*) as cnt FROM inventory_item WHERE quantity <= min_stock_level")
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let low_stock_count: i64 = low_stock_row.and_then(|r| r.try_get("cnt").ok()).unwrap_or(0);

    Json(json!({
        "sales": sales_total,
        "patients": patients_count,
        "samples": samples_count,
        "results": results_count,
        "lowStockCount": low_stock_count,
        "alerts": 0,
        "unreadNotifications": 0
    }))
}

pub async fn activity_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
) -> Json<Value> {
    let user_id = device.user_id;

    let sales = sqlx::query("SELECT id, total_amount, created_at FROM sale WHERE user_id = ? AND created_at >= datetime('now', '-30 days') ORDER BY created_at DESC LIMIT 50")
        .bind(&user_id)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let patients = sqlx::query("SELECT id, full_name, created_at FROM customer WHERE created_at >= datetime('now', '-30 days') ORDER BY created_at DESC LIMIT 50")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let samples = sqlx::query("SELECT id, sample_type, created_at FROM lab_sample WHERE created_at >= datetime('now', '-30 days') ORDER BY created_at DESC LIMIT 50")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let mut items: Vec<Value> = Vec::new();

    for row in sales {
        let id: String = row.get("id");
        let total: i64 = row.get("total_amount");
        let created_at: String = row.get("created_at");
        items.push(json!({
            "id": format!("sale-{}", id),
            "type": "sale",
            "title": "Sale Completed",
            "subject": format!("TZS {}", total),
            "createdAt": created_at,
            "status": "done"
        }));
    }

    for row in patients {
        let id: String = row.get("id");
        let name: String = row.get("full_name");
        let created_at: String = row.get("created_at");
        items.push(json!({
            "id": format!("patient-{}", id),
            "type": "patient_added",
            "title": "Patient Added",
            "subject": name,
            "createdAt": created_at,
            "status": "done"
        }));
    }

    for row in samples {
        let id: String = row.get("id");
        let stype: String = row.get("sample_type");
        let created_at: String = row.get("created_at");
        items.push(json!({
            "id": format!("sample-{}", id),
            "type": "lab_sample",
            "title": "Lab Sample Collected",
            "subject": stype,
            "createdAt": created_at,
            "status": "done"
        }));
    }

    items.sort_by(|a, b| {
        let a_time = a.get("createdAt").and_then(|v| v.as_str()).unwrap_or("");
        let b_time = b.get("createdAt").and_then(|v| v.as_str()).unwrap_or("");
        b_time.cmp(a_time)
    });

    Json(json!({
        "items": items,
        "nextCursor": null
    }))
}

pub async fn heartbeat_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
) -> Json<Value> {
    let _ = crate::repositories::device_repo::update_last_connected(&state.pool, &device.id).await;
    Json(json!({
        "status": "ok",
        "deviceId": device.id,
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

pub async fn get_staff_notifications_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let cursor = params.get("cursor").map(|s| s.as_str());
    let limit = params.get("limit")
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(50);

    let user_row = sqlx::query("SELECT role, workspace_id, branch_id FROM app_user WHERE id = ?")
        .bind(&device.user_id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let (user_role, workspace_id, branch_id) = match user_row {
        Some(r) => {
            let role: String = r.get("role");
            let ws: String = r.get("workspace_id");
            let br: String = r.get("branch_id");
            (role, ws, br)
        }
        None => ("staff".to_string(), device.workspace_id.clone(), device.branch_id.clone()),
    };

    let items = StaffNotificationRepository::list_for_user(
        &state.pool,
        &workspace_id,
        &branch_id,
        &device.user_id,
        &user_role,
        cursor,
        limit,
    )
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let next_cursor = if items.len() as i64 >= limit {
        items.last().map(|i| i.created_at.clone())
    } else {
        None
    };

    Ok(Json(json!({
        "items": items,
        "nextCursor": next_cursor
    })))
}

pub async fn post_staff_notification_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    headers: HeaderMap,
    Json(payload): Json<CreateStaffNotificationPayload>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, String)> {
    let idempotency_key = headers.get("idempotency-key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    if let Some(ref key) = idempotency_key {
        if let Ok(Some(existing)) = StaffNotificationRepository::get_by_id(&state.pool, key, &device.user_id).await {
            return Ok((StatusCode::OK, Json(serde_json::to_value(existing).unwrap())));
        }
    }

    let needs_permission = matches!(payload.audience.as_str(), "broadcast" | "role" | "alert")
        || payload.severity.as_deref() == Some("alert");

    if needs_permission {
        let permissions: Value = serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));
        let can_send = permissions.get("can_send_notifications")
            .and_then(|v| v.as_bool())
            .unwrap_or(true);
        if !can_send {
            return Err((StatusCode::FORBIDDEN, "Permission 'can_send_notifications' required".to_string()));
        }
    }

    let user_row = sqlx::query("SELECT full_name, workspace_id, branch_id FROM app_user WHERE id = ?")
        .bind(&device.user_id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let (sender_name, workspace_id, branch_id) = match user_row {
        Some(r) => {
            let name: String = r.get("full_name");
            let ws: String = r.get("workspace_id");
            let br: String = r.get("branch_id");
            (name, ws, br)
        }
        None => ("Staff User".to_string(), device.workspace_id.clone(), device.branch_id.clone()),
    };

    let notification_id = idempotency_key.unwrap_or_else(|| format!("notif_{}", Uuid::new_v4().simple()));
    let now = chrono::Utc::now().to_rfc3339();
    let severity = payload.severity.unwrap_or_else(|| {
        if payload.audience == "alert" { "alert".to_string() } else { "info".to_string() }
    });

    let notification = StaffNotification {
        id: notification_id.clone(),
        workspace_id: workspace_id.clone(),
        branch_id: branch_id.clone(),
        sender_user_id: device.user_id.clone(),
        sender_name,
        audience: payload.audience.clone(),
        target_role: payload.target_role,
        target_user_id: payload.target_user_id,
        severity: severity.clone(),
        subject: payload.subject,
        body: payload.body,
        created_at: now.clone(),
        is_read: false,
    };

    StaffNotificationRepository::create(&state.pool, &notification)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if payload.audience == "broadcast" || payload.audience == "alert" || severity == "alert" {
        let audit_action = if payload.audience == "alert" || severity == "alert" {
            "SEND_ALERT_NOTIFICATION"
        } else {
            "SEND_BROADCAST_NOTIFICATION"
        };

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id,
            branch_id,
            created_at: now,
            action: audit_action.to_string(),
            performed_by_user_id: device.user_id.clone(),
            target_entity_type: "staff_notification".to_string(),
            target_entity_id: notification_id,
            metadata: Some(json!({
                "audience": payload.audience,
                "severity": severity
            }).to_string()),
        };

        let _ = AuditRepository::create(&state.pool, &audit_entry).await;
    }

    Ok((StatusCode::CREATED, Json(serde_json::to_value(notification).unwrap())))
}

pub async fn patch_staff_notification_read_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    Path(id): Path<String>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let read_at = StaffNotificationRepository::mark_as_read(&state.pool, &id, &device.user_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(json!({
        "status": "ok",
        "id": id,
        "readAt": read_at
    })))
}

pub fn create_router(state: Arc<LanServerState>) -> Router {
    let protected_routes = Router::new()
        .route("/devices/me", get(devices_me_handler))
        .route("/devices/me/heartbeat", post(heartbeat_handler))
        .route("/staff/roster", get(staff_roster_handler))
        .route("/me/summary", get(summary_handler))
        .route("/activity", get(activity_handler))
        .route("/staff-notifications", get(get_staff_notifications_handler).post(post_staff_notification_handler))
        .route("/staff-notifications/:id/read", patch(patch_staff_notification_read_handler))
        .route_layer(middleware::from_fn_with_state(
            Arc::clone(&state),
            auth_middleware,
        ));

    Router::new()
        .route("/api/pairing/health", get(pairing::health_handler))
        .route("/api/pairing/pair", post(pairing::pair_handler))
        .nest("/api/v1", protected_routes)
        .with_state(state)
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

    async fn setup_test_state() -> Arc<LanServerState> {
        let pool = SqlitePoolOptions::new()
            .connect("sqlite::memory:")
            .await
            .unwrap();

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS app_user (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                branch_id TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL,
                pin_hash TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS paired_device (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                branch_id TEXT NOT NULL,
                user_id TEXT NOT NULL REFERENCES app_user(id),
                device_label TEXT NOT NULL,
                device_type TEXT NOT NULL,
                status TEXT NOT NULL,
                permissions_json TEXT NOT NULL,
                credential_hash TEXT,
                last_connected_at TEXT,
                paired_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS audit_log (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                branch_id TEXT NOT NULL,
                action TEXT NOT NULL,
                performed_by_user_id TEXT NOT NULL,
                target_entity_type TEXT NOT NULL,
                target_entity_id TEXT NOT NULL,
                metadata TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS staff_notifications (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                branch_id TEXT NOT NULL,
                sender_user_id TEXT NOT NULL,
                sender_name TEXT NOT NULL,
                audience TEXT NOT NULL,
                target_role TEXT,
                target_user_id TEXT,
                severity TEXT NOT NULL,
                subject TEXT NOT NULL,
                body TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS staff_notification_reads (
                id TEXT PRIMARY KEY,
                notification_id TEXT NOT NULL REFERENCES staff_notifications(id),
                user_id TEXT NOT NULL,
                read_at TEXT NOT NULL,
                UNIQUE(notification_id, user_id)
            );
            "#,
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            r#"
            INSERT INTO app_user (id, workspace_id, branch_id, full_name, role, pin_hash, active, created_at, updated_at)
            VALUES
                ('user_pharm', 'ws_1', 'br_1', 'Dr. Pharmacist', 'pharmacist', 'hash', 1, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'),
                ('user_cashier', 'ws_1', 'br_1', 'Alice Cashier', 'cashier', 'hash', 1, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')
            "#,
        )
        .execute(&pool)
        .await
        .unwrap();

        Arc::new(LanServerState::new(pool, 4040))
    }

    #[tokio::test]
    async fn test_staff_notifications_comprehensive() {
        let state = setup_test_state().await;
        let app = create_router(Arc::clone(&state));

        // Pair pharmacist (can_send_notifications: true)
        let session_pharm = state.create_session("user_pharm", "{\"can_send_notifications\":true}").await.unwrap();
        let token_pharm = session_pharm.qr_payload.split("&token=").nth(1).unwrap();
        let res = app.clone().oneshot(
            Request::builder().method("POST").uri("/api/pairing/pair")
                .header("content-type", "application/json")
                .body(Body::from(serde_json::json!({
                    "sessionId": session_pharm.session_id,
                    "token": token_pharm,
                    "deviceLabel": "Pharm Phone",
                    "deviceType": "android"
                }).to_string())).unwrap()
        ).await.unwrap();
        let body_bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
        let cred_pharm = serde_json::from_slice::<Value>(&body_bytes).unwrap()["credential"].as_str().unwrap().to_string();

        // Pair cashier (can_send_notifications: false)
        let session_cashier = state.create_session("user_cashier", "{\"can_send_notifications\":false}").await.unwrap();
        let token_cashier = session_cashier.qr_payload.split("&token=").nth(1).unwrap();
        let res = app.clone().oneshot(
            Request::builder().method("POST").uri("/api/pairing/pair")
                .header("content-type", "application/json")
                .body(Body::from(serde_json::json!({
                    "sessionId": session_cashier.session_id,
                    "token": token_cashier,
                    "deviceLabel": "Cashier Phone",
                    "deviceType": "android"
                }).to_string())).unwrap()
        ).await.unwrap();
        let body_bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
        let cred_cashier = serde_json::from_slice::<Value>(&body_bytes).unwrap()["credential"].as_str().unwrap().to_string();

        // 1. Cashier tries to post broadcast notification -> 403 Forbidden (no permission)
        let res = app.clone().oneshot(
            Request::builder().method("POST").uri("/api/v1/staff-notifications")
                .header("authorization", format!("Bearer {}", cred_cashier))
                .header("content-type", "application/json")
                .body(Body::from(serde_json::json!({
                    "audience": "broadcast",
                    "subject": "Hello",
                    "body": "World"
                }).to_string())).unwrap()
        ).await.unwrap();
        assert_eq!(res.status(), StatusCode::FORBIDDEN);

        // 2. Cashier posts direct notification -> 201 Created (direct doesn't require can_send_notifications)
        let res = app.clone().oneshot(
            Request::builder().method("POST").uri("/api/v1/staff-notifications")
                .header("authorization", format!("Bearer {}", cred_cashier))
                .header("content-type", "application/json")
                .body(Body::from(serde_json::json!({
                    "audience": "direct",
                    "targetUserId": "user_pharm",
                    "subject": "Question",
                    "body": "Stock check?"
                }).to_string())).unwrap()
        ).await.unwrap();
        assert_eq!(res.status(), StatusCode::CREATED);

        // 3. Pharmacist posts broadcast notification with Idempotency-Key
        let idempotency_id = "notif_test_123";
        let res = app.clone().oneshot(
            Request::builder().method("POST").uri("/api/v1/staff-notifications")
                .header("authorization", format!("Bearer {}", cred_pharm))
                .header("idempotency-key", idempotency_id)
                .header("content-type", "application/json")
                .body(Body::from(serde_json::json!({
                    "audience": "broadcast",
                    "subject": "System Update",
                    "body": "System will restart tonight."
                }).to_string())).unwrap()
        ).await.unwrap();
        assert_eq!(res.status(), StatusCode::CREATED);

        // 4. Re-post same notification with same Idempotency-Key -> 200 OK (idempotent replay)
        let res = app.clone().oneshot(
            Request::builder().method("POST").uri("/api/v1/staff-notifications")
                .header("authorization", format!("Bearer {}", cred_pharm))
                .header("idempotency-key", idempotency_id)
                .header("content-type", "application/json")
                .body(Body::from(serde_json::json!({
                    "audience": "broadcast",
                    "subject": "System Update",
                    "body": "System will restart tonight."
                }).to_string())).unwrap()
        ).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);

        // 5. Pharmacist posts role-based notification for 'pharmacist'
        let res = app.clone().oneshot(
            Request::builder().method("POST").uri("/api/v1/staff-notifications")
                .header("authorization", format!("Bearer {}", cred_pharm))
                .header("content-type", "application/json")
                .body(Body::from(serde_json::json!({
                    "audience": "role",
                    "targetRole": "pharmacist",
                    "subject": "Rx Check",
                    "body": "Review pending scripts."
                }).to_string())).unwrap()
        ).await.unwrap();
        assert_eq!(res.status(), StatusCode::CREATED);

        // 6. Cashier fetches notifications -> should see broadcast and direct (to or from user), but NOT pharmacist role notification
        let res = app.clone().oneshot(
            Request::builder().uri("/api/v1/staff-notifications")
                .header("authorization", format!("Bearer {}", cred_cashier))
                .body(Body::empty()).unwrap()
        ).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let body_bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
        let json_res: Value = serde_json::from_slice(&body_bytes).unwrap();
        let items = json_res["items"].as_array().unwrap();
        assert!(items.iter().any(|i| i["subject"] == "System Update"));
        assert!(items.iter().any(|i| i["subject"] == "Question"));
        assert!(!items.iter().any(|i| i["subject"] == "Rx Check"));

        // 7. Mark broadcast notification as read
        let notif_id = items.iter().find(|i| i["subject"] == "System Update").unwrap()["id"].as_str().unwrap();
        let res = app.clone().oneshot(
            Request::builder().method("PATCH").uri(format!("/api/v1/staff-notifications/{}/read", notif_id))
                .header("authorization", format!("Bearer {}", cred_cashier))
                .body(Body::empty()).unwrap()
        ).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);

        // 8. Fetch notifications again and verify isRead is true
        let res = app.clone().oneshot(
            Request::builder().uri("/api/v1/staff-notifications")
                .header("authorization", format!("Bearer {}", cred_cashier))
                .body(Body::empty()).unwrap()
        ).await.unwrap();
        let body_bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
        let json_res: Value = serde_json::from_slice(&body_bytes).unwrap();
        let items = json_res["items"].as_array().unwrap();
        let read_item = items.iter().find(|i| i["id"] == notif_id).unwrap();
        assert_eq!(read_item["isRead"], true);
    }
}
