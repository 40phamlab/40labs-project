use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::{Instant, Duration};

#[derive(Clone)]
pub struct RateLimiter {
    storage: Arc<Mutex<HashMap<String, Vec<Instant>>>>,
    call_count: Arc<AtomicUsize>,
}

impl RateLimiter {
    pub fn new() -> Self {
        Self {
            storage: Arc::new(Mutex::new(HashMap::new())),
            call_count: Arc::new(AtomicUsize::new(0)),
        }
    }

    pub fn check_rate_limit(&self, key: &str, max_requests: usize, window: Duration) -> Result<(), u64> {
        let count = self.call_count.fetch_add(1, Ordering::Relaxed);
        let mut map = match self.storage.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        };
        let now = Instant::now();

        if count % 100 == 0 || map.len() > 1000 {
            map.retain(|_, timestamps| {
                timestamps.retain(|t| now.duration_since(*t) < Duration::from_secs(86400));
                !timestamps.is_empty()
            });
        }

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
