pub mod http_client;
#[cfg(debug_assertions)]
pub mod dev_client;
pub mod client;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RegisterRequest {
    pub verification_token: String,
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

#[async_trait]
pub trait ActivationClient: Send + Sync {
    async fn register(&self, req: RegisterRequest) -> Result<RegisterResponse, String>;
}
