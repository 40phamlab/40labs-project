use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub nextsms_base_url: String,
    pub nextsms_username: String,
    pub nextsms_password: String,
    pub nextsms_sender_id: String,
    pub sms_mode: String,
    pub otp_enabled: bool,
    pub otp_daily_max: i32,
    pub activation_signing_key: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();
        Self {
            database_url: env::var("DATABASE_URL").unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/afya_core".into()),
            nextsms_base_url: env::var("NEXTSMS_BASE_URL").unwrap_or_else(|_| "https://messaging-service.co.tz".into()),
            nextsms_username: env::var("NEXTSMS_USERNAME").unwrap_or_default(),
            nextsms_password: env::var("NEXTSMS_PASSWORD").unwrap_or_default(),
            nextsms_sender_id: env::var("NEXTSMS_SENDER_ID").unwrap_or_else(|_| "40Labs".into()),
            sms_mode: env::var("SMS_MODE").unwrap_or_else(|_| "test".into()),
            otp_enabled: env::var("OTP_ENABLED").unwrap_or_else(|_| "1".into()) == "1",
            otp_daily_max: env::var("OTP_DAILY_MAX").unwrap_or_else(|_| "200".into()).parse().unwrap_or(200),
            activation_signing_key: env::var("ACTIVATION_SIGNING_KEY").unwrap_or_else(|_| "".into()),
            port: env::var("PORT").unwrap_or_else(|_| "3000".into()).parse().unwrap_or(3000),
        }
    }
}
