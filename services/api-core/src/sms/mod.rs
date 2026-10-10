pub mod nextsms;
pub mod console;
pub mod test_mode;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendOutcome {
    pub message_id: Option<String>,
    pub status_id: i32,
    pub status_name: Option<String>,
}

pub type SmsReceipt = SendOutcome;

#[derive(Error, Debug)]
pub enum SmsError {
    #[error("No credits (status 57)")]
    NoCredits,
    #[error("Provider authentication failure (401/403)")]
    ProviderAuth,
    #[error("Provider rejected request: {0}")]
    ProviderRejected(String),
    #[error("Provider rate limited (429)")]
    ProviderRateLimited,
    #[error("Provider unavailable (5xx/timeout/connect)")]
    ProviderUnavailable,
    #[error("Sender not approved (status 56/58): {0}")]
    SenderNotApproved(String),
    #[error("Test mode recipient (status 61): {0}")]
    TestModeRecipient(String),
    #[error("Configuration error: {0}")]
    ConfigError(String),
    #[error("Invalid phone number: {0}")]
    InvalidPhone(String),
    #[error("Unreachable: {0}")]
    Unreachable(String),
    #[error("Flooding: {0}")]
    Flooding(String),
    #[error("Delivery failed: {0}")]
    DeliveryFailed(String),
    #[error("Retryable error ({0})")]
    Retryable(String),
    #[error("Permanent error ({0})")]
    Permanent(String),
    #[error("Unknown NextSMS status id ({0})")]
    Unknown(i32),
}

#[async_trait]
pub trait OtpProvider: Send + Sync {
    async fn send(&self, to_e164: &str, text: &str, reference: &str) -> Result<SendOutcome, SmsError>;
}

pub type SmsSender = dyn OtpProvider;

pub fn sanitize_token(raw: &str) -> String {
    let mut t = raw.trim().to_string();
    if (t.starts_with('"') && t.ends_with('"')) || (t.starts_with('\'') && t.ends_with('\'')) {
        if t.len() >= 2 {
            t = t[1..t.len() - 1].to_string();
            t = t.trim().to_string();
        }
    }
    if t.to_lowercase().starts_with("bearer ") {
        t = t[7..].trim().to_string();
    }
    t
}

pub fn scrub_phones(text: &str) -> String {
    let mut result = String::new();
    let mut digit_run = String::new();
    for c in text.chars() {
        if c.is_ascii_digit() {
            digit_run.push(c);
        } else {
            if !digit_run.is_empty() {
                if digit_run.len() >= 7 {
                    result.push_str("[REDACTED]");
                } else {
                    result.push_str(&digit_run);
                }
                digit_run.clear();
            }
            result.push(c);
        }
    }
    if !digit_run.is_empty() {
        if digit_run.len() >= 7 {
            result.push_str("[REDACTED]");
        } else {
            result.push_str(&digit_run);
        }
    }
    if result.chars().count() > 200 {
        result.chars().take(200).collect()
    } else {
        result
    }
}

pub fn normalize_tz_phone(input: &str) -> Result<String, &'static str> {
    if input.is_empty() {
        return Err("INVALID_PHONE");
    }
    let digits: String = input.chars().filter(|c| c.is_ascii_digit()).collect();
    let normalized = if digits.starts_with("255") && digits.len() == 12 {
        digits
    } else if digits.starts_with('0') && digits.len() == 10 {
        format!("255{}", &digits[1..])
    } else if digits.len() == 9 {
        format!("255{}", digits)
    } else {
        return Err("INVALID_PHONE");
    };

    if normalized.len() == 12 && normalized.starts_with("255") {
        let prefix_digit = normalized.as_bytes()[3];
        if (prefix_digit == b'6' || prefix_digit == b'7') && normalized[3..].chars().all(|c| c.is_ascii_digit()) {
            return Ok(normalized);
        }
    }
    Err("INVALID_PHONE")
}

pub fn mask_phone(phone: &str) -> String {
    let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.len() <= 3 {
        "***".to_string()
    } else {
        let last3 = &digits[digits.len() - 3..];
        format!("***{}", last3)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_tz_phone_table() {
        assert_eq!(normalize_tz_phone("0712345678"), Ok("255712345678".into()));
        assert_eq!(normalize_tz_phone("255712345678"), Ok("255712345678".into()));
        assert_eq!(normalize_tz_phone("+255712345678"), Ok("255712345678".into()));
        assert_eq!(normalize_tz_phone("712345678"), Ok("255712345678".into()));
        assert_eq!(normalize_tz_phone("0712 345-678"), Ok("255712345678".into()));
        assert_eq!(normalize_tz_phone("+255 712 345 678"), Ok("255712345678".into()));
        assert_eq!(normalize_tz_phone("0655223344"), Ok("255655223344".into()));
        assert_eq!(normalize_tz_phone("0712-345-678"), Ok("255712345678".into()));
        assert_eq!(normalize_tz_phone("133712345678"), Err("INVALID_PHONE"));
        assert_eq!(normalize_tz_phone("+233712345678"), Err("INVALID_PHONE"));
        assert_eq!(normalize_tz_phone("071234567"), Err("INVALID_PHONE"));
        assert_eq!(normalize_tz_phone("07123456789"), Err("INVALID_PHONE"));
        assert_eq!(normalize_tz_phone("0812345678"), Err("INVALID_PHONE"));
        assert_eq!(normalize_tz_phone("abcdefghij"), Err("INVALID_PHONE"));
        assert_eq!(normalize_tz_phone(""), Err("INVALID_PHONE"));
    }

    #[test]
    fn test_mask_phone() {
        assert_eq!(mask_phone("+255712345678"), "***678");
        assert_eq!(mask_phone("0712345678"), "***678");
        assert_eq!(mask_phone("123"), "***");
    }
}
