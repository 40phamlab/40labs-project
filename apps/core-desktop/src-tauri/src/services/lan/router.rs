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
use crate::auth::AuthContext;
use crate::models::staff_notification::{StaffNotification, CreateStaffNotificationPayload};
use crate::repositories::staff_notification_repo::StaffNotificationRepository;
use crate::models::audit::AuditLogEntry;
use crate::repositories::audit_repo::AuditRepository;
use crate::models::inventory::AddStockRequest;
use crate::services::inventory_service::InventoryService;
use crate::repositories::inventory_repo::InventoryRepository;
use crate::models::lab::{CollectLabSampleRequest, RecordLabResultRequest};
use crate::services::lab_service::LabService;
use crate::repositories::lab_repo::LabRepository;
use crate::models::customers::AddCustomerRequest;
use crate::services::customer_service::CustomerService;
use crate::repositories::customer_repo::CustomerRepository;
use crate::models::sales::CreateSaleRequest;
use crate::services::sales_service::SalesService;
use crate::repositories::sales_repo::SalesRepository;

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
        obj.entry("can_add_lab_sample").or_insert(json!(true));
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

    let low_stock_row = sqlx::query("SELECT COUNT(*) as cnt FROM inventory_item WHERE quantity <= low_stock_threshold")
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();
    let low_stock_count: i64 = low_stock_row.and_then(|r| r.try_get("cnt").ok()).unwrap_or(0);

    let user_row = sqlx::query("SELECT role, workspace_id, branch_id FROM app_user WHERE id = ?")
        .bind(&device.user_id)
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten();

    let (user_role, workspace_id, branch_id) = match user_row {
        Some(r) => {
            let role: String = r.get("role");
            let ws: String = r.get("workspace_id");
            let br: String = r.get("branch_id");
            (role, ws, br)
        }
        None => ("staff".to_string(), device.workspace_id.clone(), device.branch_id.clone()),
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

    Json(json!({
        "sales": sales_total,
        "patients": patients_count,
        "samples": samples_count,
        "results": results_count,
        "lowStockCount": low_stock_count,
        "alerts": alerts_count,
        "unreadNotifications": unread_count
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
        let total: i64 = row.get("grand_total");
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
    let _ = crate::repositories::device_repo::update_last_connected(&state.pool, &device.workspace_id, &device.id).await;
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
            performed_by_user_id: Some(device.user_id.clone()),
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

pub async fn get_stock_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let items = InventoryRepository::list_medicines_with_inventory(&state.pool, &device.workspace_id, false)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let search = params.get("search").map(|s| s.to_lowercase());
    let low_stock_only = params.get("lowStock").map(|s| s == "true").unwrap_or(false);

    let filtered: Vec<_> = items.into_iter().filter(|item| {
        if low_stock_only && item.inventory_item.quantity > item.inventory_item.low_stock_threshold {
            return false;
        }
        if let Some(ref q) = search {
            let name_match = item.medicine.name.to_lowercase().contains(q);
            let generic_match = item.medicine.generic_name.as_deref().unwrap_or("").to_lowercase().contains(q);
            let batch_match = item.inventory_item.batch_number.to_lowercase().contains(q);
            if !name_match && !generic_match && !batch_match {
                return false;
            }
        }
        true
    }).collect();

    Ok(Json(json!(filtered)))
}

pub async fn get_stock_item_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    Path(id): Path<String>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let item = InventoryRepository::get_inventory_item_by_id(&state.pool, &device.workspace_id, &id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or_else(|| (StatusCode::NOT_FOUND, "Stock item not found".to_string()))?;

    Ok(Json(json!(item)))
}

pub async fn post_stock_receipt_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    _headers: HeaderMap,
    Json(payload): Json<AddStockRequest>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, String)> {
    let permissions: Value = serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));
    let can_update = permissions.get("can_update_stock")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    if !can_update {
        return Err((StatusCode::FORBIDDEN, "Permission 'can_update_stock' required".to_string()));
    }

    let ctx = AuthContext {
        user_id: device.user_id.clone(),
        workspace_id: device.workspace_id.clone(),
        branch_id: device.branch_id.clone(),
    };

    let result = InventoryService::add_stock(&state.pool, &ctx, payload)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    Ok((StatusCode::CREATED, Json(serde_json::to_value(result).unwrap())))
}

pub async fn get_lab_orders_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let orders = LabRepository::list_orders(&state.pool, &device.workspace_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(json!(orders)))
}

