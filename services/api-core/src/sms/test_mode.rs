use super::{nextsms::NextSmsSender, SmsError, SmsReceipt, SmsSender};
use async_trait::async_trait;

pub struct TestModeSender {
    inner: NextSmsSender,
}

impl TestModeSender {
    pub fn new(base_url: String, api_token: String, sender_id: String) -> Self {
        Self {
            inner: NextSmsSender::new(base_url, api_token, sender_id, true),
        }
    }
}

#[async_trait]
impl SmsSender for TestModeSender {
    async fn send(&self, to: &str, text: &str, msg_ref: &str) -> Result<SmsReceipt, SmsError> {
        self.inner.send(to, text, msg_ref).await
    }
}
