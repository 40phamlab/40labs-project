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

    async fn verify_otp(&self, _phone: &str, _code: &str) -> Result<String, String> {
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
}
