use super::{nextsms::NextSmsProvider, SendOutcome, SmsError, OtpProvider};
use async_trait::async_trait;

pub struct TestModeProvider {
    inner: NextSmsProvider,
}

pub type TestModeSender = TestModeProvider;

impl TestModeProvider {
    pub fn new(base_url: String, api_token: String, sender_id: String) -> Self {
        Self {
            inner: NextSmsProvider::new(base_url, api_token, sender_id, true),
        }
    }
}

#[async_trait]
impl OtpProvider for TestModeProvider {
    async fn send(&self, to: &str, text: &str, msg_ref: &str) -> Result<SendOutcome, SmsError> {
        self.inner.send(to, text, msg_ref).await
    }
}
