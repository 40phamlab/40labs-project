use crate::auth::{AuthEngine, AuthErrorResponse};
use crate::db::AppState;
use crate::models::business::Business;
use crate::repositories::business_repo::BusinessRepository;
use tauri::State;

#[derive(Debug, serde::Deserialize, Default)]
#[serde(default)]
pub struct ContactsPayload {
    pub mobile: Option<String>,
    pub email: Option<Option<String>>,
    pub whatsapp: Option<Option<String>>,
}

#[derive(Debug, serde::Deserialize, Default)]
#[serde(default)]
pub struct AddressPayload {
    pub region: Option<String>,
    pub district: Option<String>,
    pub place: Option<String>,
}

#[derive(Debug, serde::Deserialize, Default)]
#[serde(default)]
pub struct UpdateBusinessPayload {
    pub name: Option<String>,
    pub tin: Option<Option<String>>,
    pub tmda_number: Option<Option<String>>,
    pub contacts: Option<ContactsPayload>,
    pub address: Option<AddressPayload>,
    pub logo_url: Option<Option<String>>,
    pub lipa_namba: Option<Option<String>>,
    pub payment_number: Option<Option<String>>,
    pub appearance_mode: Option<String>,
}

#[tauri::command]
pub async fn get_business(state: State<'_, AppState>) -> Result<Business, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    let b = BusinessRepository::get(&state.pool)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| {
            crate::auth::AuthError::NotFound("Business profile not found".to_string()).to_response()
        })?;

    Ok(b)
}

#[tauri::command]
pub async fn update_business(
    state: State<'_, AppState>,
    payload: UpdateBusinessPayload,
) -> Result<Business, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    let name = payload.name.as_deref();
    let tin = payload.tin.as_ref().map(|opt| opt.as_deref());
    let tmda_number = payload.tmda_number.as_ref().map(|opt| opt.as_deref());

    let (mobile, email, whatsapp) = if let Some(c) = &payload.contacts {
        (
            c.mobile.as_deref(),
            c.email.as_ref().map(|opt| opt.as_deref()),
            c.whatsapp.as_ref().map(|opt| opt.as_deref()),
        )
    } else {
        (None, None, None)
    };

    let (region, district, place) = if let Some(a) = &payload.address {
        (
            a.region.as_deref(),
            a.district.as_deref(),
            a.place.as_deref(),
        )
    } else {
        (None, None, None)
    };

    let logo_url = payload.logo_url.as_ref().map(|opt| opt.as_deref());
    let lipa_namba = payload.lipa_namba.as_ref().map(|opt| opt.as_deref());
    let payment_number = payload.payment_number.as_ref().map(|opt| opt.as_deref());
    let appearance_mode = payload.appearance_mode.as_deref();

    let updated = BusinessRepository::update_business_profile(
        &state.pool,
        name,
        tin,
        tmda_number,
        mobile,
        email,
        whatsapp,
        region,
        district,
        place,
        logo_url,
        lipa_namba,
        payment_number,
        appearance_mode,
    )
    .await
    .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
    .ok_or_else(|| {
        crate::auth::AuthError::NotFound("Business profile not found".to_string()).to_response()
    })?;

    Ok(updated)
}
