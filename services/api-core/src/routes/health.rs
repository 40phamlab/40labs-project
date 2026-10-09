use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    routing::get,
    Json, Router,
};
use serde::Serialize;
use crate::routes::activation::AppState;

pub fn health_router(state: AppState) -> Router {
    Router::new()
        .route("/healthz/sms", get(sms_health_check))
        .with_state(state)
}

#[derive(Serialize)]
pub struct SmsHealthResponse {
    pub sender_ok: bool,
    pub status_id: i32,
}

pub async fn sms_health_check(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<SmsHealthResponse>, StatusCode> {
    let auth_header = headers.get("Authorization").and_then(|v| v.to_str().ok());
    let expected = format!("Bearer {}", state.config.activation_signing_key);
    if auth_header != Some(&expected) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    match state.sms_sender.send("255712345678", "health check", "health-ping").await {
        Ok(receipt) => {
            let sender_ok = matches!(receipt.status_id, 50 | 51 | 52 | 88 | 73 | 109);
            Ok(Json(SmsHealthResponse {
                sender_ok,
                status_id: receipt.status_id,
            }))
        }
        Err(e) => {
            let status_id = match e {
                crate::sms::SmsError::ConfigError(_) => 56,
                crate::sms::SmsError::NoCredits => 57,
                crate::sms::SmsError::InvalidPhone(_) => 54,
                crate::sms::SmsError::Unreachable(_) => 55,
                crate::sms::SmsError::Flooding(_) => 63,
                crate::sms::SmsError::DeliveryFailed(_) => 74,
                crate::sms::SmsError::Unknown(id) => id,
                _ => -1,
            };
            Ok(Json(SmsHealthResponse {
                sender_ok: false,
                status_id,
            }))
        }
    }
}
