use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

pub fn init() {
    let _ = tracing_log::LogTracer::init();

    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,app=debug,sqlx=warn"));

    let _ = tracing_subscriber::registry()
        .with(env_filter)
        .with(tracing_subscriber::fmt::layer())
        .try_init();

    tracing::info!("[40Labs AUTH] backend = TAURI-IPC (Tracing initialized)");
}

// Alias for backward compatibility if needed
pub fn init_tracing() {
    init();
}

pub fn redact_sensitive(input: &str) -> String {
    // Redaction rule: NEVER log passwords, PINs, recovery codes, OTP codes, tokens, hashes, or full phone numbers - last 3 digits only.
    if input.starts_with('+') || (input.chars().all(|c| c.is_ascii_digit()) && input.len() == 10) {
        if input.len() >= 3 {
            let last3 = &input[input.len() - 3..];
            return format!("***-***-{}", last3);
        }
    }
    "[REDACTED]".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_debug_init_twice() {
        init();
        init(); // Should not panic
    }
}
