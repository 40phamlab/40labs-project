use axum::{
    extract::{Extension, Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use sqlx::Row;
use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

use crate::models::audit::AuditLogEntry;
use crate::models::staff_notification::{CreateStaffNotificationPayload, StaffNotification};
use crate::repositories::audit_repo::AuditRepository;
use crate::repositories::staff_notification_repo::StaffNotificationRepository;
use crate::services::lan::{auth::AuthedDevice, LanServerState};

pub async fn summary_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
) -> Json<Value> {
    let today_date_row = sqlx::query("SELECT date('now', '+3 hours') as dt")
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();

    let today_str = today_date_row
        .and_then(|r| r.try_get::<String, _>("dt").ok())
        .unwrap_or_else(|| "2026-10-02".to_string());

    let sales_row = sqlx::query("SELECT COUNT(*) as cnt, COALESCE(SUM(grand_total), 0) as total FROM sale WHERE date(created_at, '+3 hours') = ?")
        .bind(&today_str)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let sales_total: i64 = sales_row
        .as_ref()
        .and_then(|r| r.try_get("total").ok())
        .unwrap_or(0);

    let patients_row =
        sqlx::query("SELECT COUNT(*) as cnt FROM customer WHERE date(created_at, '+3 hours') = ?")
            .bind(&today_str)
            .fetch_optional(&state.pool)
            .await
            .ok()
            .flatten();
    let patients_count: i64 = patients_row
        .and_then(|r| r.try_get("cnt").ok())
        .unwrap_or(0);

    let total_patients_row = sqlx::query("SELECT COUNT(*) as cnt FROM customer")
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let total_patients_count: i64 = total_patients_row
        .and_then(|r| r.try_get("cnt").ok())
        .unwrap_or(0);

    let samples_row = sqlx::query(
        "SELECT COUNT(*) as cnt FROM lab_sample WHERE date(created_at, '+3 hours') = ?",
    )
    .bind(&today_str)
    .fetch_optional(&state.pool)
    .await
    .ok()
    .flatten();
    let samples_count: i64 = samples_row.and_then(|r| r.try_get("cnt").ok()).unwrap_or(0);

    let pending_samples_row = sqlx::query(
        "SELECT COUNT(*) as cnt FROM lab_order WHERE status IN ('ordered', 'sample_collected')",
    )
    .fetch_optional(&state.pool)
    .await
    .ok()
    .flatten();
    let pending_samples_count: i64 = pending_samples_row
        .and_then(|r| r.try_get("cnt").ok())
        .unwrap_or(0);

    let total_samples_row = sqlx::query("SELECT COUNT(*) as cnt FROM lab_sample")
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let total_samples_count: i64 = total_samples_row
        .and_then(|r| r.try_get("cnt").ok())
        .unwrap_or(0);

    let results_row = sqlx::query("SELECT COUNT(*) as cnt FROM lab_order WHERE status = 'completed' AND date(updated_at, '+3 hours') = ?")
        .bind(&today_str)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let results_count: i64 = results_row.and_then(|r| r.try_get("cnt").ok()).unwrap_or(0);

    let low_stock_row = sqlx::query(
        "SELECT COUNT(*) as cnt FROM inventory_item WHERE quantity <= low_stock_threshold",
    )
    .fetch_optional(&state.pool)
    .await
    .ok()
    .flatten();
    let low_stock_count: i64 = low_stock_row
        .and_then(|r| r.try_get("cnt").ok())
        .unwrap_or(0);

    let user_row = sqlx::query("SELECT role, workspace_id, branch_id FROM app_user WHERE id = ?")
        .bind(&device.user_id)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();

    let (user_role, workspace_id, branch_id) = match user_row {
        Some(r) => {
            let role: String = r.try_get("role").unwrap_or_else(|_| "staff".to_string());
            let ws: String = r
                .try_get("workspace_id")
                .unwrap_or_else(|_| device.workspace_id.clone());
            let br: String = r
                .try_get("branch_id")
                .unwrap_or_else(|_| device.branch_id.clone());
            (role, ws, br)
        }
        None => (
            "staff".to_string(),
            device.workspace_id.clone(),
            device.branch_id.clone(),
        ),
    };

    let unread_row = sqlx::query(
        r#"
        SELECT COUNT(*) as cnt
        FROM staff_notifications n
        WHERE n.workspace_id = ? AND n.branch_id = ?
          AND (
              n.audience = 'broadcast'
              OR n.audience = 'alert'
              OR n.severity = 'alert'
              OR (n.audience = 'role' AND n.target_role = ?)
              OR (n.audience = 'direct' AND (n.target_user_id = ? OR n.sender_user_id = ?))
          )
          AND NOT EXISTS (SELECT 1 FROM staff_notification_reads r WHERE r.notification_id = n.id AND r.user_id = ?)
        "#
    )
    .bind(&workspace_id)
    .bind(&branch_id)
    .bind(&user_role)
    .bind(&device.user_id)
    .bind(&device.user_id)
    .bind(&device.user_id)
    .fetch_optional(&state.pool)
    .await
    .ok()
    .flatten();

    let unread_count: i64 = unread_row.and_then(|r| r.try_get("cnt").ok()).unwrap_or(0);

    let alerts_row = sqlx::query(
        r#"
        SELECT COUNT(*) as cnt
        FROM staff_notifications n
        WHERE n.workspace_id = ? AND n.branch_id = ?
          AND (n.severity = 'alert' OR n.audience = 'alert')
          AND NOT EXISTS (SELECT 1 FROM staff_notification_reads r WHERE r.notification_id = n.id AND r.user_id = ?)
        "#
    )
    .bind(&workspace_id)
    .bind(&branch_id)
    .bind(&device.user_id)
    .fetch_optional(&state.pool)
    .await
    .ok()
    .flatten();

    let alerts_count: i64 = alerts_row.and_then(|r| r.try_get("cnt").ok()).unwrap_or(0);

    let stock_val_row = sqlx::query(
        "SELECT COALESCE(SUM(quantity * buy_price), 0) as stock_val FROM inventory_item WHERE workspace_id = ? AND branch_id = ? AND is_deactivated = 0",
    )
    .bind(&workspace_id)
    .bind(&branch_id)
    .fetch_optional(&state.pool)
    .await
    .ok()
    .flatten();
    let stock_value: i64 = stock_val_row
        .and_then(|r| r.try_get("stock_val").ok())
        .unwrap_or(0);

    Json(json!({
        "sales": sales_total,
        "patients": patients_count,
        "totalPatients": total_patients_count,
        "samples": samples_count,
        "pendingSamples": pending_samples_count,
        "totalSamples": total_samples_count,
        "results": results_count,
        "lowStockCount": low_stock_count,
        "stockValue": stock_value,
        "alerts": alerts_count,
        "unreadNotifications": unread_count
    }))
}

pub async fn activity_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
) -> Json<Value> {
    let user_id = device.user_id;

    let sales = sqlx::query("SELECT id, grand_total, created_at FROM sale WHERE user_id = ? AND created_at >= datetime('now', '-30 days') ORDER BY created_at DESC LIMIT 50")
        .bind(&user_id)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let patients = sqlx::query("SELECT id, full_name, created_at FROM customer WHERE created_at >= datetime('now', '-30 days') ORDER BY created_at DESC LIMIT 50")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let samples = sqlx::query("SELECT id, sample_label, created_at FROM lab_sample WHERE created_at >= datetime('now', '-30 days') ORDER BY created_at DESC LIMIT 50")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let mut items: Vec<Value> = Vec::new();

    for row in sales {
        let id: String = row.try_get("id").unwrap_or_default();
        let total: i64 = row.try_get("grand_total").unwrap_or(0);
        let created_at: String = row.try_get("created_at").unwrap_or_default();
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
        let id: String = row.try_get("id").unwrap_or_default();
        let name: String = row
            .try_get("full_name")
            .unwrap_or_else(|_| "Unknown Patient".to_string());
        let created_at: String = row.try_get("created_at").unwrap_or_default();
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
        let id: String = row.try_get("id").unwrap_or_default();
        let stype: String = row
            .try_get("sample_label")
            .unwrap_or_else(|_| "Sample".to_string());
        let created_at: String = row.try_get("created_at").unwrap_or_default();
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

pub async fn get_staff_notifications_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let cursor = params.get("cursor").map(|s| s.as_str());
    let limit = params
        .get("limit")
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(50);

    let user_row = sqlx::query("SELECT role, workspace_id, branch_id FROM app_user WHERE id = ?")
        .bind(&device.user_id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| {
            tracing::warn!(error = %e, "Failed to fetch user for notifications");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            )
        })?;

    let (user_role, workspace_id, branch_id) = match user_row {
        Some(r) => {
            let role: String = r.try_get("role").unwrap_or_else(|_| "staff".to_string());
            let ws: String = r
                .try_get("workspace_id")
                .unwrap_or_else(|_| device.workspace_id.clone());
            let br: String = r
                .try_get("branch_id")
                .unwrap_or_else(|_| device.branch_id.clone());
            (role, ws, br)
        }
        None => (
            "staff".to_string(),
            device.workspace_id.clone(),
            device.branch_id.clone(),
        ),
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
    .map_err(|e| {
        tracing::warn!(error = %e, "Failed to list staff notifications");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        )
    })?;

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
    let idempotency_key = headers
        .get("idempotency-key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    if let Some(ref key) = idempotency_key {
        if let Ok(Some(existing)) =
            StaffNotificationRepository::get_by_id(&state.pool, key, &device.user_id).await
        {
            return Ok((
                StatusCode::OK,
                Json(serde_json::to_value(existing).unwrap()),
            ));
        }
    }

    let needs_permission = matches!(payload.audience.as_str(), "broadcast" | "role" | "alert")
        || payload.severity.as_deref() == Some("alert");

    if needs_permission {
        let permissions: Value =
            serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));
        let can_send = permissions
            .get("can_send_notifications")
            .and_then(|v| v.as_bool())
            .unwrap_or(true);
        if !can_send {
            return Err((
                StatusCode::FORBIDDEN,
                "Permission 'can_send_notifications' required".to_string(),
            ));
        }
    }

    let user_row =
        sqlx::query("SELECT full_name, workspace_id, branch_id FROM app_user WHERE id = ?")
            .bind(&device.user_id)
            .fetch_optional(&state.pool)
            .await
            .map_err(|e| {
                tracing::warn!(error = %e, "Failed to fetch user for posting notification");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                )
            })?;

    let (sender_name, workspace_id, branch_id) = match user_row {
        Some(r) => {
            let name: String = r
                .try_get("full_name")
                .unwrap_or_else(|_| "Staff User".to_string());
            let ws: String = r
                .try_get("workspace_id")
                .unwrap_or_else(|_| device.workspace_id.clone());
            let br: String = r
                .try_get("branch_id")
                .unwrap_or_else(|_| device.branch_id.clone());
            (name, ws, br)
        }
        None => (
            "Staff User".to_string(),
            device.workspace_id.clone(),
            device.branch_id.clone(),
        ),
    };

    let notification_id =
        idempotency_key.unwrap_or_else(|| format!("notif_{}", Uuid::new_v4().simple()));
    let now = chrono::Utc::now().to_rfc3339();
    let severity = payload.severity.unwrap_or_else(|| {
        if payload.audience == "alert" {
            "alert".to_string()
        } else {
            "info".to_string()
        }
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
        .map_err(|e| {
            tracing::warn!(error = %e, "Failed to create staff notification");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            )
        })?;

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
            performed_by_user_id: Some(device.user_id.clone()),
            target_entity_type: "staff_notification".to_string(),
            target_entity_id: notification_id,
            metadata: Some(
                json!({
                    "audience": payload.audience,
                    "severity": severity
                })
                .to_string(),
            ),
        };

        let _ = AuditRepository::create(&state.pool, &audit_entry).await;
    }

    Ok((
        StatusCode::CREATED,
        Json(serde_json::to_value(notification).unwrap()),
    ))
}

pub async fn patch_staff_notification_read_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    Path(id): Path<String>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let read_at = StaffNotificationRepository::mark_as_read(&state.pool, &id, &device.user_id)
        .await
        .map_err(|e| {
            tracing::warn!(error = %e, "Failed to mark notification as read");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            )
        })?;

    Ok(Json(json!({
        "status": "ok",
        "id": id,
        "readAt": read_at
    })))
}
