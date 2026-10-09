use api_core::sms::{nextsms::NextSmsSender, test_mode::TestModeSender, SmsSender};
use axum::{
    extract::Json,
    routing::post,
    Router,
};
use serde_json::json;

async fn mock_sms_handler(Json(payload): Json<serde_json::Value>) -> Json<serde_json::Value> {
    let reference = payload.get("reference").and_then(|v| v.as_str()).unwrap_or("");
    if reference.contains("56") || reference.contains("rejected") {
        Json(json!({
            "messages": [{
                "to": "255712345678",
                "status": {
                    "groupId": 3,
                    "groupName": "REJECTED",
                    "id": 56,
                    "name": "REJECTED_SOURCE",
                    "description": "Sender ID is not registered"
                },
                "sendReference": "123456789012345678",
                "smsCount": 1,
                "sort": 0
            }]
        }))
    } else if reference.contains("57") || reference.contains("nocredits") {
        Json(json!({
            "messages": [{
                "to": "255712345678",
                "status": { "groupId": 4, "groupName": "FAILED", "id": 57, "name": "NO_CREDITS", "description": "Insufficient credit" },
                "sendReference": "123",
                "smsCount": 1,
                "sort": 0
            }]
        }))
    } else {
        Json(json!({
            "messages": [{
                "to": "255712345678",
                "status": { "groupId": 1, "groupName": "SUCCESS", "id": 50, "name": "DELIVERED" },
                "sendReference": 9007199254740992_i64,
                "smsCount": 1,
                "sort": 0
            }]
        }))
    }
}

async fn start_mock_server() -> String {
    let app = Router::new()
        .route("/api/sms/v2/text/single", post(mock_sms_handler))
        .route("/api/sms/v2/test/text/single", post(mock_sms_handler));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });
    format!("http://{}", addr)
}

#[tokio::test(flavor = "multi_thread")]
async fn test_sms_integration() {
    let base_url = start_mock_server().await;
    let token = "test_token_123";

    let sender = NextSmsSender::new(base_url.clone(), token.to_string(), "40Labs".to_string(), false);

    // Success test
    let res = sender.send("255712345678", "OTP", "ref-success").await;
    assert!(res.is_ok());
    assert_eq!(res.unwrap().status_id, 50);

    // Rejected source (status 56) fixture test
    let res_56 = sender.send("255712345678", "OTP", "ref-56-rejected").await;
    assert!(res_56.is_err());
    assert!(matches!(res_56.unwrap_err(), api_core::sms::SmsError::ConfigError(_)));

    // No credits (status 57) test
    let res_57 = sender.send("255712345678", "OTP", "ref-57-nocredits").await;
    assert!(res_57.is_err());
    assert!(matches!(res_57.unwrap_err(), api_core::sms::SmsError::NoCredits));

    // Test mode sender test
    let test_sender = TestModeSender::new(base_url, token.to_string(), "40Labs".to_string());
    let res_test = test_sender.send("255712345678", "OTP", "ref-testmode").await;
    assert!(res_test.is_ok());
}
