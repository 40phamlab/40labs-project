use super::{ActivationClient, OtpClient, RegisterRequest, RegisterResponse};
use async_trait::async_trait;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use reqwest::Client;
use serde::Deserialize;
use std::time::Duration;

pub struct HttpActivationClient {
    base_url: String,
    client: Client,
    public_key: Option<VerifyingKey>,
}

#[derive(Deserialize)]
struct ActivationPublicKeyResponse {
    public_key_hex: String,
    issuer: String,
    audience: String,
    version: i32,
}

#[derive(Deserialize)]
struct GrantClaims {
    business_id: String,
    workspace_id: String,
    branch_id: String,
    issuer: String,
    audience: String,
    version: i32,
    issued_at: String,
    expires_at: String,
}

// Public key derived from the development API's all-zero 32-byte signing seed.
// Production builds should provide ACTIVATION_PUBKEY explicitly.
const DEFAULT_ED25519_PUBKEY_HEX: &str =
    "3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29";

impl HttpActivationClient {
    pub fn new(base_url: String, pubkey_hex: Option<&str>) -> Result<Self, String> {
        let configured_key = pubkey_hex
            .map(str::to_owned)
            .or_else(|| cfg!(debug_assertions).then(|| DEFAULT_ED25519_PUBKEY_HEX.to_string()));
        let public_key = configured_key
            .as_deref()
            .map(parse_public_key)
            .transpose()?;

        let client = Client::builder()
            .connect_timeout(Duration::from_secs(5))
            .timeout(Duration::from_secs(20))
            .build()
            .map_err(|e| format!("Failed to configure activation HTTP client: {e}"))?;

        Ok(Self {
            base_url,
            client,
            public_key,
        })
    }

    fn verify_grant(&self, grant: &str, public_key: &VerifyingKey) -> Result<GrantClaims, String> {
        let parts: Vec<&str> = grant.split('.').collect();
        if parts.len() != 2 {
            return Err("Invalid activation grant format".into());
        }
        let payload_b64 = parts[0];
        let sig_hex = parts[1];

        let json_bytes = base64_url_decode(payload_b64)?;
        let sig_bytes = hex::decode(sig_hex).map_err(|e| e.to_string())?;
        if sig_bytes.len() != 64 {
            return Err("Invalid signature length".into());
        }
        let mut sig_arr = [0u8; 64];
        sig_arr.copy_from_slice(&sig_bytes);
        let signature = Signature::from_bytes(&sig_arr);

        public_key
            .verify(&json_bytes, &signature)
            .map_err(|e| format!("Signature verification failed: {}", e))?;

        let claims: GrantClaims =
            serde_json::from_slice(&json_bytes).map_err(|_| "Invalid activation grant claims")?;
        let issued = chrono::DateTime::parse_from_rfc3339(&claims.issued_at)
            .map_err(|_| "Invalid activation grant issue time")?;
        let expires = chrono::DateTime::parse_from_rfc3339(&claims.expires_at)
            .map_err(|_| "Invalid activation grant expiration")?;
        let now = chrono::Utc::now();
        if claims.issuer != "40labs-api-core"
            || claims.audience != "40labs-desktop-device-enrollment"
            || claims.version != 2
            || issued > now + chrono::Duration::seconds(30)
            || expires <= now
            || expires > issued + chrono::Duration::minutes(10)
        {
            return Err("Activation grant is invalid or expired".into());
        }

        Ok(claims)
    }

    async fn resolve_public_key(&self) -> Result<VerifyingKey, String> {
        if let Some(key) = &self.public_key {
            return Ok(*key);
        }
        let url = format!("{}/api/v1/activation/public-key", self.base_url);
        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|_| "API unavailable while loading activation trust key")?;
        if !response.status().is_success() {
            return Err("API rejected activation trust-key request".into());
        }
        let data: ActivationPublicKeyResponse = response
            .json()
            .await
            .map_err(|_| "Invalid activation trust-key response")?;
        if data.issuer != "40labs-api-core"
            || data.audience != "40labs-desktop-device-enrollment"
            || data.version != 2
        {
            return Err("Unsupported activation trust-key contract".into());
        }
        parse_public_key(&data.public_key_hex)
    }
}

fn parse_public_key(hex_str: &str) -> Result<VerifyingKey, String> {
    let bytes = hex::decode(hex_str).map_err(|_| "Invalid activation public key encoding")?;
    let key_bytes: [u8; 32] = bytes
        .try_into()
        .map_err(|_| "Invalid activation public key length")?;
    VerifyingKey::from_bytes(&key_bytes).map_err(|_| "Invalid activation public key".into())
}

fn base64_url_decode(input: &str) -> Result<Vec<u8>, String> {
    use base64::engine::general_purpose::URL_SAFE_NO_PAD;
    use base64::Engine;
    URL_SAFE_NO_PAD.decode(input).map_err(|e| e.to_string())
}

