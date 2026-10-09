use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Instant, Duration};

#[derive(Clone)]
pub struct RateLimiter {
    storage: Arc<Mutex<HashMap<String, Vec<Instant>>>>,
}

impl RateLimiter {
    pub fn new() -> Self {
        Self {
            storage: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn check_rate_limit(&self, key: &str, max_requests: usize, window: Duration) -> Result<(), u64> {
        let mut map = self.storage.lock().unwrap();
        let now = Instant::now();
        let entry = map.entry(key.to_string()).or_default();

        entry.retain(|t| now.duration_since(*t) < window);

        if entry.len() >= max_requests {
            let oldest = entry.first().cloned().unwrap_or(now);
            let elapsed = now.duration_since(oldest);
            let retry_after = if window > elapsed {
                (window - elapsed).as_secs()
            } else {
                1
            };
            return Err(retry_after.max(1));
        }

        entry.push(now);
        Ok(())
    }
}
