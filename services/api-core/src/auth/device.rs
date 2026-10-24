use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{header::AUTHORIZATION, request::Parts},
};
use serde::{Deserialize, Serialize};
use crate::error::ApiError;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DeviceClaims {
    pub workspace_id: String,
    pub business_id: String,
    pub device_id: String,
}

#[async_trait]
impl<S> FromRequestParts<S> for DeviceClaims
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|h| h.to_str().ok())
            .ok_or_else(|| ApiError::Unauthorized("Missing Authorization header".into()))?;

        let token = if auth_header.starts_with("Bearer ") {
            &auth_header[7..]
        } else {
            return Err(ApiError::Unauthorized("Invalid Authorization header format".into()));
        };

        // TODO: [replace with 1C token verification] [2C]
        decode_dev_device_token(token)
    }
}

pub fn decode_dev_device_token(token: &str) -> Result<DeviceClaims, ApiError> {
    let bytes = base64::Engine::decode(&base64::engine::general_purpose::URL_SAFE_NO_PAD, token)
        .or_else(|_| base64::Engine::decode(&base64::engine::general_purpose::STANDARD, token))
        .map_err(|_| ApiError::Unauthorized("Invalid device token encoding".into()))?;

    let claims: DeviceClaims = serde_json::from_slice(&bytes)
        .map_err(|_| ApiError::Unauthorized("Invalid device token claims JSON".into()))?;

    if claims.workspace_id.is_empty() || claims.device_id.is_empty() || claims.business_id.is_empty() {
        return Err(ApiError::Unauthorized("Invalid device claims: missing workspace_id, business_id, or device_id".into()));
    }

    Ok(claims)
}

pub fn encode_dev_device_token(claims: &DeviceClaims) -> String {
    let json = serde_json::to_vec(claims).unwrap();
    base64::Engine::encode(&base64::engine::general_purpose::URL_SAFE_NO_PAD, json)
}
