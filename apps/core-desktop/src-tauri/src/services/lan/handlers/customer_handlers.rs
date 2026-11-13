use axum::{
    extract::{Extension, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;

use crate::auth::AuthContext;
use crate::models::customers::AddCustomerRequest;
use crate::repositories::customer_repo::CustomerRepository;
use crate::services::customer_service::CustomerService;
use crate::services::lan::{
    auth::AuthedDevice,
    idempotency::{check_idempotency, store_idempotency},
    LanServerState,
};

pub async fn get_customers_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let customers = CustomerRepository::list(&state.pool, &device.workspace_id)
        .await
        .map_err(|e| {
            tracing::warn!(error = %e, "Failed to list customers");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            )
        })?;

    let search = params.get("search").map(|s| s.to_lowercase());
    let filtered: Vec<_> = customers
        .into_iter()
        .filter(|c| {
            if let Some(ref q) = search {
                let name_match = c.full_name.to_lowercase().contains(q);
                let phone_match = c.phone.contains(q);
                if !name_match && !phone_match {
                    return false;
                }
            }
            true
        })
        .collect();

    Ok(Json(json!(filtered)))
}

pub async fn post_customers_handler(
    State(state): State<Arc<LanServerState>>,
    Extension(AuthedDevice { device }): Extension<AuthedDevice>,
    headers: HeaderMap,
    Json(payload): Json<AddCustomerRequest>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, String)> {
    if let Some(cached) =
        check_idempotency(&state.pool, &device.workspace_id, &headers, "/customers").await?
    {
        return Ok(cached);
    }

    let permissions: Value =
        serde_json::from_str(&device.permissions_json).unwrap_or_else(|_| json!({}));
    let can_manage = permissions
        .get("can_manage_customers")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    if !can_manage {
        return Err((
            StatusCode::FORBIDDEN,
            "Permission 'can_manage_customers' required".to_string(),
        ));
    }

    let ctx = AuthContext {
        user_id: device.user_id.clone(),
        workspace_id: device.workspace_id.clone(),
        branch_id: device.branch_id.clone(),
    };

    match CustomerService::create_customer(&state.pool, &ctx, payload).await {
        Ok(cust) => {
            let response_body = serde_json::to_value(cust).unwrap();
            store_idempotency(
                &state.pool,
                &device.workspace_id,
                &headers,
                "/customers",
                StatusCode::CREATED,
                &response_body,
            )
            .await;
            Ok((StatusCode::CREATED, Json(response_body)))
        }
        Err(err) if err.starts_with("CONFLICT_DUPLICATE_PHONE:") => {
            let json_data = &err["CONFLICT_DUPLICATE_PHONE:".len()..];
            let existing_cust: Value = serde_json::from_str(json_data).unwrap_or(json!({}));
            let response_body = json!({
                "error": "Customer with this phone number already exists",
                "existingCustomer": existing_cust
            });
            store_idempotency(
                &state.pool,
                &device.workspace_id,
                &headers,
                "/customers",
                StatusCode::CONFLICT,
                &response_body,
            )
            .await;
            Ok((StatusCode::CONFLICT, Json(response_body)))
        }
        Err(e) => {
            tracing::warn!(error = %e, "Failed to create customer");
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            ))
        }
    }
}
