use axum::{
    extract::{Extension, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use sqlx::Row;
use std::sync::Arc;

use crate::auth::AuthContext;
use crate::models::lab::{CollectLabSampleRequest, LabOrder, RecordLabResultRequest};
use crate::services::lab_service::LabService;
use crate::services::lan::{
    auth::AuthedDevice,
    idempotency::{check_idempotency, store_idempotency},
    LanServerState,
};

pub async fn get_lab_orders_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let rows = sqlx::query(
        r#"
        SELECT o.*, t.name as test_name, c.full_name as patient_name
        FROM lab_order o
        LEFT JOIN test_catalog_entry t ON o.test_catalog_id = t.id
        LEFT JOIN customer c ON o.customer_id = c.id
        WHERE o.workspace_id = ? AND o.branch_id = ?
        ORDER BY o.created_at DESC
        "#,
    )
    .bind(&device.workspace_id)
    .bind(&device.branch_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| {
        tracing::warn!(error = %e, "Failed to fetch lab orders");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        )
    })?;

    let orders = rows
        .iter()
        .map(|row| {
            let order = LabOrder {
                id: row.try_get("id").unwrap_or_default(),
                workspace_id: row.try_get("workspace_id").unwrap_or_default(),
                branch_id: row.try_get("branch_id").unwrap_or_default(),
                created_at: row.try_get("created_at").unwrap_or_default(),
                updated_at: row.try_get("updated_at").unwrap_or_default(),
                customer_id: row.try_get("customer_id").unwrap_or_default(),
                sale_id: row.try_get("sale_id").ok().flatten(),
                ordered_by_user_id: row.try_get("ordered_by_user_id").unwrap_or_default(),
                status: row
                    .try_get("status")
                    .unwrap_or_else(|_| "ordered".to_string()),
                test_catalog_id: row.try_get("test_catalog_id").unwrap_or_default(),
            };
            let mut val = serde_json::to_value(order).unwrap();
            if let Some(obj) = val.as_object_mut() {
                obj.insert(
                    "testName".to_string(),
                    json!(row.try_get::<String, _>("test_name").unwrap_or_default()),
                );
                obj.insert(
                    "patientName".to_string(),
                    json!(row.try_get::<String, _>("patient_name").unwrap_or_default()),
                );
            }
            val
        })
        .collect::<Vec<_>>();

    Ok(Json(json!(orders)))
}

pub async fn post_lab_samples_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    headers: HeaderMap,
    Json(payload): Json<CollectLabSampleRequest>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, String)> {
    if let Some(cached) =
        check_idempotency(&state.pool, &device.workspace_id, &headers, "/lab/samples").await?
    {
        return Ok(cached);
    }

    let permissions: Value =
        serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));
    let can_add = permissions
        .get("can_add_lab_sample")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    if !can_add {
        return Err((
            StatusCode::FORBIDDEN,
            "Permission 'can_add_lab_sample' required".to_string(),
        ));
    }

    let ctx = AuthContext {
        user_id: device.user_id.clone(),
        workspace_id: device.workspace_id.clone(),
        branch_id: device.branch_id.clone(),
    };

    let sample = LabService::collect_sample(&state.pool, &ctx, payload)
        .await
        .map_err(|e| {
            tracing::warn!(error = %e, "Failed to collect lab sample");
            if e.contains("status") || e.contains("invalid") || e.contains("not found") {
                (StatusCode::CONFLICT, e)
            } else {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                )
            }
        })?;

    let response_body = serde_json::to_value(sample).unwrap();
    store_idempotency(
        &state.pool,
        &device.workspace_id,
        &headers,
        "/lab/samples",
        StatusCode::CREATED,
        &response_body,
    )
    .await;

    Ok((StatusCode::CREATED, Json(response_body)))
}

pub async fn post_lab_results_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    headers: HeaderMap,
    Json(payload): Json<RecordLabResultRequest>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, String)> {
    if let Some(cached) =
        check_idempotency(&state.pool, &device.workspace_id, &headers, "/lab/results").await?
    {
        return Ok(cached);
    }

    let permissions: Value =
        serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));
    let can_record = permissions
        .get("can_record_lab_result")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    if !can_record {
        return Err((
            StatusCode::FORBIDDEN,
            "Permission 'can_record_lab_result' required".to_string(),
        ));
    }

    let ctx = AuthContext {
        user_id: device.user_id.clone(),
        workspace_id: device.workspace_id.clone(),
        branch_id: device.branch_id.clone(),
    };

    LabService::record_result(&state.pool, &ctx, payload)
        .await
        .map_err(|e| {
            tracing::warn!(error = %e, "Failed to record lab result");
            if e.contains("status") || e.contains("invalid") || e.contains("not found") {
                (StatusCode::CONFLICT, e)
            } else {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                )
            }
        })?;

    let response_body = json!({ "status": "ok" });
    store_idempotency(
        &state.pool,
        &device.workspace_id,
        &headers,
        "/lab/results",
        StatusCode::OK,
        &response_body,
    )
    .await;

    Ok((StatusCode::OK, Json(response_body)))
}