fn classify_registration_http_error(status: reqwest::StatusCode, body: &str) -> &'static str {
    let message = serde_json::from_str::<serde_json::Value>(body)
        .ok()
        .and_then(|value| {
            value
                .get("message")
                .and_then(serde_json::Value::as_str)
                .map(str::to_ascii_lowercase)
        })
        .unwrap_or_default();
    if message.contains("verification token") || message.contains("owner verification") {
        "INVALID_VERIFICATION"
    } else if status.is_server_error() || status == reqwest::StatusCode::TOO_MANY_REQUESTS {
        "API_UNAVAILABLE"
    } else if status.is_client_error() {
        "INVALID_REGISTRATION_DATA"
    } else {
        "ACTIVATION_REJECTED"
    }
}

fn classify_enrollment_http_error(status: reqwest::StatusCode, body: &str) -> (String, String) {
    let json: Option<serde_json::Value> = serde_json::from_str(body).ok();
    let code = json.as_ref()
        .and_then(|v| v.get("error"))
        .and_then(|e| e.as_str())
        .map(str::to_owned);
    let message = json.as_ref()
        .and_then(|v| v.get("message"))
        .and_then(|m| m.as_str())
        .map(str::to_owned)
        .unwrap_or_else(|| body.to_string());

    let mapped_code = match code.as_deref() {
        Some("DEVICE_SCOPE_CONFLICT") => "DEVICE_SCOPE_CONFLICT".into(),
        Some("DEVICE_REVOKED") => "DEVICE_REVOKED".into(),
        Some("DEVICE_SYNC_RECORD_CONFLICT") => "DEVICE_SYNC_RECORD_CONFLICT".into(),
        _ => {
            if status == reqwest::StatusCode::UNAUTHORIZED {
                "ACTIVATION_REJECTED".into()
            } else if status.is_server_error() || status == reqwest::StatusCode::TOO_MANY_REQUESTS {
                "API_UNAVAILABLE".into()
            } else {
                "DEVICE_ENROLLMENT_FAILURE".into()
            }
        }
    };
    (mapped_code, message)
}

#[derive(Deserialize)]
struct OtpReqResp {
    expires_in_secs: i64,
}

#[derive(Deserialize)]
struct OtpVerifyResp {
    verification_token: String,
}

#[async_trait]
impl OtpClient for HttpActivationClient {
    async fn request_otp(&self, phone: &str) -> Result<i64, String> {
        let url = format!("{}/api/v1/activation/otp/request", self.base_url);
        let res = self
            .client
            .post(&url)
            .json(&serde_json::json!({ "phone": phone }))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            let json: Option<serde_json::Value> = serde_json::from_str(&body).ok();
            let err_code = json.as_ref()
                .and_then(|v| v.get("error").or_else(|| v.get("code")))
                .and_then(|e| e.as_str())
                .unwrap_or("UNKNOWN");
            return Err(format!("OTP request failed ({}): error code {}", status, err_code));
        }

        let data: OtpReqResp = res.json().await.map_err(|e| e.to_string())?;
        Ok(data.expires_in_secs)
    }

    async fn verify_otp(&self, phone: &str, code: &str) -> Result<String, String> {
        let url = format!("{}/api/v1/activation/otp/verify", self.base_url);
        let res = self
            .client
            .post(&url)
            .json(&serde_json::json!({ "phone": phone, "code": code }))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            let json: Option<serde_json::Value> = serde_json::from_str(&body).ok();
            let err_code = json.as_ref()
                .and_then(|v| v.get("error").or_else(|| v.get("code")))
                .and_then(|e| e.as_str())
                .unwrap_or("UNKNOWN");
            return Err(format!("OTP verification failed ({}): error code {}", status, err_code));
        }

        let data: OtpVerifyResp = res.json().await.map_err(|e| e.to_string())?;
        Ok(data.verification_token)
    }
}

#[async_trait]
impl ActivationClient for HttpActivationClient {
    async fn register(&self, req: RegisterRequest) -> Result<RegisterResponse, String> {
        let url = format!("{}/api/v1/activation/register", self.base_url);
        let res = self
            .client
            .post(&url)
            .json(&req)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            let code = classify_registration_http_error(status, &body);
            return Err(format!("REGISTRATION_CODE:{code}"));
        }

        let data: RegisterResponse = res.json().await.map_err(|e| e.to_string())?;

        // CRITICAL: verify grant signature BEFORE any local write!
        let public_key = self.resolve_public_key().await?;
        let grant = self.verify_grant(&data.activation_grant, &public_key)?;
        if grant.business_id != data.business_id
            || grant.workspace_id != data.workspace_id
            || grant.branch_id != data.branch_id
        {
            return Err("Registration scope does not match the signed activation grant".into());
        }

