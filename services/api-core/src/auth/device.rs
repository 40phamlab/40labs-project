use crate::{
    config::{Config, DeviceTokenKeys},
    error::ApiError,
    routes::activation::AppState,
};
use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{header::AUTHORIZATION, request::Parts},
};
use chrono::{DateTime, Duration, Utc};
use jsonwebtoken::{
    decode, decode_header, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub const DEVICE_TOKEN_ISSUER: &str = "40labs-api-core";
pub const DEVICE_TOKEN_AUDIENCE: &str = "40labs-sync";
pub const DEVICE_TOKEN_VERSION: i32 = 1;
pub const DEVICE_TOKEN_TTL_SECONDS: i64 = 15 * 60;
pub const DEVICE_REFRESH_TTL_DAYS: i64 = 90;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct DeviceClaims {
    pub workspace_id: String,
    pub business_id: String,
    pub branch_id: String,
    pub device_id: String,
    pub token_version: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DeviceTokenClaims {
    pub iss: String,
    pub aud: String,
    pub sub: String,
    pub jti: String,
    pub iat: usize,
    pub exp: usize,
    pub ver: i32,
    pub device_ver: i32,
    pub workspace_id: String,
    pub business_id: String,
    pub branch_id: String,
    pub device_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DeviceCredentials {
    pub device_id: String,
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
    pub expires_in: i64,
    pub refresh_expires_at: DateTime<Utc>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DeviceIdentity {
    pub device_id: String,
    pub workspace_id: String,
    pub business_id: String,
    pub branch_id: String,
    pub token_version: i32,
}

pub fn issue_access_token(
    keys: &DeviceTokenKeys,
    identity: &DeviceIdentity,
    now: DateTime<Utc>,
) -> Result<String, ApiError> {
    let secret = keys
        .active_key()
        .ok_or_else(|| ApiError::Internal("Device token signing key is not configured".into()))?;
    let issued = now.timestamp() as usize;
    let claims = DeviceTokenClaims {
        iss: DEVICE_TOKEN_ISSUER.into(),
        aud: DEVICE_TOKEN_AUDIENCE.into(),
        sub: identity.device_id.clone(),
        jti: uuid::Uuid::new_v4().to_string(),
        iat: issued,
        exp: (now + Duration::seconds(DEVICE_TOKEN_TTL_SECONDS)).timestamp() as usize,
        ver: DEVICE_TOKEN_VERSION,
        device_ver: identity.token_version,
        workspace_id: identity.workspace_id.clone(),
        business_id: identity.business_id.clone(),
        branch_id: identity.branch_id.clone(),
        device_id: identity.device_id.clone(),
    };
    let mut header = Header::new(Algorithm::HS256);
    header.kid = Some(keys.active_kid.clone());
    encode(&header, &claims, &EncodingKey::from_secret(secret))
        .map_err(|_| ApiError::Internal("Could not issue device credential".into()))
}

pub fn verify_access_token(
    token: &str,
    keys: &DeviceTokenKeys,
    now: DateTime<Utc>,
) -> Result<DeviceTokenClaims, ApiError> {
    let header = decode_header(token)
        .map_err(|_| ApiError::Unauthorized("Invalid device credential".into()))?;
    if header.alg != Algorithm::HS256 {
        return Err(ApiError::Unauthorized("Invalid device credential".into()));
    }
    let kid = header
        .kid
        .ok_or_else(|| ApiError::Unauthorized("Invalid device credential".into()))?;
    let secret = keys
        .key(&kid)
        .ok_or_else(|| ApiError::Unauthorized("Unknown device credential key".into()))?;
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_issuer(&[DEVICE_TOKEN_ISSUER]);
    validation.set_audience(&[DEVICE_TOKEN_AUDIENCE]);
    validation.leeway = 0;
    validation.validate_exp = true;
    validation.required_spec_claims.insert("iat".into());
    let decoded =
        decode::<DeviceTokenClaims>(token, &DecodingKey::from_secret(secret), &validation)
            .map_err(|_| ApiError::Unauthorized("Invalid or expired device credential".into()))?;
    let c = decoded.claims;
    let current = now.timestamp() as usize;
    if c.iss != DEVICE_TOKEN_ISSUER
        || c.aud != DEVICE_TOKEN_AUDIENCE
        || c.ver != DEVICE_TOKEN_VERSION
        || c.device_ver <= 0
        || c.sub != c.device_id
        || c.exp <= current
        || c.iat > current.saturating_add(30)
        || c.exp.saturating_sub(c.iat) > DEVICE_TOKEN_TTL_SECONDS as usize
        || c.device_id.is_empty()
        || c.workspace_id.is_empty()
        || c.business_id.is_empty()
        || c.branch_id.is_empty()
    {
        return Err(ApiError::Unauthorized(
            "Invalid device credential claims".into(),
        ));
    }
    Ok(c)
}

pub fn hash_refresh_token(token: &str) -> String {
    hex::encode(Sha256::digest(token.as_bytes()))
}

pub fn create_refresh_token() -> String {
    use rand::RngCore;
    let mut bytes = [0u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut bytes);
    use base64::Engine;
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(bytes)
}

#[async_trait]
impl FromRequestParts<AppState> for DeviceClaims {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|h| h.to_str().ok())
            .ok_or_else(|| ApiError::Unauthorized("Missing Authorization header".into()))?;
        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or_else(|| ApiError::Unauthorized("Invalid Authorization header format".into()))?;
        let token_claims = verify_access_token(token, &state.config.device_token_keys, Utc::now())?;
        let stored = sqlx::query_as::<_, (String, String, String, i32, Option<DateTime<Utc>>, DateTime<Utc>)>(
            "SELECT business_id, workspace_id, branch_id, token_version, revoked_at, refresh_expires_at FROM device_enrollments WHERE device_id = $1"
        ).bind(&token_claims.device_id).fetch_optional(&state.pool).await?;
        let (business_id, workspace_id, branch_id, token_version, revoked_at, refresh_expires_at) =
            stored.ok_or_else(|| ApiError::Unauthorized("Device is not enrolled".into()))?;
        if revoked_at.is_some()
            || refresh_expires_at <= Utc::now()
            || token_version != token_claims.device_ver
            || business_id != token_claims.business_id
            || workspace_id != token_claims.workspace_id
            || branch_id != token_claims.branch_id
        {
            return Err(ApiError::Unauthorized(
                "Device credential is revoked or its scope changed".into(),
            ));
        }
        Ok(DeviceClaims {
            workspace_id,
            business_id,
            branch_id,
            device_id: token_claims.device_id,
            token_version,
        })
    }
}

pub fn key_configuration_is_valid(config: &Config) -> bool {
    config.device_token_keys.configuration_error.is_none()
        && config.device_token_keys.active_key().is_some()
        && config.device_token_keys.key_ids().all(|kid| {
            config
                .device_token_keys
                .key(kid)
                .is_some_and(|key| key.len() >= 32)
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::DeviceTokenKeys;
    use base64::Engine;
    use std::collections::HashMap;

    fn keys() -> DeviceTokenKeys {
        let mut map = HashMap::new();
        map.insert(
            "current".to_string(),
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string(),
        );
        DeviceTokenKeys::parse("current".into(), &serde_json::to_string(&map).unwrap()).unwrap()
    }
    fn identity() -> DeviceIdentity {
        DeviceIdentity {
            device_id: "dev-a".into(),
            workspace_id: "ws-a".into(),
            business_id: "biz-a".into(),
            branch_id: "branch-a".into(),
            token_version: 1,
        }
    }
    #[test]
    fn signed_token_validates_and_binds_standard_claims() {
        let now = Utc::now();
        let token = issue_access_token(&keys(), &identity(), now).unwrap();
        let c = verify_access_token(&token, &keys(), now).unwrap();
        assert_eq!(c.device_id, "dev-a");
        assert_eq!(c.iss, DEVICE_TOKEN_ISSUER);
        assert_eq!(c.aud, DEVICE_TOKEN_AUDIENCE);
    }
    #[test]
    fn fabricated_and_modified_tokens_are_rejected() {
        let forged = base64::engine::general_purpose::URL_SAFE_NO_PAD
            .encode(serde_json::json!({"device_id":"x"}).to_string());
        assert!(verify_access_token(&forged, &keys(), Utc::now()).is_err());
        let valid = issue_access_token(&keys(), &identity(), Utc::now()).unwrap();
        let mut parts = valid.split('.').map(str::to_string).collect::<Vec<_>>();
        let replacement = if parts[1].starts_with('A') { "B" } else { "A" };
        parts[1].replace_range(0..1, replacement);
        assert!(verify_access_token(&parts.join("."), &keys(), Utc::now()).is_err());
    }
    #[test]
    fn expiry_issuer_audience_version_and_rotation_key_are_enforced() {
        let now = Utc::now();
        let mut claims = DeviceTokenClaims {
            iss: DEVICE_TOKEN_ISSUER.into(),
            aud: DEVICE_TOKEN_AUDIENCE.into(),
            sub: "dev-a".into(),
            jti: "jti".into(),
            iat: (now.timestamp() - 100).max(0) as usize,
            exp: (now.timestamp() - 1).max(0) as usize,
            ver: 1,
            device_ver: 1,
            workspace_id: "ws-a".into(),
            business_id: "biz-a".into(),
            branch_id: "branch-a".into(),
            device_id: "dev-a".into(),
        };
        let mut h = Header::new(Algorithm::HS256);
        h.kid = Some("current".into());
        let token = encode(
            &h,
            &claims,
            &EncodingKey::from_secret(keys().active_key().unwrap()),
        )
        .unwrap();
        assert!(verify_access_token(&token, &keys(), now).is_err());
        claims.exp = (now.timestamp() + 60) as usize;
        claims.iss = "wrong".into();
        let token = encode(
            &h,
            &claims,
            &EncodingKey::from_secret(keys().active_key().unwrap()),
        )
        .unwrap();
        assert!(verify_access_token(&token, &keys(), now).is_err());
        claims.iss = DEVICE_TOKEN_ISSUER.into();
        claims.aud = "wrong".into();
        let token = encode(
            &h,
            &claims,
            &EncodingKey::from_secret(keys().active_key().unwrap()),
        )
        .unwrap();
        assert!(verify_access_token(&token, &keys(), now).is_err());
        claims.aud = DEVICE_TOKEN_AUDIENCE.into();
        claims.ver = 2;
        let token = encode(
            &h,
            &claims,
            &EncodingKey::from_secret(keys().active_key().unwrap()),
        )
        .unwrap();
        assert!(verify_access_token(&token, &keys(), now).is_err());
        let mut retired = Header::new(Algorithm::HS256);
        retired.kid = Some("retired".into());
        let token = encode(
            &retired,
            &claims,
            &EncodingKey::from_secret(keys().active_key().unwrap()),
        )
        .unwrap();
        assert!(verify_access_token(&token, &keys(), now).is_err());
    }
}
