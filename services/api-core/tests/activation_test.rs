use api_core::{
    otp::{hash_otp, verify_otp_hash},
    grant::{sign_grant, ActivationGrantPayload, generate_business_id},
    ratelimit::RateLimiter,
};
use ed25519_dalek::{SigningKey, VerifyingKey, Verifier, Signature};
use std::time::Duration;

#[test]
fn test_otp_generation_and_verification() {
    let secret = b"test_secret_key";
    let code = "123456";
    let h = hash_otp(code, secret);
    assert!(verify_otp_hash(code, &h, secret));
    assert!(!verify_otp_hash("654321", &h, secret));
}

#[test]
fn test_grant_signing_and_tamper_rejection() {
    let signing_key_bytes = [42u8; 32];
    let signing_key = SigningKey::from_bytes(&signing_key_bytes);
    let verifying_key = VerifyingKey::from(&signing_key);
    let hex_key = hex::encode(signing_key_bytes);

    let payload = ActivationGrantPayload {
        business_id: generate_business_id(),
        workspace_id: "ws_test".into(),
        branch_id: "branch_test".into(),
        phone_hash: "hash123".into(),
        issued_at: "2025-01-01T00:00:00Z".into(),
    };

    let grant = sign_grant(&payload, &hex_key).expect("Failed to sign grant");
    let parts: Vec<&str> = grant.split('.').collect();
    assert_eq!(parts.len(), 2);

    let payload_b64 = parts[0];
    let sig_hex = parts[1];

    use base64::engine::general_purpose::URL_SAFE_NO_PAD;
    use base64::Engine;
    let json_bytes = URL_SAFE_NO_PAD.decode(payload_b64).unwrap();
    let sig_bytes = hex::decode(sig_hex).unwrap();
    let mut sig_arr = [0u8; 64];
    sig_arr.copy_from_slice(&sig_bytes);
    let signature = Signature::from_bytes(&sig_arr);

    assert!(verifying_key.verify(&json_bytes, &signature).is_ok());

    let mut tampered_bytes = json_bytes.clone();
    tampered_bytes.push(b'X');
    assert!(verifying_key.verify(&tampered_bytes, &signature).is_err());
}

#[test]
fn test_rate_limiter() {
    let limiter = RateLimiter::new();
    let key = "test_key";

    assert!(limiter.check_rate_limit(key, 2, Duration::from_secs(60)).is_ok());
    assert!(limiter.check_rate_limit(key, 2, Duration::from_secs(60)).is_ok());

    let res = limiter.check_rate_limit(key, 2, Duration::from_secs(60));
    assert!(res.is_err());
}
