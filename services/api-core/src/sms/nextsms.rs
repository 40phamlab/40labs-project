use super::{SmsError, SmsReceipt, SmsSender};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Deserializer, Serialize};
use tracing::{error, info};

pub struct NextSmsSender {
    client: Client,
    base_url: String,
    api_token: String,
    sender_id: String,
    is_test_mode: bool,
}

#[derive(Serialize)]
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

#[derive(Deserialize, Debug)]
#[allow(dead_code, non_snake_case)]
struct NextSmsErrorResponse {
    #[serde(rename = "requestError", default)]
    request_error: Option<NextSmsRequestError>,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code, non_snake_case)]
struct NextSmsRequestError {
    #[serde(rename = "serviceException", default)]
    service_exception: Option<NextSmsServiceException>,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code, non_snake_case)]
struct NextSmsServiceException {
    #[serde(default)]
    messageId: Option<String>,
    #[serde(default)]
    text: Option<String>,
}

fn deserialize_send_reference<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: Deserializer<'de>,
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

impl NextSmsSender {
    pub fn new(base_url: String, api_token: String, sender_id: String, is_test_mode: bool) -> Self {
        Self {
            client: Client::new(),
            base_url,
            api_token,
            sender_id,
            is_test_mode,
        }
    }

    fn map_status_to_result(status_id: i32, status_name: Option<String>, message_id: Option<String>, body_text: &str, msg_ref: &str) -> Result<SmsReceipt, SmsError> {
        // Never log the token or the OTP text; log message reference + status.id only.
        match status_id {
            50 | 51 | 52 | 73 | 88 | 109 => {
                info!(msg_ref = %msg_ref, status_id = %status_id, "NextSMS delivery successful");
                Ok(SmsReceipt {
                    message_id,
                    status_id,
                    status_name,
                })
            }
            57 => {
                error!(msg_ref = %msg_ref, status_id = %status_id, "CRITICAL: No credits on NextSMS (status 57). Trip kill switch!");
                Err(SmsError::NoCredits)
            }
            56 | 58 | 61 | 62 | 53 => {
                error!(msg_ref = %msg_ref, status_id = %status_id, "NextSMS configuration error");
                Err(SmsError::ConfigError(format!("Status ID {}: {}", status_id, body_text)))
            }
            54 | 68 | 69 => {
                error!(msg_ref = %msg_ref, status_id = %status_id, "NextSMS invalid phone number");
                Err(SmsError::InvalidPhone(format!("Status ID {}: {}", status_id, body_text)))
            }
            55 | 59 => {
                error!(msg_ref = %msg_ref, status_id = %status_id, "NextSMS recipient unreachable or DND");
                Err(SmsError::Unreachable(format!("Status ID {}: {}", status_id, body_text)))
            }
            63 | 110 => {
                error!(msg_ref = %msg_ref, status_id = %status_id, "NextSMS flooding detected");
                Err(SmsError::Flooding(format!("Status ID {}: {}", status_id, body_text)))
            }
            74 | 76 | 79 | 80 => {
                error!(msg_ref = %msg_ref, status_id = %status_id, "NextSMS delivery failed");
                Err(SmsError::DeliveryFailed(format!("Status ID {}: {}", status_id, body_text)))
            }
            other => {
                error!(msg_ref = %msg_ref, status_id = %other, "ALERT: Unknown NextSMS status id received");
                Err(SmsError::Unknown(other))
            }
        }
    }
}

