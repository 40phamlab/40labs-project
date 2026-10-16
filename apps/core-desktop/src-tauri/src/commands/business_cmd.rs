use crate::auth::{AuthEngine, AuthError, AuthErrorResponse};
use crate::db::AppState;
use crate::models::business::Business;
use crate::repositories::business_repo::BusinessRepository;
use tauri::{Manager, State};

const MAX_LOGO_SIZE_BYTES: u64 = 512 * 1024; // 512 KB

fn validate_logo_content(bytes: &[u8], file_name: &str) -> Result<(), String> {
    if bytes.is_empty() {
        return Err("Logo file is empty".to_string());
    }
    if bytes.len() as u64 > MAX_LOGO_SIZE_BYTES {
        return Err("Logo file exceeds 512KB limit".to_string());
    }

    let ext = std::path::Path::new(file_name)
        .extension()
        .and_then(|v| v.to_str())
        .unwrap_or("")
        .to_lowercase();

    let is_png = bytes.starts_with(b"\x89\x50\x4E\x47\x0D\x0A\x1A\x0A");
    let is_jpeg = bytes.starts_with(&[0xFF, 0xD8, 0xFF]);
    let is_webp = bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP";
    let is_svg = {
        let s = String::from_utf8_lossy(bytes);
        s.contains("<svg")
    };

    match ext.as_str() {
        "png" if !is_png => return Err("Invalid PNG image format or corrupted file".to_string()),
        "jpg" | "jpeg" if !is_jpeg => return Err("Invalid JPEG image format or corrupted file".to_string()),
        "webp" if !is_webp => return Err("Invalid WebP image format or corrupted file".to_string()),
        "svg" if !is_svg => return Err("Invalid SVG image format or corrupted file".to_string()),
        _ => {
            if !is_png && !is_jpeg && !is_webp && !is_svg {
                return Err("Unsupported or invalid image format. Supported formats: PNG, JPEG, WebP, SVG.".to_string());
            }
        }
    }

    Ok(())
}

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
    pub language: Option<String>,
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
pub async fn upload_business_logo(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    bytes: Option<Vec<u8>>,
    source_path: Option<String>,
    file_name: String,
) -> Result<String, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    let file_bytes = if let Some(b) = bytes {
        b
    } else if let Some(path_str) = source_path {
        let path = std::path::Path::new(&path_str);
        if path.components().any(|c| matches!(c, std::path::Component::ParentDir)) {
            return Err(AuthError::PolicyViolation("Path traversal detected".into()).to_response());
        }
        if !path.is_absolute() || !path.is_file() {
            return Err(AuthError::PolicyViolation("Source path must be an absolute file".into()).to_response());
        }
        tokio::fs::read(path)
            .await
            .map_err(|e| AuthError::InternalError(e.to_string()).to_response())?
    } else {
        return Err(AuthError::PolicyViolation("Either bytes or source_path must be provided".into()).to_response());
    };

    validate_logo_content(&file_bytes, &file_name)
        .map_err(|msg| AuthError::PolicyViolation(msg).to_response())?;

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AuthError::InternalError(e.to_string()).to_response())?;

    let logos_dir = app_data_dir.join("logos").join(&ctx.workspace_id);
    tokio::fs::create_dir_all(&logos_dir)
        .await
        .map_err(|e| AuthError::InternalError(e.to_string()).to_response())?;

    let sanitized_name = crate::services::documents::sanitize_file_name(&file_name);
    let target_path = crate::services::documents::unique_path(&logos_dir, &sanitized_name);

    tokio::fs::write(&target_path, &file_bytes)
        .await
        .map_err(|e| AuthError::InternalError(e.to_string()).to_response())?;

    Ok(target_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn update_business(
    app: tauri::AppHandle,
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

    // Fetch existing business to check old logo for safe cleanup
    let old_business = BusinessRepository::get(&state.pool).await.ok().flatten();
    let old_logo_path = old_business.and_then(|b| b.logo_url);

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
    let language = payload.language.as_deref();

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
        language,
    )
    .await
    .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
    .ok_or_else(|| {
        crate::auth::AuthError::NotFound("Business profile not found".to_string()).to_response()
    })?;

    // If logo was replaced or removed, safely clean up old logo file if inside app_data_dir and not used
    if let Some(old_path_str) = old_logo_path {
        let new_logo_val = logo_url.unwrap_or(None);
        if new_logo_val != Some(&old_path_str) {
            if let Ok(app_data_dir) = app.path().app_data_dir() {
                let old_p = std::path::Path::new(&old_path_str);
                if old_p.starts_with(&app_data_dir) && old_p.exists() && old_p.is_file() {
                    let _ = tokio::fs::remove_file(old_p).await;
                }
            }
        }
    }

    Ok(updated)
}
