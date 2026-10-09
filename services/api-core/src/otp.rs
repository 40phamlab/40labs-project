use rand::rngs::OsRng;
use rand::RngCore;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use subtle::ConstantTimeEq;

type HmacSha256 = Hmac<Sha256>;

pub fn generate_otp() -> String {
    let mut rng = OsRng;
    let n = rng.next_u32() % 1000000;
    format!("{:06}", n)
}

pub fn hash_otp(code: &str, secret: &[u8]) -> String {
    let mut mac = HmacSha256::new_from_slice(secret).expect("HMAC can take key of any size");
    mac.update(code.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

pub fn verify_otp_hash(code: &str, stored_hash: &str, secret: &[u8]) -> bool {
    let computed = hash_otp(code, secret);
    let computed_bytes = hex::decode(&computed).unwrap_or_default();
    let stored_bytes = hex::decode(stored_hash).unwrap_or_default();
    if computed_bytes.len() != stored_bytes.len() {
        return false;
    }
    computed_bytes.ct_eq(&stored_bytes).into()
}

pub fn hash_string(input: &str) -> String {
    use sha2::Digest;
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}