        Ok(data)
    }

    async fn enroll_device(
        &self,
        activation_grant: &str,
        device_id: &str,
    ) -> Result<super::DeviceCredentials, String> {
        let url = format!("{}/v1/devices/enroll", self.base_url);
        let res = self
            .client
            .post(&url)
            .json(&serde_json::json!({"activation_grant":activation_grant,"device_id":device_id}))
            .send()
            .await
            .map_err(|e| {
                let code = if e.is_timeout() || e.is_connect() {
                    "API_UNAVAILABLE"
                } else {
                    "DEVICE_ENROLLMENT_FAILURE"
                };
                format!("ENROLLMENT_CODE:{code}:000:{}", e)
            })?;
        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            let (code, _message) = classify_enrollment_http_error(status, &body);
            return Err(format!(
                "ENROLLMENT_CODE:{}:{}:{}",
                code,
                status.as_u16(),
                code
            ));
        }
        res.json().await.map_err(|e| e.to_string())
    }

    async fn refresh_device_credentials(
        &self,
        device_id: &str,
        refresh_token: &str,
    ) -> Result<super::DeviceCredentials, String> {
        let url = format!("{}/v1/devices/refresh", self.base_url);
        let res = self
            .client
            .post(&url)
            .json(&serde_json::json!({"device_id":device_id,"refresh_token":refresh_token}))
            .send()
            .await
            .map_err(|e| e.to_string())?;
        if !res.status().is_success() {
            return Err(format!(
                "Device credential refresh failed ({})",
                res.status()
            ));
        }
        res.json().await.map_err(|e| e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::engine::general_purpose::URL_SAFE_NO_PAD;
    use base64::Engine;
    use ed25519_dalek::{Signer, SigningKey};

    #[test]
    fn test_http_client_grant_verification() {
        let signing_key_bytes = [77u8; 32];
        let signing_key = SigningKey::from_bytes(&signing_key_bytes);
        let verifying_key = ed25519_dalek::VerifyingKey::from(&signing_key);
        let pubkey_hex = hex::encode(verifying_key.to_bytes());

        let client =
            HttpActivationClient::new("http://localhost:3000".into(), Some(&pubkey_hex)).unwrap();

        let now = chrono::Utc::now();
        let payload_json = serde_json::json!({"business_id":"AFYA-123456","workspace_id":"ws_1","branch_id":"br_1","phone_hash":"abc","issued_at":now.to_rfc3339(),"expires_at":(now+chrono::Duration::minutes(5)).to_rfc3339(),"issuer":"40labs-api-core","audience":"40labs-desktop-device-enrollment","version":2}).to_string();
        let sig = signing_key.sign(payload_json.as_bytes());
        let payload_b64 = URL_SAFE_NO_PAD.encode(payload_json.as_bytes());
        let grant = format!("{}.{}", payload_b64, hex::encode(sig.to_bytes()));

        assert!(client
            .verify_grant(&grant, client.public_key.as_ref().unwrap())
            .is_ok());

        let tampered_grant = format!("{}X.{}", payload_b64, hex::encode(sig.to_bytes()));
        assert!(client
            .verify_grant(&tampered_grant, client.public_key.as_ref().unwrap())
            .is_err());
    }

    #[test]
    fn default_dev_key_verifies_grants_signed_by_dev_api() {
        let signing_key = SigningKey::from_bytes(&[0u8; 32]);
        let verifying_key = ed25519_dalek::VerifyingKey::from(&signing_key);
        assert_eq!(
            hex::encode(verifying_key.to_bytes()),
            DEFAULT_ED25519_PUBKEY_HEX
        );

        let client = HttpActivationClient::new("http://127.0.0.1:3000".into(), None).unwrap();
        let now = chrono::Utc::now();
        let payload_json = serde_json::json!({"business_id":"AFYA-123456","workspace_id":"ws_dev","branch_id":"branch_dev","phone_hash":"phone-hash","issued_at":now.to_rfc3339(),"expires_at":(now+chrono::Duration::minutes(5)).to_rfc3339(),"issuer":"40labs-api-core","audience":"40labs-desktop-device-enrollment","version":2}).to_string();
        let signature = signing_key.sign(payload_json.as_bytes());
        let payload_b64 = URL_SAFE_NO_PAD.encode(payload_json.as_bytes());
        let grant = format!("{}.{}", payload_b64, hex::encode(signature.to_bytes()));

        assert!(client
            .verify_grant(&grant, client.public_key.as_ref().unwrap())
            .is_ok());
    }

    #[test]
    fn registration_http_errors_are_reduced_to_safe_categories() {
        assert_eq!(
            classify_registration_http_error(
                reqwest::StatusCode::BAD_REQUEST,
                r#"{"error":"BAD_REQUEST","message":"Invalid verification token"}"#,
            ),
            "INVALID_VERIFICATION",
        );
        assert_eq!(
            classify_registration_http_error(
                reqwest::StatusCode::BAD_REQUEST,
                r#"{"message":"Invalid registration details"}"#
            ),
            "INVALID_REGISTRATION_DATA",
        );
        assert_eq!(
            classify_registration_http_error(
                reqwest::StatusCode::SERVICE_UNAVAILABLE,
                "sensitive upstream body"
            ),
            "API_UNAVAILABLE",
        );
    }
}
