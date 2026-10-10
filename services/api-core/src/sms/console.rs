use super::{SendOutcome, SmsError, OtpProvider};
use async_trait::async_trait;
use tracing::warn;

pub struct ConsoleOtpProvider;

impl ConsoleOtpProvider {
    pub fn new() -> Self {
        Self
    }
}

fn mask_phone(phone: &str) -> String {
    let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.len() <= 3 {
        "***".to_string()
    } else {
        let last3 = &digits[digits.len() - 3..];
        format!("***{}", last3)
    }
}

fn extract_code(text: &str) -> String {
    for word in text.split_whitespace() {
        let cleaned: String = word.chars().filter(|c| c.is_ascii_digit()).collect();
        if cleaned.len() == 6 {
            return cleaned;
        }
    }
    "******".to_string()
}

#[async_trait]
impl OtpProvider for ConsoleOtpProvider {
    async fn send(&self, to_e164: &str, text: &str, reference: &str) -> Result<SendOutcome, SmsError> {
        let masked = mask_phone(to_e164);
        let code = extract_code(text);
        warn!(msg_ref = %reference, phone = %masked, "[DEV OTP] ref={} code={}", reference, code);
        Ok(SendOutcome {
            message_id: Some(format!("dev-msg-{}", uuid::Uuid::new_v4())),
            status_id: 50,
            status_name: Some("DELIVERED_DEV".into()),
        })
    }
}