pub async fn post_lab_samples_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    _headers: HeaderMap,
    Json(payload): Json<CollectLabSampleRequest>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, String)> {
    let permissions: Value = serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));
    let can_add = permissions.get("can_add_lab_sample")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    if !can_add {
        return Err((StatusCode::FORBIDDEN, "Permission 'can_add_lab_sample' required".to_string()));
    }

    let ctx = AuthContext {
        user_id: device.user_id.clone(),
        workspace_id: device.workspace_id.clone(),
        branch_id: device.branch_id.clone(),
    };

    let sample = LabService::collect_sample(&state.pool, &ctx, payload)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    Ok((StatusCode::CREATED, Json(serde_json::to_value(sample).unwrap())))
}

pub async fn post_lab_results_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    _headers: HeaderMap,
    Json(payload): Json<RecordLabResultRequest>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, String)> {
    let permissions: Value = serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));
    let can_record = permissions.get("can_record_lab_result")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    if !can_record {
        return Err((StatusCode::FORBIDDEN, "Permission 'can_record_lab_result' required".to_string()));
    }

    let ctx = AuthContext {
        user_id: device.user_id.clone(),
        workspace_id: device.workspace_id.clone(),
        branch_id: device.branch_id.clone(),
    };

    LabService::record_result(&state.pool, &ctx, payload)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    Ok((StatusCode::OK, Json(json!({ "status": "ok" }))))
}

pub async fn get_customers_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let customers = CustomerRepository::list(&state.pool, &device.workspace_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let search = params.get("search").map(|s| s.to_lowercase());
    let filtered: Vec<_> = customers.into_iter().filter(|c| {
        if let Some(ref q) = search {
            let name_match = c.full_name.to_lowercase().contains(q);
            let phone_match = c.phone.contains(q);
            if !name_match && !phone_match {
                return false;
            }
        }
        true
    }).collect();

    Ok(Json(json!(filtered)))
}

pub async fn post_customers_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    _headers: HeaderMap,
    Json(payload): Json<AddCustomerRequest>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, String)> {
    let permissions: Value = serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));
    let can_manage = permissions.get("can_manage_customers")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    if !can_manage {
        return Err((StatusCode::FORBIDDEN, "Permission 'can_manage_customers' required".to_string()));
    }

    let ctx = AuthContext {
        user_id: device.user_id.clone(),
        workspace_id: device.workspace_id.clone(),
        branch_id: device.branch_id.clone(),
    };

    match CustomerService::create_customer(&state.pool, &ctx, payload).await {
        Ok(cust) => Ok((StatusCode::CREATED, Json(serde_json::to_value(cust).unwrap()))),
        Err(err) if err.starts_with("CONFLICT_DUPLICATE_PHONE:") => {
            let json_data = &err["CONFLICT_DUPLICATE_PHONE:".len()..];
            let existing_cust: Value = serde_json::from_str(json_data).unwrap_or(json!({}));
            Ok((StatusCode::CONFLICT, Json(json!({
                "error": "Customer with this phone number already exists",
                "existingCustomer": existing_cust
            }))))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn post_sales_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    headers: HeaderMap,
    Json(payload): Json<CreateSaleRequest>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, String)> {
    let permissions: Value = serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));
    let can_create = permissions.get("can_create_sale")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    if !can_create {
        return Err((StatusCode::FORBIDDEN, "Permission 'can_create_sale' required".to_string()));
    }

    let idempotency_key = headers.get("idempotency-key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .ok_or_else(|| (StatusCode::BAD_REQUEST, "Missing Idempotency-Key header".to_string()))?;

    if let Ok(Some(existing)) = SalesRepository::get_by_idempotency_key(&state.pool, &device.workspace_id, &idempotency_key).await {
        return Ok((StatusCode::OK, Json(serde_json::to_value(existing).unwrap())));
    }

    let ctx = AuthContext {
        user_id: device.user_id.clone(),
        workspace_id: device.workspace_id.clone(),
        branch_id: device.branch_id.clone(),
    };

    let sale = SalesService::create_sale(&state.pool, &ctx, payload, None, Some(idempotency_key))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    Ok((StatusCode::CREATED, Json(serde_json::to_value(sale).unwrap())))
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
        .route("/stock", get(get_stock_handler))
        .route("/stock/:id", get(get_stock_item_handler))
        .route("/stock/receipts", post(post_stock_receipt_handler))
        .route("/lab/orders", get(get_lab_orders_handler))
        .route("/lab/samples", post(post_lab_samples_handler))
        .route("/lab/results", post(post_lab_results_handler))
        .route("/customers", get(get_customers_handler).post(post_customers_handler))
        .route("/sales", post(post_sales_handler))
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
