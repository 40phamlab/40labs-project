use ed25519_dalek::{Signer, SigningKey};
use serde::{Serialize, Deserialize};
use rand::{rngs::OsRng, Rng};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActivationGrantPayload {
    pub business_id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub phone_hash: String,
    pub issued_at: String,
}

pub fn generate_business_id() -> String {
    let charset = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
    let mut rng = OsRng;
    let code: String = (0..6)
        .map(|_| {
            let idx = rng.gen_range(0..charset.len());
            charset.chars().nth(idx).unwrap()
        })
        .collect();
    format!("AFYA-{}", code)
}

pub fn sign_grant(payload: &ActivationGrantPayload, signing_key_hex: &str) -> Result<String, String> {
    let key_bytes = if signing_key_hex.is_empty() {
        [0u8; 32]
    } else {
        let decoded = hex::decode(signing_key_hex).map_err(|e| e.to_string())?;
        if decoded.len() < 32 {
            return Err("Signing key too short".into());
        }
        let mut b = [0u8; 32];
        b.copy_from_slice(&decoded[..32]);
        b
    };
    let signing_key = SigningKey::from_bytes(&key_bytes);
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
