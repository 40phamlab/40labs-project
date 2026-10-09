use api_core::sms::{nextsms::NextSmsSender, test_mode::TestModeSender, SmsSender};
use wiremock::{
    matchers::{header, method, path},
    Mock, MockServer, ResponseTemplate,
};

#[tokio::test]
async fn test_nextsms_success_status_groups() {
    for status_id in [50, 51, 52, 73, 88, 109] {
        let mock_server = MockServer::start().await;
        let token = "secret_test_token_12345";
        let sender_id = "40Labs";

        Mock::given(method("POST"))
            .and(path("/api/sms/v2/text/single"))
            .and(header("Authorization", format!("Bearer {}", token).as_str()))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "status": { "id": status_id, "name": "SUCCESS" },
                "messages": [{ "messageId": "msg-123", "status": { "id": status_id } }]
            })))
            .mount(&mock_server)
            .await;

        let sender = NextSmsSender::new(mock_server.uri(), token.to_string(), sender_id.to_string(), false);
        let result = sender.send("255712345678", "Test OTP 123456", "ref-001").await;
        assert!(result.is_ok(), "Expected success for status_id {}", status_id);
        let receipt = result.unwrap();
        assert_eq!(receipt.status_id, status_id);
    }
}

#[tokio::test]
async fn test_nextsms_no_credits_kill_switch() {
    let mock_server = MockServer::start().await;
    let token = "secret_test_token_12345";

    Mock::given(method("POST"))
        .and(path("/api/sms/v2/text/single"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "status": { "id": 57, "name": "NO_CREDITS" }
        })))
        .mount(&mock_server)
        .await;

    let sender = NextSmsSender::new(mock_server.uri(), token.to_string(), "40Labs".to_string(), false);
    let result = sender.send("0712345678", "OTP text", "ref-002").await;
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), api_core::sms::SmsError::NoCredits));
}

#[tokio::test]
async fn test_test_mode_sender_hits_test_endpoint() {
    let mock_server = MockServer::start().await;
    let token = "test_token_abc";

    Mock::given(method("POST"))
        .and(path("/api/sms/v2/test/text/single"))
        .and(header("Authorization", format!("Bearer {}", token).as_str()))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "status": { "id": 50, "name": "TEST_SUCCESS" }
        })))
        .mount(&mock_server)
        .await;

    let test_sender = TestModeSender::new(mock_server.uri(), token.to_string(), "40Labs".to_string());
    let result = test_sender.send("+255712345678", "OTP 999999", "ref-test").await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap().status_id, 50);
}

#[tokio::test]
async fn test_status_65_regenerate_ref_retry() {
    let mock_server = MockServer::start().await;
    let token = "token_65";

    // First call returns status 65
    Mock::given(method("POST"))
        .and(path("/api/sms/v2/text/single"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "status": { "id": 65, "name": "REGENERATE_REF" }
        })))
        .up_to_n_times(1)
        .mount(&mock_server)
        .await;

    // Second call (with regenerated ref -r1) succeeds
    Mock::given(method("POST"))
        .and(path("/api/sms/v2/text/single"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "status": { "id": 50, "name": "SUCCESS" }
        })))
        .mount(&mock_server)
        .await;

    let sender = NextSmsSender::new(mock_server.uri(), token.to_string(), "40Labs".to_string(), false);
    let result = sender.send("255712345678", "OTP", "ref-65").await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap().status_id, 50);
}
