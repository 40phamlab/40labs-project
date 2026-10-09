use super::{SmsError, SmsSender};
use async_trait::async_trait;
use tracing::info;

pub struct TestModeSender;

#[async_trait]
impl SmsSender for TestModeSender {
    async fn send(&self, to: &str, text: &str, msg_id: &str) -> Result<(), SmsError> {
        info!("[TEST MODE SMS] To: {}, MsgId: {}, Text: {}", to, msg_id, text);
        Ok(())
    }
}
