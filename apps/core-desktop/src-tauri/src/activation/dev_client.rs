use super::{ActivationClient, OtpClient, RegisterRequest, RegisterResponse};
use async_trait::async_trait;

pub struct DevActivationClient;

impl DevActivationClient {
    pub fn new() -> Result<Self, String> {
        if std::env::var("DEV_ACTIVATION").unwrap_or_default() != "1" {
            return Err("Dev activation client disabled (set DEV_ACTIVATION=1)".into());
        }
        Ok(Self)
    }
}

#[async_trait]
impl OtpClient for DevActivationClient {
    async fn request_otp(&self, _phone: &str) -> Result<i64, String> {
        Ok(300)
    }

    async fn verify_otp(&self, _phone: &str, code: &str) -> Result<String, String> {
        if code != "123456" {
            return Err("Invalid OTP code".into());
        }
        Ok("dev_verification_token".to_string())
    }
}

#[async_trait]
impl ActivationClient for DevActivationClient {
    async fn register(&self, _req: RegisterRequest) -> Result<RegisterResponse, String> {
        Ok(RegisterResponse {
            business_id: "AFYA-DEV01".into(),
            workspace_id: "ws_dev".into(),
            branch_id: "branch_dev".into(),
            activation_grant: "mock_dev_grant_signature".into(),
        })
    }

    async fn enroll_device(
        &self,
        _activation_grant: &str,
        device_id: &str,
    ) -> Result<super::DeviceCredentials, String> {
        Ok(super::DeviceCredentials {
            device_id: device_id.into(),
            access_token: "dev-only-credential".into(),
            refresh_token: "dev-only-refresh".into(),
            token_type: "Bearer".into(),
            expires_in: 900,
            refresh_expires_at: (chrono::Utc::now() + chrono::Duration::days(1)).to_rfc3339(),
        })
    }

    async fn refresh_device_credentials(
        &self,
        device_id: &str,
        _refresh_token: &str,
    ) -> Result<super::DeviceCredentials, String> {
        self.enroll_device("dev-only", device_id).await
    }
}
