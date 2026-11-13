use std::{
    fs::OpenOptions,
    io::Write,
    path::PathBuf,
    sync::{Mutex, OnceLock},
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

static REGISTRATION_LOG_PATH: OnceLock<PathBuf> = OnceLock::new();
static REGISTRATION_LOG_LOCK: Mutex<()> = Mutex::new(());

pub fn configure_registration_log(path: PathBuf) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|error| error.to_string())?;
    REGISTRATION_LOG_PATH
        .set(path)
        .map_err(|_| "Registration log path was already configured".to_string())
}

/// Writes only fixed stage names, status, and elapsed time to the dedicated log.
/// Callers must never pass user input, tokens, or raw error strings here.
pub fn registration_event(stage: &'static str, outcome: &'static str, elapsed_ms: Option<u128>) {
    let Some(path) = REGISTRATION_LOG_PATH.get() else {
        tracing::warn!(
            stage,
            outcome,
            "Registration diagnostic log is not configured"
        );
        return;
    };
    let _guard = REGISTRATION_LOG_LOCK.lock().ok();
    let timestamp = chrono::Utc::now().to_rfc3339();
    let elapsed = elapsed_ms
        .map(|ms| format!(" elapsed_ms={ms}"))
        .unwrap_or_default();
    let line = format!("{timestamp} registration stage={stage} outcome={outcome}{elapsed}\n");
    match OpenOptions::new().create(true).append(true).open(path) {
        Ok(mut file) => {
            if let Err(error) = file.write_all(line.as_bytes()) {
                tracing::warn!(error = %error, "Could not write registration diagnostic log");
            }
        }
        Err(error) => tracing::warn!(error = %error, "Could not open registration diagnostic log"),
    }
}

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
