use tauri::State;

use crate::auth::{AuthEngine, AuthErrorResponse};
use crate::db::AppState;
use crate::models::inventory::MedicineWithInventory;
use crate::models::lab::{
    CollectLabSampleRequest, CreateLabOrderRequest, CreateLabQcEquipmentRequest,
    CreateLabQcRecordRequest, CreateTestCatalogRequest, EnterLabResultRequest, ExpiryOverrideRequest, LabOrder, LabQcData,
    LabQcEquipment, LabQcRecord, LabResult, LabSample, RecordLabResultRequest, SampleEvent, TestCatalogEntry, UpdateSampleExpiryRequest,
};
use crate::repositories::lab_repo::LabRepository;
use crate::services::lab_service::LabService;

#[tauri::command]
pub async fn get_lab_orders(
    state: State<'_, AppState>,
) -> Result<Vec<LabOrder>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    LabRepository::list_orders(&state.pool, &ctx.workspace_id, &ctx.branch_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn create_lab_order(
    state: State<'_, AppState>,
    payload: CreateLabOrderRequest,
) -> Result<LabOrder, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.order")
        .await
        .map_err(|e| e.to_response())?;
    LabService::create_order(&state.pool, &ctx, payload)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn update_lab_order_status(
    state: State<'_, AppState>,
    id: String,
    status: String,
) -> Result<bool, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.order")
        .await
        .map_err(|e| e.to_response())?;
    LabService::update_order_status(&state.pool, &ctx, &id, &status)
        .await
        .map_err(|e| map_lab_status_error(e).to_response())?;
    Ok(true)
}

#[tauri::command]
pub async fn get_lab_samples(
    state: State<'_, AppState>,
) -> Result<Vec<LabSample>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    LabRepository::list_samples(&state.pool, &ctx.workspace_id, &ctx.branch_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn collect_lab_sample(
    state: State<'_, AppState>,
    payload: CollectLabSampleRequest,
) -> Result<LabSample, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.order")
        .await
        .map_err(|e| e.to_response())?;
    LabService::collect_sample(&state.pool, &ctx, payload)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn update_lab_sample_status(
    state: State<'_, AppState>,
    id: String,
    status: String,
) -> Result<bool, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.result.enter")
        .await
        .map_err(|e| e.to_response())?;
    LabService::update_sample_status(&state.pool, &ctx, &id, &status)
        .await
        .map_err(|e| map_lab_status_error(e).to_response())?;
    Ok(true)
}

#[tauri::command]
pub async fn update_sample_expiry(
    state: State<'_, AppState>,
    id: String,
    payload: UpdateSampleExpiryRequest,
) -> Result<bool, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.order")
        .await
        .map_err(|e| e.to_response())?;
    LabService::update_sample_expiry(&state.pool, &ctx, &id, payload)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())?;
    Ok(true)
}

#[tauri::command]
pub async fn get_sample_events(
    state: State<'_, AppState>,
    sample_id: String,
) -> Result<Vec<SampleEvent>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    LabService::get_sample_events(&state.pool, &ctx, &sample_id)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn expiry_override(
    state: State<'_, AppState>,
    sample_id: String,
    payload: ExpiryOverrideRequest,
) -> Result<bool, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.result.enter")
        .await
        .map_err(|e| e.to_response())?;
    LabService::expiry_override(&state.pool, &ctx, &sample_id, &payload.pin, &payload.reason)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())?;
    Ok(true)
}

#[tauri::command]
pub async fn get_lab_results(
    state: State<'_, AppState>,
) -> Result<Vec<LabResult>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    LabRepository::list_results(&state.pool, &ctx.workspace_id, &ctx.branch_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn get_test_catalog(
    state: State<'_, AppState>,
) -> Result<Vec<TestCatalogEntry>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    LabRepository::list_catalog(&state.pool, &ctx.workspace_id, &ctx.branch_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn create_test_catalog_entry(
    state: State<'_, AppState>,
    payload: CreateTestCatalogRequest,
) -> Result<TestCatalogEntry, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.order")
        .await
        .map_err(|e| e.to_response())?;
    LabService::create_catalog_entry(&state.pool, &ctx, payload)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn get_lab_stock(
    state: State<'_, AppState>,
) -> Result<Vec<MedicineWithInventory>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    LabRepository::list_stock(&state.pool, &ctx.workspace_id, &ctx.branch_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn get_lab_qc_data(state: State<'_, AppState>) -> Result<LabQcData, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    LabRepository::get_qc_data(&state.pool, &ctx.workspace_id, &ctx.branch_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn create_lab_qc_equipment(
    state: State<'_, AppState>,
    payload: CreateLabQcEquipmentRequest,
) -> Result<LabQcEquipment, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.order")
        .await
        .map_err(|e| e.to_response())?;
    LabService::create_qc_equipment(&state.pool, &ctx, payload)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn create_lab_qc_record(
    state: State<'_, AppState>,
    payload: CreateLabQcRecordRequest,
) -> Result<LabQcRecord, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.result.enter")
        .await
        .map_err(|e| e.to_response())?;
    LabService::record_qc(&state.pool, &ctx, payload)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())
}

#[tauri::command]
pub async fn enter_lab_result(
    state: State<'_, AppState>,
    payload: EnterLabResultRequest,
) -> Result<LabResult, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require("lab.result.enter")
        .await
        .map_err(|e| e.to_response())?;

    let now = chrono::Utc::now().to_rfc3339();
    let res_id = format!("labresult_{}", uuid::Uuid::new_v4());
    let is_out_of_range = payload.is_out_of_range.unwrap_or(false);

    let record_req = RecordLabResultRequest {
        lab_order_id: payload.lab_order_id.clone(),
        result_notes: format!("Value: {} (Ref: {})", payload.value, payload.reference_range.as_deref().unwrap_or("N/A")),
        status: Some("report_ready".to_string()),
        expiry_override_pin: payload.expiry_override_pin,
        expiry_override_reason: payload.expiry_override_reason,
        request_recollect: payload.request_recollect,
    };

    LabService::record_result(&state.pool, &ctx, record_req)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())?;

    let res = LabResult {
        id: res_id,
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        lab_order_id: payload.lab_order_id.clone(),
        entered_by_user_id: ctx.user_id.clone(),
        value: payload.value,
        reference_range: payload.reference_range,
        is_out_of_range,
        override_authorized_by_user_id: None,
        created_at: now.clone(),
        updated_at: now.clone(),
    };

    let mut tx = state
        .pool
        .begin()
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    LabRepository::enter_result(&mut *tx, &res)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    tx.commit()
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(res)
}

fn map_lab_status_error(
    error: crate::services::lab_service::LabStatusError,
) -> crate::auth::AuthError {
    use crate::services::lab_service::LabStatusError;
    match error {
        LabStatusError::NotFound => crate::auth::AuthError::NotFound("Laboratory record".into()),
        LabStatusError::InvalidTransition { from, to } => crate::auth::AuthError::PolicyViolation(
            format!("Invalid laboratory status transition from '{from}' to '{to}'"),
        ),
        LabStatusError::Database(error) => crate::auth::AuthError::DatabaseError(error.to_string()),
    }
}
