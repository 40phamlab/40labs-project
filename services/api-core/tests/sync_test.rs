use api_core::{
    auth::device::{DeviceClaims, encode_dev_device_token, decode_dev_device_token},
    sync::validate::{decompress_gzip, validate_push_payload, PushRequest, ChangeItem},
    error::ApiError,
};

#[test]
fn test_device_token_encoding_and_decoding() {
    let claims = DeviceClaims {
        workspace_id: "ws_123".into(),
        business_id: "biz_123".into(),
        device_id: "dev_123".into(),
    };

    let token = encode_dev_device_token(&claims);
    let decoded = decode_dev_device_token(&token).expect("Failed to decode token");

    assert_eq!(decoded.workspace_id, "ws_123");
    assert_eq!(decoded.business_id, "biz_123");
    assert_eq!(decoded.device_id, "dev_123");
}

#[test]
fn test_push_payload_validation_batch_limit() {
    let mut changes = Vec::new();
    for i in 0..501 {
        changes.push(ChangeItem {
            change_id: format!("chg-{}", i),
            entity: "business".into(),
            entity_id: "biz-1".into(),
            op: "upsert".into(),
            version: 1,
            payload: serde_json::json!({}),
            created_at: "2026-10-24T15:00:00Z".into(),
        });
    }

    let req = PushRequest {
        device_id: "dev-1".into(),
        batch_id: "batch-1".into(),
        app_version: "0.1.0".into(),
        changes,
    };

    let result = validate_push_payload(&req);
    assert!(result.is_err());
}

#[test]
fn test_decompress_gzip_size_limit() {
    let large_data = vec![b'a'; 2_000_000]; // 2 MB
    let result = decompress_gzip(&large_data, 1_048_576);
    assert!(result.is_err());
}

#[test]
fn test_unauthorized_token_rejection() {
    let invalid_token = "not_valid_base64_json";
    let result = decode_dev_device_token(invalid_token);
    assert!(result.is_err());
}