#[async_trait]
impl SmsSender for NextSmsSender {
    async fn send(&self, to: &str, text: &str, msg_ref: &str) -> Result<SmsReceipt, SmsError> {
        let endpoint_path = if self.is_test_mode {
            "/api/sms/v2/test/text/single"
        } else {
            "/api/sms/v2/text/single"
        };
        let url = format!("{}{}", self.base_url, endpoint_path);
        let sanitized_to = sanitize_phone_number(to);

        let payload = NextSmsRequest {
            from: self.sender_id.clone(),
            to: sanitized_to,
            text: text.to_string(),
            flash: 0,
            reference: msg_ref.to_string(),
        };

        let mut attempts = 0;
        let max_retries = 2;
        let mut current_ref = msg_ref.to_string();

        loop {
            let current_payload = NextSmsRequest {
                from: payload.from.clone(),
                to: payload.to.clone(),
                text: payload.text.clone(),
                flash: 0,
                reference: current_ref.clone(),
            };

            let res = self.client
                .post(&url)
                .bearer_auth(&self.api_token)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .json(&current_payload)
                .send()
                .await;

            match res {
                Ok(resp) => {
                    let status_code = resp.status();
                    let body_text = resp.text().await.unwrap_or_default();

                    let parsed: Result<NextSmsResponse, _> = serde_json::from_str(&body_text);
                    let mut status_id = -1;
                    let mut status_name = None;
                    let mut message_id = None;
                    let mut messages_len = 0;

                    if let Ok(ref p) = parsed {
                        if let Some(msgs) = &p.messages {
                            messages_len = msgs.len();
                            if messages_len == 1 {
                                if let Some(m) = msgs.first() {
                                    message_id = m.sendReference.clone();
                                    if let Some(s) = &m.status {
                                        if let Some(id) = s.id {
                                            status_id = id;
                                        }
                                        status_name = s.name.clone();
                                    }
                                }
                            }
                        } else if let Some(s) = &p.status {
                            if let Some(id) = s.id {
                                status_id = id;
                            }
                            status_name = s.name.clone();
                        }
                    } else if let Ok(err_resp) = serde_json::from_str::<NextSmsErrorResponse>(&body_text) {
                        if let Some(err_obj) = err_resp.request_error {
                            if let Some(exc) = err_obj.service_exception {
                                error!(msg_ref = %current_ref, "NextSMS Service Exception");
                                return Err(SmsError::Permanent(format!(
                                    "NextSMS Service Exception [{}]: {}",
                                    exc.messageId.unwrap_or_default(),
                                    exc.text.unwrap_or_else(|| body_text.clone())
                                )));
                            }
                        }
                    }

                    // Handle status 64 (retry <= 2 with backoff)
                    if status_id == 64 {
                        if attempts < max_retries {
                            attempts += 1;
                            tokio::time::sleep(tokio::time::Duration::from_millis(500 * attempts as u64)).await;
                            continue;
                        } else {
                            return Err(SmsError::Retryable("Max retries exceeded for status 64".into()));
                        }
                    }

                    // Handle status 65 (regenerate ref + retry once)
                    if status_id == 65 {
                        if attempts < 1 {
                            attempts += 1;
                            current_ref = format!("{}-r1", msg_ref);
                            continue;
                        } else {
                            return Err(SmsError::Retryable("Status 65: retry exhausted after regenerating reference".into()));
                        }
                    }

                    // Success = HTTP 2xx AND messages.len() == 1 AND status.id in {50, 51, 52, 88, 73, 109}
                    let is_success_status = matches!(status_id, 50 | 51 | 52 | 73 | 88 | 109);
                    if status_code.is_success() && messages_len == 1 && is_success_status {
                        info!(msg_ref = %current_ref, status_id = %status_id, "NextSMS delivery successful");
                        return Ok(SmsReceipt {
                            message_id,
                            status_id,
                            status_name,
                        });
                    }

                    // Otherwise map error per table
                    if status_id == -1 {
                        status_id = status_code.as_u16() as i32;
                    }

                    return Self::map_status_to_result(status_id, status_name, message_id, &body_text, &current_ref);
                }
                Err(e) => {
                    error!("NextSMS HTTP transport error");
                    if attempts < max_retries {
                        attempts += 1;
                        tokio::time::sleep(tokio::time::Duration::from_millis(500 * attempts as u64)).await;
                        continue;
                    }
                    return Err(SmsError::Retryable(e.to_string()));
                }
            }
        }
    }
}
