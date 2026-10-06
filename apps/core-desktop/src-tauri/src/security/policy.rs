use regex::Regex;

#[derive(Debug, thiserror::Error)]
pub enum PolicyError {
    #[error("Username must be 3-32 characters, lowercase alphanumeric, dots, underscores, or hyphens")]
    InvalidUsername,
    #[error("Password must be 8-128 characters and cannot equal the username")]
    InvalidPasswordLengthOrEquality,
    #[error("Password is too common or appears on the denylist")]
    CommonPassword,
    #[error("PIN must be exactly 6 digits and cannot be trivial (all same, sequential, or common)")]
    InvalidPin,
}

const COMMON_PASSWORDS: &[&str] = &[
    "password", "password123", "12345678", "qwertyuiop", "admin123",
    "letmein123", "welcome123", "changeme", "secret123", "password1",
    "123456789", "123456783", "qwerty1234", "abc123456", "password2025"
];

const TRIVIAL_PINS: &[&str] = &[
    "000000", "111111", "222222", "333333", "444444",
    "555555", "666666", "777777", "888888", "999999",
    "123456", "654321", "121212", "112233", "789012"
];

pub fn validate_username(username: &str) -> Result<String, PolicyError> {
    let normalized = username.trim().to_lowercase();
    if normalized.len() < 3 || normalized.len() > 32 {
        return Err(PolicyError::InvalidUsername);
    }
    let re = Regex::new(r"^[a-z0-9._-]+$").unwrap();
    if !re.is_match(&normalized) {
        return Err(PolicyError::InvalidUsername);
    }
    Ok(normalized)
}

pub fn validate_password(password: &str, username: &str) -> Result<(), PolicyError> {
    if password.len() < 8 || password.len() > 128 {
        return Err(PolicyError::InvalidPasswordLengthOrEquality);
    }
    let norm_user = username.trim().to_lowercase();
    if password.trim().to_lowercase() == norm_user {
        return Err(PolicyError::InvalidPasswordLengthOrEquality);
    }
    if COMMON_PASSWORDS.contains(&password.trim().to_lowercase().as_str()) {
        return Err(PolicyError::CommonPassword);
    }
    Ok(())
}

pub fn validate_pin(pin: &str) -> Result<(), PolicyError> {
    if pin.len() != 6 || !pin.chars().all(|c| c.is_ascii_digit()) {
        return Err(PolicyError::InvalidPin);
    }
    if TRIVIAL_PINS.contains(&pin) {
        return Err(PolicyError::InvalidPin);
    }

    // Check all-same digits (e.g., 444444)
    let bytes = pin.as_bytes();
    if bytes.windows(2).all(|w| w[0] == w[1]) {
        return Err(PolicyError::InvalidPin);
    }

    // Check ascending sequence (e.g., 123456)
    let is_ascending = bytes.windows(2).all(|w| w[1] == w[0] + 1);
    if is_ascending {
        return Err(PolicyError::InvalidPin);
    }

    // Check descending sequence (e.g., 654321)
    let is_descending = bytes.windows(2).all(|w| w[1] == w[0] - 1);
    if is_descending {
        return Err(PolicyError::InvalidPin);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_username() {
        assert_eq!(validate_username("  Amani_Owner.1  ").unwrap(), "amani_owner.1");
        assert!(validate_username("ab").is_err());
        assert!(validate_username("invalid username!").is_err());
    }

    #[test]
    fn test_validate_password() {
        assert!(validate_password("ValidPassword!9", "amani").is_ok());
        assert!(validate_password("short", "amani").is_err());
        assert!(validate_password("amani", "amani").is_err());
        assert!(validate_password("password123", "amani").is_err());
    }

    #[test]
    fn test_validate_pin() {
        assert!(validate_pin("482916").is_ok());
        assert!(validate_pin("123456").is_err());
        assert!(validate_pin("654321").is_err());
        assert!(validate_pin("111111").is_err());
        assert!(validate_pin("12345").is_err());
    }
}
