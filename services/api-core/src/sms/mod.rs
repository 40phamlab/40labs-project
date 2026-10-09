pub mod nextsms;
pub mod test_mode;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmsReceipt {
    pub message_id: Option<String>,
    pub status_id: i32,
    pub status_name: Option<String>,
}

#[derive(Error, Debug)]
pub enum SmsError {
    #[error("No credits (status 57) - Kill switch tripped")]
    NoCredits,
    #[error("Configuration error (status 56/58/61/62/53): {0}")]
    ConfigError(String),
    #[error("Invalid phone number (status 54/68/69): {0}")]
    InvalidPhone(String),
    #[error("Recipient unreachable / DND (status 55/59): {0}")]
    Unreachable(String),
    #[error("Flooding detected (status 63/110): {0}")]
    Flooding(String),
    #[error("Delivery failed (status 74/76/79/80): {0}")]
    DeliveryFailed(String),
    #[error("Retryable error ({0})")]
    Retryable(String),
    #[error("Permanent error ({0})")]
    Permanent(String),
    #[error("Unknown NextSMS status id ({0}) - Alert triggered")]
    Unknown(i32),
}

#[async_trait]
pub trait SmsSender: Send + Sync {
    async fn send(&self, to: &str, text: &str, msg_ref: &str) -> Result<SmsReceipt, SmsError>;
}
