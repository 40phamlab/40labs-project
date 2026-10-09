use super::{SmsError, SmsSender};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::error;

pub struct NextSmsSender {
    client: Client,
    base_url: String,
    username: String,
    password: String,
    sender_id: String,
}

#[derive(Serialize)]
struct NextSmsRequest {
    from: String,
    to: String,
    text: String,
    #[serde(rename = "messageId")]
    message_id: String,
}

#[derive(Deserialize, Debug)]
struct NextSmsResponse {
    status: Option<NextSmsStatus>,
    messages: Option<Vec<NextSmsMessage>>,
}

#[derive(Deserialize, Debug)]
struct NextSmsStatus {
    groupId: Option<i32>,
    groupName: Option<String>,
    id: Option<i32>,
    name: Option<String>,
}

#[derive(Deserialize, Debug)]
struct NextSmsMessage {
    status: Option<NextSmsStatus>,
    messageId: Option<String>,
}

impl NextSmsSender {
    pub fn new(base_url: String, username: String, password: String, sender_id: String) -> Self {
        Self {
            client: Client::new(),
            base_url,
            username,
            password,
            sender_id,
        }
    }
}

#[async_trait]
impl SmsSender for NextSmsSender {
    async fn send(&self, to: &str, text: &str, msg_id: &str) -> Result<(), SmsError> {
        let url = format!("{}/api/sms/v1/text/single", self.base_url);
        let payload = NextSmsRequest {
            from: self.sender_id.clone(),
            to: to.to_string(),
            text: text.to_string(),
            message_id: msg_id.to_string(),
        };

        let mut attempts = 0;
        let max_retries = 2;

        loop {
            let res = self.client
                .post(&url)
                .basic_auth(&self.username, Some(&self.password))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .json(&payload)
                .send()
                .await;

            match res {
                Ok(resp) => {
                    let status_code = resp.status();
                    let body_text = resp.text().await.unwrap_or_default();

                    let parsed: Result<NextSmsResponse, _> = serde_json::from_str(&body_text);
                    let mut code = status_code.as_u16() as i32;
                    if let Ok(ref p) = parsed {
                        if let Some(s) = &p.status {
                            if let Some(id) = s.id {
                                code = id;
                            }
                        } else if let Some(msgs) = &p.messages {
                            if let Some(m) = msgs.first() {
                                if let Some(s) = &m.status {
                                    if let Some(id) = s.id {
                                        code = id;
                                    }
                                }
                            }
                        }
                    }

                    match code {
                        200..=299 => return Ok(()),
                        56 => return Err(SmsError::SenderNotRegistered),
                        57 | 60 => {
                            error!("CRITICAL: No credits on NextSMS (status {}). Trip kill switch!", code);
                            return Err(SmsError::NoCredits);
                        }
                        61 => return Err(SmsError::TestModeDestination),
                        54 | 69 => return Err(SmsError::InvalidNumber),
                        55 => return Err(SmsError::Dnd),
                        63 => return Err(SmsError::Flooding),
                        64 => {
                            if attempts < max_retries {
                                attempts += 1;
                                tokio::time::sleep(tokio::time::Duration::from_millis(500 * attempts as u64)).await;
                                continue;
                            } else {
                                return Err(SmsError::Retryable("Max retries exceeded for status 64".into()));
                            }
                        }
                        65 => {
                            return Err(SmsError::Retryable("Status 65: regenerate msgId".into()));
                        }
                        _ => {
                            if attempts < max_retries && (status_code.is_server_error() || code >= 500) {
                                attempts += 1;
                                tokio::time::sleep(tokio::time::Duration::from_millis(500 * attempts as u64)).await;
                                continue;
                            }
                            return Err(SmsError::Permanent(format!("NextSMS error status: {}, body: {}", code, body_text)));
                        }
                    }
                }
                Err(e) => {
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
