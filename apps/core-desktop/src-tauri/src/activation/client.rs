use super::{ActivationClient, OtpClient};
use std::sync::Arc;

pub struct ActivationClientFactory;

impl ActivationClientFactory {
    pub fn create_clients(base_url: Option<String>, pubkey_hex: Option<String>) -> (Arc<dyn OtpClient>, Arc<dyn ActivationClient>) {
        let url = base_url.unwrap_or_else(|| "http://localhost:3000".into());

        #[cfg(debug_assertions)]
        {
            if std::env::var("DEV_ACTIVATION").unwrap_or_default() == "1" {
                if let Ok(dev) = crate::activation::dev_client::DevActivationClient::new() {
                    let arc = Arc::new(dev);
                    return (arc.clone(), arc);
                }
            }
        }

        let http = crate::activation::http_client::HttpActivationClient::new(
            url,
            pubkey_hex.as_deref(),
        ).expect("Failed to initialize HttpActivationClient");
        let arc = Arc::new(http);
        (arc.clone(), arc)
    }
}
