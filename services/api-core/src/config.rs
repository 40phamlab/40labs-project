use std::{collections::HashMap, env};

#[derive(Clone)]
pub struct DeviceTokenKeys {
    pub active_kid: String,
    keys: HashMap<String, Vec<u8>>,
    pub configuration_error: Option<String>,
}

impl std::fmt::Debug for DeviceTokenKeys {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("DeviceTokenKeys")
            .field("active_kid", &self.active_kid)
            .field("key_ids", &self.keys.keys().collect::<Vec<_>>())
            .field("keys", &"[REDACTED]")
            .field("configuration_error", &self.configuration_error)
            .finish()
    }
}

impl DeviceTokenKeys {
    pub fn parse(active_kid: String, source: &str) -> Result<Self, String> {
        let encoded: HashMap<String, String> = serde_json::from_str(source)
            .map_err(|error| format!("DEVICE_TOKEN_SIGNING_KEYS must be a JSON object: {error}"))?;
        if encoded.is_empty() {
            return Err("DEVICE_TOKEN_SIGNING_KEYS must contain at least one key".into());
        }
        let mut keys = HashMap::with_capacity(encoded.len());
        for (kid, hex_key) in encoded {
            if kid.is_empty()
                || kid.len() > 64
                || !kid
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
            {
                return Err(
                    "Device token key IDs must be 1-64 ASCII letters, digits, '-' or '_'".into(),
                );
            }
            let bytes = hex::decode(hex_key)
                .map_err(|_| format!("Device token key {kid} must be hexadecimal"))?;
            if bytes.len() < 32 {
                return Err(format!("Device token key {kid} must be at least 32 bytes"));
            }
            keys.insert(kid, bytes);
        }
        if !keys.contains_key(&active_kid) {
            return Err("DEVICE_TOKEN_SIGNING_KEY_ID must name a configured key".into());
        }
        Ok(Self {
            active_kid,
            keys,
            configuration_error: None,
        })
    }

    fn invalid(active_kid: String, error: String) -> Self {
        Self {
            active_kid,
            keys: HashMap::new(),
            configuration_error: Some(error),
        }
    }

    pub fn key(&self, kid: &str) -> Option<&[u8]> {
        self.keys.get(kid).map(Vec::as_slice)
    }

    pub fn active_key(&self) -> Option<&[u8]> {
        self.key(&self.active_kid)
    }

    pub fn key_ids(&self) -> impl Iterator<Item = &str> {
        self.keys.keys().map(String::as_str)
    }

    fn has_production_key_material(&self) -> bool {
        let development_key =
            hex::decode("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
                .unwrap();
        self.keys.values().all(|key| {
            key.iter()
                .copied()
                .collect::<std::collections::HashSet<_>>()
                .len()
                >= 16
                && key != &development_key
        })
    }
}

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub nextsms_base_url: String,
    pub nextsms_api_token: String,
    pub nextsms_username: String,
    pub nextsms_password: String,
    pub nextsms_sender_id: String,
    pub sms_mode: String,
    pub otp_provider: String,
    pub app_env: String,
    pub otp_enabled: bool,
    pub otp_daily_max: i32,
    pub activation_signing_key: String,
    pub port: u16,
    pub admin_web_origin: String,
    pub totp_enc_key: String,
    pub admin_debug_otp: bool,
    pub device_token_keys: DeviceTokenKeys,
}

