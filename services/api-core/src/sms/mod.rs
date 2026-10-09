pub mod nextsms;
pub mod test_mode;

use async_trait::async_trait;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum SmsError {
    #[error("Sender not registered (56)")]
    SenderNotRegistered,
    #[error("No credits (57/60) - Kill switch tripped")]
    NoCredits,
    #[error("Test mode destination (61)")]
    TestModeDestination,
    #[error("Invalid number (54/69)")]
    InvalidNumber,
    #[error("DND active (55)")]
    Dnd,
    #[error("Flooding (63)")]
    Flooding,
    #[error("Retryable error ({0})")]
    Retryable(String),
    #[error("Permanent error ({0})")]
    Permanent(String),
}

#[async_trait]
pub trait SmsSender: Send + Sync {
    async fn send(&self, to: &str, text: &str, msg_id: &str) -> Result<(), SmsError>;
}
