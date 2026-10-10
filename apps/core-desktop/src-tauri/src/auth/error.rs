use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AuthErrorCode {
    InvalidCredentials,
    Locked,
    SessionLocked,
    SessionRequired,
    Forbidden,
    StepUpRequired,
    PinSetupRequired,
    PolicyViolation,
    NotConfigured,
    NetworkRequired,
    DatabaseError,
    NotFound,
    InternalError,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthErrorResponse {
    pub code: AuthErrorCode,
    pub retry_after_secs: Option<u64>,
}

#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    #[error("Invalid credentials")]
    InvalidCredentials { retry_after_secs: Option<u64> },
    #[error("Account is locked")]
    Locked { retry_after_secs: Option<u64> },
    #[error("Session is locked")]
    SessionLocked,
    #[error("Session required")]
    SessionRequired,
    #[error("Forbidden")]
    Forbidden,
    #[error("Step-up required")]
    StepUpRequired,
    #[error("PIN setup required")]
    PinSetupRequired,
    #[error("Policy violation: {0}")]
    PolicyViolation(String),
    #[error("Not configured")]
    NotConfigured,
    #[error("Network required")]
    NetworkRequired,
    #[error("Database error: {0}")]
    DatabaseError(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Internal error: {0}")]
    InternalError(String),
}

impl AuthError {
    pub fn to_response(&self) -> AuthErrorResponse {
        match self {
            AuthError::InvalidCredentials { retry_after_secs } => AuthErrorResponse {
                code: AuthErrorCode::InvalidCredentials,
                retry_after_secs: *retry_after_secs,
            },
            AuthError::Locked { retry_after_secs } => AuthErrorResponse {
                code: AuthErrorCode::Locked,
                retry_after_secs: *retry_after_secs,
            },
            AuthError::SessionLocked => AuthErrorResponse {
                code: AuthErrorCode::SessionLocked,
                retry_after_secs: None,
            },
            AuthError::SessionRequired => AuthErrorResponse {
                code: AuthErrorCode::SessionRequired,
                retry_after_secs: None,
            },
            AuthError::Forbidden => AuthErrorResponse {
                code: AuthErrorCode::Forbidden,
                retry_after_secs: None,
            },
            AuthError::StepUpRequired => AuthErrorResponse {
                code: AuthErrorCode::StepUpRequired,
                retry_after_secs: None,
            },
            AuthError::PinSetupRequired => AuthErrorResponse {
                code: AuthErrorCode::PinSetupRequired,
                retry_after_secs: None,
            },
            AuthError::PolicyViolation(_) => AuthErrorResponse {
                code: AuthErrorCode::PolicyViolation,
                retry_after_secs: None,
            },
            AuthError::NotConfigured => AuthErrorResponse {
                code: AuthErrorCode::NotConfigured,
                retry_after_secs: None,
            },
            AuthError::NetworkRequired => AuthErrorResponse {
                code: AuthErrorCode::NetworkRequired,
                retry_after_secs: None,
            },
            AuthError::DatabaseError(_) => AuthErrorResponse {
                code: AuthErrorCode::InternalError,
                retry_after_secs: None,
            },
            AuthError::NotFound(_) => AuthErrorResponse {
                code: AuthErrorCode::NotFound,
                retry_after_secs: None,
            },
            AuthError::InternalError(_) => AuthErrorResponse {
                code: AuthErrorCode::InternalError,
                retry_after_secs: None,
            },
        }
    }
}
