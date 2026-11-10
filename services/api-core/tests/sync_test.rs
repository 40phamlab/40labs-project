use api_core::{
    auth::device::{issue_access_token, verify_access_token, DeviceIdentity},
    config::DeviceTokenKeys,
    sync::validate::{decompress_gzip, validate_push_payload, ChangeItem, PushRequest},
};

#[test]
fn test_server_signed_device_token_roundtrip_and_forgery_rejection() {
    let keys = DeviceTokenKeys::parse(
        "key-1".into(),
        r#"{"key-1":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"}"#,
    )
    .unwrap();
    let identity = DeviceIdentity {
        workspace_id: "ws_123".into(),
        business_id: "biz_123".into(),
        branch_id: "branch_123".into(),
        device_id: "dev_123".into(),
        token_version: 1,
    };
    let now = chrono::Utc::now();
    let token = issue_access_token(&keys, &identity, now).unwrap();
    let decoded = verify_access_token(&token, &keys, now).unwrap();
    assert_eq!(decoded.workspace_id, "ws_123");
    assert_eq!(decoded.branch_id, "branch_123");
    assert!(verify_access_token("eyJkZXZpY2VfaWQiOiJkZXYifQ", &keys, now).is_err());
}

#[test]
fn test_push_payload_validation_batch_limit() {
    let changes = (0..501)
        .map(|i| ChangeItem {
            change_id: format!("chg-{i}"),
            entity: "business".into(),
            entity_id: "biz-1".into(),
            op: "upsert".into(),
            version: 1,
            payload: serde_json::json!({}),
            created_at: "2026-10-24T15:00:00Z".into(),
        })
        .collect();
    let req = PushRequest {
        device_id: "dev-1".into(),
        batch_id: "batch-1".into(),
        app_version: "0.1.0".into(),
        changes,
    };
    assert!(validate_push_payload(&req).is_err());
}

#[test]
fn test_decompress_gzip_size_limit() {
    let large_data = vec![b'a'; 2_000_000];
    assert!(decompress_gzip(&large_data, 1_048_576).is_err());
}
