use api_core::sms::{
    console::ConsoleOtpProvider,
    nextsms::NextSmsProvider,
    OtpProvider, SmsError,
};
use wiremock::{
    matchers::{method, path},
    Mock, MockServer, ResponseTemplate,
};

fn init_tracing() {
    let _ = tracing_subscriber::fmt()
        .with_test_writer()
        .try_init();
}

#[tokio::test]
async fn test_nextsms_401() {
    init_tracing();
    let mock_server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/api/sms/v2/text/single"))
        .respond_with(ResponseTemplate::new(401).set_body_string("Unauthorized"))
        .mount(&mock_server)
        .await;

    let provider = NextSmsProvider::new(mock_server.uri(), "token".to_string(), "40Labs".to_string(), false);
    let res = provider.send("255712345678", "OTP 123456", "ref-401").await;
    assert!(res.is_err());
    assert!(matches!(res.unwrap_err(), SmsError::ProviderAuth));
}

#[tokio::test]
async fn test_nextsms_429() {
    init_tracing();
    let mock_server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/api/sms/v2/text/single"))
        .respond_with(ResponseTemplate::new(429).set_body_string("Rate Limited"))
        .mount(&mock_server)
        .await;

    let provider = NextSmsProvider::new(mock_server.uri(), "token".to_string(), "40Labs".to_string(), false);
    let res = provider.send("255712345678", "OTP 123456", "ref-429").await;
    assert!(res.is_err());
    assert!(matches!(res.unwrap_err(), SmsError::ProviderRateLimited));
}

#[tokio::test]
async fn test_nextsms_500() {
    init_tracing();
    let mock_server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/api/sms/v2/text/single"))
        .respond_with(ResponseTemplate::new(500).set_body_string("Internal Error"))
        .mount(&mock_server)
        .await;

    let provider = NextSmsProvider::new(mock_server.uri(), "token".to_string(), "40Labs".to_string(), false);
    let res = provider.send("255712345678", "OTP 123456", "ref-500").await;
    assert!(res.is_err());
    assert!(matches!(res.unwrap_err(), SmsError::ProviderUnavailable));
}

#[tokio::test]
async fn test_nextsms_timeout() {
    init_tracing();
    let mock_server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/api/sms/v2/text/single"))
        .respond_with(ResponseTemplate::new(200).set_delay(std::time::Duration::from_secs(12)))
        .mount(&mock_server)
        .await;

    let provider = NextSmsProvider::new(mock_server.uri(), "token".to_string(), "40Labs".to_string(), false);
    let res = provider.send("255712345678", "OTP 123456", "ref-timeout").await;
    assert!(res.is_err());
    assert!(matches!(res.unwrap_err(), SmsError::ProviderUnavailable));
}

#[tokio::test]
async fn test_nextsms_200_status_56() {
    init_tracing();
    let mock_server = MockServer::start().await;
    let body = serde_json::json!({
        "messages": [{
            "to": "255712345678",
            "status": {
                "id": 56,
                "name": "REJECTED_SOURCE"
            },
            "sendReference": "123456789012345678"
        }]
    });
    Mock::given(method("POST"))
        .and(path("/api/sms/v2/text/single"))
        .respond_with(ResponseTemplate::new(200).set_body_json(body))
        .mount(&mock_server)
        .await;

    let provider = NextSmsProvider::new(mock_server.uri(), "token".to_string(), "40Labs".to_string(), false);
    let res = provider.send("255712345678", "OTP 123456", "ref-56").await;
    assert!(res.is_err());
    assert!(matches!(res.unwrap_err(), SmsError::SenderNotApproved(_)));
}

#[tokio::test]
async fn test_nextsms_200_status_50_large_ref() {
    init_tracing();
    let mock_server = MockServer::start().await;
    let body = serde_json::json!({
        "messages": [{
            "to": "255712345678",
            "status": {
                "id": 50,
                "name": "DELIVERED"
            },
            "sendReference": 9007199254740993_i64
        }]
    });
    Mock::given(method("POST"))
        .and(path("/api/sms/v2/text/single"))
        .respond_with(ResponseTemplate::new(200).set_body_json(body))
        .mount(&mock_server)
        .await;

    let provider = NextSmsProvider::new(mock_server.uri(), "token".to_string(), "40Labs".to_string(), false);
    let res = provider.send("255712345678", "OTP 123456", "ref-large-ref").await;
    assert!(res.is_ok());
    let outcome = res.unwrap();
    assert_eq!(outcome.status_id, 50);
    assert_eq!(outcome.message_id.as_deref(), Some("9007199254740993"));
}

#[tokio::test]
async fn test_nextsms_non_json_body() {
    init_tracing();
    let mock_server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/api/sms/v2/text/single"))
        .respond_with(ResponseTemplate::new(200).set_body_string("Not JSON at all 255712345678"))
        .mount(&mock_server)
        .await;

    let provider = NextSmsProvider::new(mock_server.uri(), "token".to_string(), "40Labs".to_string(), false);
    let res = provider.send("255712345678", "OTP 123456", "ref-non-json").await;
    assert!(res.is_err());
    assert!(matches!(res.unwrap_err(), SmsError::ProviderRejected(_)));
}

#[tokio::test]
async fn test_console_provider() {
    init_tracing();
    let provider = ConsoleOtpProvider::new();
    let res = provider.send("255712345678", "Your 40Labs activation code is: 123456. Valid for 5 minutes.", "ref-console").await;
    assert!(res.is_ok());
    let outcome = res.unwrap();
    assert_eq!(outcome.status_id, 50);
    assert!(outcome.message_id.is_some());
}