fn get_env_or_file(var_name: &str, default: &str) -> String {
    let file_var = format!("{}_FILE", var_name);
    if let Ok(file_path) = env::var(&file_var) {
        let file_path = file_path.trim();
        if !file_path.is_empty() {
            match std::fs::read_to_string(file_path) {
                Ok(content) => return content.trim().to_string(),
                Err(e) => tracing::error!(
                    "Failed to read secret file for {} from {}: {}",
                    var_name,
                    file_path,
                    e
                ),
            }
        }
    }
    env::var(var_name).unwrap_or_else(|_| default.to_string())
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();
        let app_env = get_env_or_file("APP_ENV", "development");
        let sms_mode = get_env_or_file("SMS_MODE", "test");
        let default_provider = if sms_mode.to_lowercase() == "live" {
            "nextsms"
        } else {
            "console"
        };
        let otp_provider = get_env_or_file("OTP_PROVIDER", default_provider);
        let raw_token = get_env_or_file("NEXTSMS_API_TOKEN", "");
        let nextsms_api_token = crate::sms::sanitize_token(&raw_token);
        if !nextsms_api_token.is_empty() {
            tracing::info!("nextsms token loaded len={}", nextsms_api_token.len());
        } else if otp_provider.to_lowercase() == "nextsms" || sms_mode.to_lowercase() == "live" {
            tracing::error!("NEXTSMS_API_TOKEN is empty");
        }
        let active_kid = get_env_or_file("DEVICE_TOKEN_SIGNING_KEY_ID", "dev-1");
        let default_keys = if matches!(
            app_env.to_ascii_lowercase().as_str(),
            "development" | "test"
        ) {
            "{\"dev-1\":\"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\"}"
        } else {
            "{}"
        };
        let key_source = get_env_or_file("DEVICE_TOKEN_SIGNING_KEYS", default_keys);
        let device_token_keys = DeviceTokenKeys::parse(active_kid.clone(), &key_source)
            .unwrap_or_else(|error| {
                tracing::error!("Invalid device token signing configuration: {}", error);
                DeviceTokenKeys::invalid(active_kid, error)
            });
        Self {
            database_url: get_env_or_file(
                "DATABASE_URL",
                "postgres://postgres:postgres@localhost:5432/afya_core",
            ),
            nextsms_base_url: get_env_or_file(
                "NEXTSMS_BASE_URL",
                "https://messaging-service.co.tz",
            ),
            nextsms_api_token,
            nextsms_username: get_env_or_file("NEXTSMS_USERNAME", ""),
            nextsms_password: get_env_or_file("NEXTSMS_PASSWORD", ""),
            nextsms_sender_id: get_env_or_file("NEXTSMS_SENDER_ID", "40Labs"),
            sms_mode,
            otp_provider,
            app_env,
            otp_enabled: get_env_or_file("OTP_ENABLED", "1") == "1",
            otp_daily_max: get_env_or_file("OTP_DAILY_MAX", "200")
                .parse()
                .unwrap_or(200),
            activation_signing_key: get_env_or_file("ACTIVATION_SIGNING_KEY", ""),
            port: get_env_or_file("PORT", "3000").parse().unwrap_or(3000),
            admin_web_origin: get_env_or_file("ADMIN_WEB_ORIGIN", "http://localhost:5174"),
            totp_enc_key: get_env_or_file(
                "TOTP_ENC_KEY",
                "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            ),
            admin_debug_otp: get_env_or_file("ADMIN_DEBUG_OTP", "0") == "1",
            device_token_keys,
        }
    }

    pub fn validate_environment(&self) -> Result<(), String> {
        if !matches!(
            self.app_env.to_ascii_lowercase().as_str(),
            "development" | "test" | "production"
        ) {
            return Err("APP_ENV must be development, test, or production".into());
        }
        if self.app_env.eq_ignore_ascii_case("production") {
            self.validate_production()?;
        }
        Ok(())
    }

    pub fn validate_production(&self) -> Result<(), String> {
        if !self.app_env.eq_ignore_ascii_case("production") {
            return Ok(());
        }
        let origin = url::Url::parse(&self.admin_web_origin)
            .map_err(|_| "ADMIN_WEB_ORIGIN must be a valid URL")?;
        if origin.scheme() != "https"
            || origin.host_str().is_none()
            || matches!(origin.host_str(), Some("localhost" | "127.0.0.1" | "::1"))
            || origin.path() != "/"
            || origin.query().is_some()
            || origin.fragment().is_some()
            || !origin.username().is_empty()
            || origin.password().is_some()
        {
            return Err("ADMIN_WEB_ORIGIN must be an explicit HTTPS origin".into());
        }
        let key =
            hex::decode(&self.totp_enc_key).map_err(|_| "TOTP_ENC_KEY must be 32-byte hex")?;
        if key.len() != 32
            || !has_sufficient_key_diversity(&key)
            || self.totp_enc_key
                == "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        {
            return Err("TOTP_ENC_KEY must be a non-default 32-byte secret".into());
        }
        let activation_key = hex::decode(&self.activation_signing_key)
            .map_err(|_| "ACTIVATION_SIGNING_KEY must be hex")?;
        if activation_key.len() < 32 || !has_sufficient_key_diversity(&activation_key) {
            return Err("ACTIVATION_SIGNING_KEY must contain at least 32 bytes".into());
        }
        if !crate::auth::device::key_configuration_is_valid(self)
            || !self.device_token_keys.has_production_key_material()
        {
            return Err("Device token signing keys are not configured".into());
        }
        if self.admin_debug_otp {
            return Err("ADMIN_DEBUG_OTP must be disabled in production".into());
        }
        Ok(())
    }
}

fn has_sufficient_key_diversity(bytes: &[u8]) -> bool {
    bytes
        .iter()
        .copied()
        .collect::<std::collections::HashSet<_>>()
        .len()
        >= 16
}

#[cfg(test)]
mod production_config_tests {
    use super::*;

    fn prod_config() -> Config {
        Config {
            database_url: "postgres://example/db".into(),
            nextsms_base_url: String::new(),
            nextsms_api_token: String::new(),
            nextsms_username: String::new(),
            nextsms_password: String::new(),
            nextsms_sender_id: "sender".into(),
            sms_mode: "live".into(),
            otp_provider: "nextsms".into(),
            app_env: "production".into(),
            otp_enabled: true,
            otp_daily_max: 1,
            activation_signing_key: hex::encode((96u8..128).collect::<Vec<_>>()),
            port: 3000,
            admin_web_origin: "https://admin.example.test".into(),
            totp_enc_key: hex::encode((64u8..96).collect::<Vec<_>>()),
            admin_debug_otp: false,
            device_token_keys: DeviceTokenKeys::parse(
                "v1".into(),
                &format!(
                    r#"{{"v1":"{}"}}"#,
                    hex::encode((32u8..64).collect::<Vec<_>>())
                ),
            )
            .unwrap(),
        }
    }

    #[test]
    fn production_config_requires_explicit_non_default_secrets_and_https_origin() {
        assert!(prod_config().validate_production().is_ok());
        assert!(prod_config().validate_environment().is_ok());
        let mut unknown = prod_config();
        unknown.app_env = "prod".into();
        assert!(unknown.validate_environment().is_err());
        let mut config = prod_config();
        config.admin_web_origin = "http://localhost:5174".into();
        assert!(config.validate_production().is_err());
        let mut config = prod_config();
        config.admin_web_origin = "https://admin.example.test/path".into();
        assert!(config.validate_production().is_err());
        let mut config = prod_config();
        config.totp_enc_key =
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".into();
        assert!(config.validate_production().is_err());
        let mut config = prod_config();
        config.totp_enc_key = "22".repeat(32);
        assert!(config.validate_production().is_err());
        let mut config = prod_config();
        config.activation_signing_key = "00".repeat(32);
        assert!(config.validate_production().is_err());
        let mut config = prod_config();
        config.admin_debug_otp = true;
        assert!(config.validate_production().is_err());
    }
}
