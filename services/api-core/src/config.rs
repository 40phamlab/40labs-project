use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub nextsms_base_url: String,
    pub nextsms_api_token: String,
    pub nextsms_username: String,
    pub nextsms_password: String,
    pub nextsms_sender_id: String,
    pub sms_mode: String,
    pub otp_enabled: bool,
    pub otp_daily_max: i32,
    pub activation_signing_key: String,
    pub port: u16,
}

fn get_env_or_file(var_name: &str, default: &str) -> String {
    let file_var = format!("{}_FILE", var_name);
    if let Ok(file_path) = env::var(&file_var) {
        let file_path = file_path.trim();
        if !file_path.is_empty() {
            match std::fs::read_to_string(file_path) {
                Ok(content) => return content.trim().to_string(),
                Err(e) => {
                    tracing::error!("Failed to read secret file for {} from {}: {}", var_name, file_path, e);
                }
            }
        }
    }
    env::var(var_name).unwrap_or_else(|_| default.to_string())
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();
        Self {
            database_url: get_env_or_file("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/afya_core"),
            nextsms_base_url: get_env_or_file("NEXTSMS_BASE_URL", "https://messaging-service.co.tz"),
            nextsms_api_token: get_env_or_file("NEXTSMS_API_TOKEN", ""),
            nextsms_username: get_env_or_file("NEXTSMS_USERNAME", ""),
            nextsms_password: get_env_or_file("NEXTSMS_PASSWORD", ""),
            nextsms_sender_id: get_env_or_file("NEXTSMS_SENDER_ID", "40Labs"),
            sms_mode: get_env_or_file("SMS_MODE", "test"),
            otp_enabled: get_env_or_file("OTP_ENABLED", "1") == "1",
            otp_daily_max: get_env_or_file("OTP_DAILY_MAX", "200").parse().unwrap_or(200),
            activation_signing_key: get_env_or_file("ACTIVATION_SIGNING_KEY", ""),
            port: get_env_or_file("PORT", "3000").parse().unwrap_or(3000),
        }
    }
}
