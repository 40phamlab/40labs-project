use std::collections::HashMap;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

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

    pub fn check_rate_limit(
        &self,
        key: &str,
        max_requests: usize,
        window: Duration,
    ) -> Result<(), u64> {
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

    /// Shared atomic limit for API instances. A database error fails closed with a
    /// retry interval instead of silently falling back to per-process counters.
    pub async fn check_rate_limit_shared(
        &self,
        pool: &sqlx::PgPool,
        key: &str,
        max_requests: usize,
        window: Duration,
    ) -> Result<(), u64> {
        use sha2::Digest;
        let key_hash = hex::encode(sha2::Sha256::digest(key.as_bytes()));
        let window_secs = window.as_secs().min(i32::MAX as u64) as i32;
        if key_hash.ends_with("00") {
            if let Err(error) = sqlx::query(
                "DELETE FROM api_rate_limit_buckets WHERE updated_at < NOW() - INTERVAL '1 day'",
            )
            .execute(pool)
            .await
            {
                tracing::warn!(error = %error, "rate_limit_bucket_cleanup_failed");
            }
        }
        let result: Result<(i64,), _> = sqlx::query_as(
            r#"INSERT INTO api_rate_limit_buckets(key_hash, window_started_at, hit_count)
               VALUES ($1, NOW(), 1)
               ON CONFLICT (key_hash) DO UPDATE SET
                 window_started_at = CASE
                   WHEN api_rate_limit_buckets.window_started_at + make_interval(secs => $2::double precision) <= NOW()
                   THEN NOW() ELSE api_rate_limit_buckets.window_started_at END,
                 hit_count = CASE
                   WHEN api_rate_limit_buckets.window_started_at + make_interval(secs => $2::double precision) <= NOW()
                   THEN 1 ELSE api_rate_limit_buckets.hit_count + 1 END,
                 updated_at = NOW()
               RETURNING hit_count"#,
        )
        .bind(key_hash)
        .bind(window_secs)
        .fetch_one(pool)
        .await;
        match result {
            Ok((count,)) if count <= max_requests as i64 => Ok(()),
            Ok(_) => Err(window_secs.max(1) as u64),
            Err(error) => {
                tracing::error!(error = %error, "shared_rate_limit_database_error");
                Err(window_secs.max(1) as u64)
            }
        }
    }
}
