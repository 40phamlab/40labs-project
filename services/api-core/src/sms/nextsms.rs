use super::{SendOutcome, SmsError, OtpProvider};
use async_trait::async_trait;
use reqwest::Client;
use serde::Deserialize;
use std::time::Duration;
use tracing::{error, info};

pub struct NextSmsProvider {
    client: Client,
    base_url: String,
    api_token: String,
    sender_id: String,
    is_test_mode: bool,
}

pub type NextSmsSender = NextSmsProvider;

#[derive(serde::Serialize)]
struct NextSmsRequest {
    from: String,
    to: String,
    text: String,
    flash: i32,
    reference: String,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code, non_snake_case)]
struct NextSmsResponse {
    #[serde(default)]
    status: Option<NextSmsStatus>,
    #[serde(default)]
    messages: Option<Vec<NextSmsMessage>>,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code, non_snake_case)]
struct NextSmsStatus {
    #[serde(default)]
    id: Option<i32>,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    description: Option<String>,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code, non_snake_case)]
struct NextSmsMessage {
    #[serde(default)]
    to: Option<String>,
    #[serde(default)]
    status: Option<NextSmsStatus>,
    #[serde(default, deserialize_with = "deserialize_send_reference")]
    sendReference: Option<String>,
    #[serde(default)]
    smsCount: Option<i32>,
    #[serde(default)]
    sort: Option<i32>,
}

fn deserialize_send_reference<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum NumberOrString {
        Number(i64),
        Float(f64),
        String(String),
    }

    let opt = Option::<NumberOrString>::deserialize(deserializer)?;
    Ok(match opt {
        Some(NumberOrString::Number(n)) => Some(n.to_string()),
        Some(NumberOrString::Float(f)) => Some(f.to_string()),
        Some(NumberOrString::String(s)) => Some(s),
        None => None,
    })
}

fn sanitize_phone_number(phone: &str) -> String {
    let cleaned: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
    if cleaned.starts_with("255") && cleaned.len() == 12 {
        cleaned
    } else if cleaned.starts_with('0') && cleaned.len() == 10 {
        format!("255{}", &cleaned[1..])
    } else if cleaned.len() == 9 {
        format!("255{}", cleaned)
    } else {
        cleaned
    }
}

impl NextSmsProvider {
    pub fn new(base_url: String, api_token: String, sender_id: String, is_test_mode: bool) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .unwrap_or_else(|_| Client::new());
        Self {
            client,
            base_url,
            api_token: super::sanitize_token(&api_token),
            sender_id,
            is_test_mode,
        }
    }
}

#[async_trait]
impl OtpProvider for NextSmsProvider {
    async fn send(&self, to_e164: &str, text: &str, reference: &str) -> Result<SendOutcome, SmsError> {
        let endpoint_path = if self.is_test_mode {
            "/api/sms/v2/test/text/single"
        } else {
            "/api/sms/v2/text/single"
        };
        let url = format!("{}{}", self.base_url, endpoint_path);
        let sanitized_to = sanitize_phone_number(to_e164);

        let payload = NextSmsRequest {
            from: self.sender_id.clone(),
            to: sanitized_to,
            text: text.to_string(),
            flash: 0,
            reference: reference.to_string(),
        };

        let res = self.client
            .post(&url)
            .bearer_auth(&self.api_token)
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .json(&payload)
            .send()
            .await;

        let resp = match res {
            Ok(r) => r,
            Err(e) => {
                error!(msg_ref = %reference, error = %e, "NextSMS transport/timeout error");
                return Err(SmsError::ProviderUnavailable);
            }
        };

        let status_code = resp.status();
        let status_u16 = status_code.as_u16();
        let body_text = resp.text().await.unwrap_or_default();

        // 1. CLASSIFY HTTP STATUS FIRST
        if status_u16 == 401 || status_u16 == 403 {
            error!(msg_ref = %reference, http_status = %status_u16, "NextSMS auth failure");
            return Err(SmsError::ProviderAuth);
        }
        if status_u16 == 400 || status_u16 == 422 {
            let snippet = super::scrub_phones(&body_text);
            error!(msg_ref = %reference, http_status = %status_u16, "NextSMS rejected request");
            return Err(SmsError::ProviderRejected(snippet));
        }
        if status_u16 == 429 {
            error!(msg_ref = %reference, "NextSMS rate limited");
            return Err(SmsError::ProviderRateLimited);
        }
        if status_code.is_server_error() || status_u16 >= 500 {
            error!(msg_ref = %reference, http_status = %status_u16, "NextSMS server error");
            return Err(SmsError::ProviderUnavailable);
        }

        // 2. Parse 200 (or other non-error HTTP statuses if any)
        let parsed: Result<NextSmsResponse, _> = serde_json::from_str(&body_text);
        let mut status_id = -1;
        let mut status_name = None;
        let mut message_id = None;

        if let Ok(ref p) = parsed {
            if let Some(msgs) = &p.messages {
                if let Some(m) = msgs.first() {
                    message_id = m.sendReference.clone();
                    if let Some(s) = &m.status {
                        if let Some(id) = s.id {
                            status_id = id;
                        }
                        status_name = s.name.clone();
                    }
                }
            } else if let Some(s) = &p.status {
                if let Some(id) = s.id {
                    status_id = id;
                }
                status_name = s.name.clone();
            }
        } else {
            // Non-JSON body tolerated
            let snippet = super::scrub_phones(&body_text);
            error!(msg_ref = %reference, "NextSMS non-JSON body received");
            return Err(SmsError::ProviderRejected(snippet));
        }

        match status_id {
            50 | 51 | 52 | 88 | 73 | 109 => {
                info!(msg_ref = %reference, status_id = %status_id, "NextSMS delivery successful");
                Ok(SendOutcome {
                    message_id,
                    status_id,
                    status_name,
                })
            }
            57 => {
                error!(msg_ref = %reference, status_id = %status_id, "NextSMS no credits");
                Err(SmsError::NoCredits)
            }
            56 | 58 => {
                error!(msg_ref = %reference, status_id = %status_id, "NextSMS sender not approved");
                Err(SmsError::SenderNotApproved(format!("Status ID {}: {}", status_id, body_text)))
            }
            61 => {
                error!(msg_ref = %reference, status_id = %status_id, "NextSMS test mode recipient");
                Err(SmsError::TestModeRecipient(format!("Status ID {}: {}", status_id, body_text)))
            }
            other => {
                error!(msg_ref = %reference, status_id = %other, "NextSMS unknown status id");
                Err(SmsError::Unknown(other))
            }
        }
    }
}
