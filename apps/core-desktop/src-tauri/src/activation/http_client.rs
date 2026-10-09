use super::{ActivationClient, OtpClient, RegisterRequest, RegisterResponse};
use async_trait::async_trait;
use ed25519_dalek::{Signature, VerifyingKey, Verifier};
use reqwest::Client;
use serde::Deserialize;

pub struct HttpActivationClient {
    base_url: String,
    client: Client,
    public_key: VerifyingKey,
}

const DEFAULT_ED25519_PUBKEY_HEX: &str = "0000000000000000000000000000000000000000000000000000000000000000";

impl HttpActivationClient {
    pub fn new(base_url: String, pubkey_hex: Option<&str>) -> Result<Self, String> {
        let hex_str = pubkey_hex.unwrap_or(DEFAULT_ED25519_PUBKEY_HEX);
        let bytes = hex::decode(hex_str).map_err(|e| e.to_string())?;
        if bytes.len() != 32 {
            return Err("Invalid public key length".into());
        }
        let mut key_bytes = [0u8; 32];
        key_bytes.copy_from_slice(&bytes);
        let public_key = VerifyingKey::from_bytes(&key_bytes).map_err(|e| e.to_string())?;

        Ok(Self {
            base_url,
            client: Client::new(),
            public_key,
        })
    }

    pub fn verify_grant(&self, grant: &str) -> Result<(), String> {
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

        self.public_key
            .verify(&json_bytes, &signature)
            .map_err(|e| format!("Signature verification failed: {}", e))?;

        Ok(())
    }
}

fn base64_url_decode(input: &str) -> Result<Vec<u8>, String> {
    use base64::engine::general_purpose::URL_SAFE_NO_PAD;
    use base64::Engine;
    URL_SAFE_NO_PAD.decode(input).map_err(|e| e.to_string())
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
        let res = self.client
            .post(&url)
            .json(&serde_json::json!({ "phone": phone }))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(format!("OTP request failed: {}", body));
        }

        let data: OtpReqResp = res.json().await.map_err(|e| e.to_string())?;
        Ok(data.expires_in_secs)
    }

    async fn verify_otp(&self, phone: &str, code: &str) -> Result<String, String> {
        let url = format!("{}/api/v1/activation/otp/verify", self.base_url);
        let res = self.client
            .post(&url)
            .json(&serde_json::json!({ "phone": phone, "code": code }))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(format!("OTP verification failed: {}", body));
        }

        let data: OtpVerifyResp = res.json().await.map_err(|e| e.to_string())?;
        Ok(data.verification_token)
    }
}

#[async_trait]
impl ActivationClient for HttpActivationClient {
    async fn register(&self, req: RegisterRequest) -> Result<RegisterResponse, String> {
        let url = format!("{}/api/v1/activation/register", self.base_url);
        let res = self.client
            .post(&url)
            .json(&req)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(format!("Registration failed: {}", body));
        }

        let data: RegisterResponse = res.json().await.map_err(|e| e.to_string())?;

        // CRITICAL: verify grant signature BEFORE any local write!
        self.verify_grant(&data.activation_grant)?;

        Ok(data)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ed25519_dalek::{SigningKey, Signer};
    use base64::engine::general_purpose::URL_SAFE_NO_PAD;
    use base64::Engine;

    #[test]
    fn test_http_client_grant_verification() {
        let signing_key_bytes = [77u8; 32];
        let signing_key = SigningKey::from_bytes(&signing_key_bytes);
        let verifying_key = ed25519_dalek::VerifyingKey::from(&signing_key);
        let pubkey_hex = hex::encode(verifying_key.to_bytes());

        let client = HttpActivationClient::new("http://localhost:3000".into(), Some(&pubkey_hex)).unwrap();

        let payload_json = r#"{"business_id":"AFYA-123456","workspace_id":"ws_1","branch_id":"br_1","phone_hash":"abc","issued_at":"2025-01-01T00:00:00Z"}"#;
        let sig = signing_key.sign(payload_json.as_bytes());
        let payload_b64 = URL_SAFE_NO_PAD.encode(payload_json.as_bytes());
        let grant = format!("{}.{}", payload_b64, hex::encode(sig.to_bytes()));

        assert!(client.verify_grant(&grant).is_ok());

        let tampered_grant = format!("{}X.{}", payload_b64, hex::encode(sig.to_bytes()));
        assert!(client.verify_grant(&tampered_grant).is_err());
    }
}
