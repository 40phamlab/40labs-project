pub mod client;
#[cfg(debug_assertions)]
pub mod dev_client;
pub mod http_client;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RegisterRequest {
    pub verification_token: String,
    pub owner_phone: String,
    pub business_name: String,
    pub owner_first_name: String,
    pub owner_last_name: String,
    pub owner_email: Option<String>,
    pub terms_accepted: bool,
    pub terms_version: String,
    pub terms_locale: String,
    pub terms_text_sha256: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RegisterResponse {
    pub business_id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub activation_grant: String,
}

#[async_trait]
pub trait OtpClient: Send + Sync {
    async fn request_otp(&self, phone: &str) -> Result<i64, String>;
    async fn verify_otp(&self, phone: &str, code: &str) -> Result<String, String>;
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DeviceCredentials {
    pub device_id: String,
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
    pub expires_in: i64,
    pub refresh_expires_at: String,
}

#[async_trait]
pub trait ActivationClient: Send + Sync {
    async fn register(&self, req: RegisterRequest) -> Result<RegisterResponse, String>;
    async fn enroll_device(
        &self,
        activation_grant: &str,
        device_id: &str,
    ) -> Result<DeviceCredentials, String>;
    async fn refresh_device_credentials(
        &self,
        device_id: &str,
        refresh_token: &str,
    ) -> Result<DeviceCredentials, String>;
}

#[cfg(test)]
mod tests {
    use super::{RegisterRequest, RegisterResponse};

    #[test]
    fn registration_json_uses_the_api_snake_case_contract() {
        let request = RegisterRequest {
            verification_token: "opaque-token".into(),
            owner_phone: "+255712345678".into(),
            business_name: "Afya".into(),
            owner_first_name: "Asha".into(),
            owner_last_name: "Test".into(),
            owner_email: None,
            terms_accepted: true,
            terms_version: "1.0".into(),
            terms_locale: "sw-TZ".into(),
            terms_text_sha256: "a".repeat(64),
        };
        let value = serde_json::to_value(request).unwrap();
        assert_eq!(value["owner_phone"], "+255712345678");
        assert_eq!(value["verification_token"], "opaque-token");
        assert!(value.get("ownerPhone").is_none());

        let response: RegisterResponse = serde_json::from_value(serde_json::json!({
            "business_id": "AFYA-TEST01", "workspace_id": "ws-1", "branch_id": "br-1", "activation_grant": "grant"
        })).unwrap();
        assert_eq!(response.business_id, "AFYA-TEST01");
    }
}
