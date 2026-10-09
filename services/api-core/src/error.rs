use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Bad request: {0}")]
    BadRequest(String),
    #[error("Unauthorized: {0}")]
    Unauthorized(String),
    #[error("Conflict: {0}")]
    Conflict(String),
    #[error("Rate limit exceeded")]
    RateLimitExceeded { retry_after: u64 },
    #[error("SMS error: {0}")]
    Sms(String),
    #[error("Internal error: {0}")]
    Internal(String),
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    retry_after: Option<u64>,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, err_code, msg, retry) = match self {
            ApiError::Database(e) => (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR", e.to_string(), None),
            ApiError::BadRequest(m) => (StatusCode::BAD_REQUEST, "BAD_REQUEST", m, None),
            ApiError::Unauthorized(m) => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", m, None),
            ApiError::Conflict(m) => (StatusCode::CONFLICT, "CONFLICT", m, None),
            ApiError::RateLimitExceeded { retry_after } => (
                StatusCode::TOO_MANY_REQUESTS,
                "RATE_LIMIT_EXCEEDED",
                format!("Rate limit exceeded. Try again in {} seconds.", retry_after),
                Some(retry_after),
            ),
            ApiError::Sms(m) => (StatusCode::BAD_GATEWAY, "SMS_ERROR", m, None),
            ApiError::Internal(m) => (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", m, None),
        };

        let body = Json(ErrorResponse {
            error: err_code.to_string(),
            message: msg,
            retry_after: retry,
        });

        let mut response = body.into_response();
        *response.status_mut() = status;
        if let Some(ra) = retry {
            response.headers_mut().insert(
                axum::http::header::RETRY_AFTER,
                axum::http::HeaderValue::from_str(&ra.to_string()).unwrap(),
            );
        }
        response
    }
}
