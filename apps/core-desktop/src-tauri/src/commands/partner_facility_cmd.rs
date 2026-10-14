use crate::auth::{AuthEngine, AuthErrorResponse};
use crate::db::AppState;
use crate::models::partner_facility::{PartnerFacility, PartnerFacilityContacts, FacilityType, FacilityStatus};
use crate::repositories::partner_facility_repo::PartnerFacilityRepository;
use tauri::State;

#[derive(Debug, serde::Deserialize)]
pub struct CreatePartnerFacilityPayload {
    pub partner_business_id: Option<String>,
    pub name: String,
    pub r#type: String,
    pub contacts: PartnerFacilityContacts,
    pub region: String,
    pub district: String,
}

#[tauri::command]
pub async fn partner_facility_list(state: State<'_, AppState>) -> Result<Vec<PartnerFacility>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    let list = PartnerFacilityRepository::list(&state.pool, &ctx.workspace_id, &ctx.branch_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(list)
}

#[tauri::command]
pub async fn partner_facility_create(
    state: State<'_, AppState>,
    payload: CreatePartnerFacilityPayload,
) -> Result<PartnerFacility, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    let id = format!("pf_{}", uuid::Uuid::new_v4());
    let now = chrono::Utc::now().to_rfc3339();

    let is_linked = payload.partner_business_id.as_deref().map(|s| !s.is_empty()).unwrap_or(false);

    let facility = PartnerFacility {
        id: id.clone(),
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        partner_business_id: payload.partner_business_id,
        name: payload.name,
        r#type: match payload.r#type.as_str() {
            "clinic" => FacilityType::Clinic,
            "hospital" => FacilityType::Hospital,
            "lab" => FacilityType::Lab,
            "other" => FacilityType::Other,
            _ => FacilityType::Pharmacy,
        },
        contacts: payload.contacts,
        region: payload.region,
        district: payload.district,
        status: FacilityStatus::Active,
        is_40labs_linked: is_linked,
        created_at: now.clone(),
        updated_at: now,
    };

    PartnerFacilityRepository::create(&state.pool, &facility)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(facility)
}

#[tauri::command]
pub async fn partner_facility_update_status(
    state: State<'_, AppState>,
    id: String,
    status: String,
) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    PartnerFacilityRepository::update_status(&state.pool, &id, &status)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(())
}

#[tauri::command]
pub async fn partner_facility_delete(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    PartnerFacilityRepository::delete(&state.pool, &id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(())
}
