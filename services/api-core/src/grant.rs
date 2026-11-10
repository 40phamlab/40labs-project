use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use rand::{rngs::OsRng, Rng};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActivationGrantPayload {
    pub business_id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub phone_hash: String,
    pub issued_at: String,
    pub expires_at: String,
    pub issuer: String,
    pub audience: String,
    pub version: i32,
}

pub fn generate_business_id() -> String {
    let charset = b"ABCDEFGHJKMNPQRSTVWXYZ23456789";
    let mut rng = OsRng;
    let code: String = (0..6)
        .map(|_| {
            let idx = rng.gen_range(0..charset.len());
            charset[idx] as char
        })
        .collect();
    format!("AFYA-{}", code)
}

pub fn sign_grant(
    payload: &ActivationGrantPayload,
    signing_key_hex: &str,
) -> Result<String, String> {
    if signing_key_hex.is_empty() {
        return Err("Signing key is empty".into());
    }
    let decoded = hex::decode(signing_key_hex).map_err(|e| e.to_string())?;
    if decoded.len() < 32 {
        return Err("Signing key too short".into());
    }
    let mut b = [0u8; 32];
    b.copy_from_slice(&decoded[..32]);
    let signing_key = SigningKey::from_bytes(&b);
    let json_bytes = serde_json::to_vec(payload).map_err(|e| e.to_string())?;
    let signature = signing_key.sign(&json_bytes);
    let sig_hex = hex::encode(signature.to_bytes());
    let payload_b64 = base64_url(&json_bytes);
    Ok(format!("{}.{}", payload_b64, sig_hex))
}

fn base64_url(input: &[u8]) -> String {
    use base64::engine::general_purpose::URL_SAFE_NO_PAD;
    use base64::Engine;
    URL_SAFE_NO_PAD.encode(input)
}

pub const ACTIVATION_GRANT_ISSUER: &str = "40labs-api-core";
pub const ACTIVATION_GRANT_AUDIENCE: &str = "40labs-desktop-device-enrollment";

pub fn verify_grant(
    grant: &str,
    signing_key_hex: &str,
    now: chrono::DateTime<chrono::Utc>,
) -> Result<ActivationGrantPayload, String> {
    let (payload_b64, signature_hex) = grant
        .split_once('.')
        .ok_or("Invalid activation grant format")?;
    if signature_hex.contains('.') {
        return Err("Invalid activation grant format".into());
    }
    let bytes = base64::Engine::decode(
        &base64::engine::general_purpose::URL_SAFE_NO_PAD,
        payload_b64,
    )
    .map_err(|_| "Invalid activation grant payload encoding")?;
    let signature_bytes =
        hex::decode(signature_hex).map_err(|_| "Invalid activation grant signature encoding")?;
    let signature_array: [u8; 64] = signature_bytes
        .try_into()
        .map_err(|_| "Invalid activation grant signature length")?;
    let key_bytes = hex::decode(signing_key_hex).map_err(|_| "Invalid activation grant key")?;
    if key_bytes.len() < 32 {
        return Err("Activation grant key is too short".into());
    }
    let seed: [u8; 32] = key_bytes[..32]
        .try_into()
        .map_err(|_| "Invalid activation grant key")?;
    let verifying_key = VerifyingKey::from(&SigningKey::from_bytes(&seed));
    verifying_key
        .verify(&bytes, &Signature::from_bytes(&signature_array))
        .map_err(|_| "Activation grant signature is invalid")?;
    let payload: ActivationGrantPayload =
        serde_json::from_slice(&bytes).map_err(|_| "Invalid activation grant claims")?;
    let issued_at = chrono::DateTime::parse_from_rfc3339(&payload.issued_at)
        .map_err(|_| "Invalid activation grant issue time")?
        .with_timezone(&chrono::Utc);
    let expires_at = chrono::DateTime::parse_from_rfc3339(&payload.expires_at)
        .map_err(|_| "Invalid activation grant expiration")?
        .with_timezone(&chrono::Utc);
    if payload.version != 2
        || payload.issuer != ACTIVATION_GRANT_ISSUER
        || payload.audience != ACTIVATION_GRANT_AUDIENCE
        || issued_at > now + chrono::Duration::seconds(30)
        || expires_at <= now
        || expires_at <= issued_at
        || expires_at > issued_at + chrono::Duration::minutes(10)
        || payload.business_id.is_empty()
        || payload.workspace_id.is_empty()
        || payload.branch_id.is_empty()
    {
        return Err("Activation grant claims are invalid or expired".into());
    }
    Ok(payload)
}
