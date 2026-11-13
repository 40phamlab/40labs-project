use aes_gcm::{aead::Aead, Aes256Gcm, Key, KeyInit, Nonce};
use rand::RngCore;
use totp_rs::{Algorithm, Secret, TOTP};

pub fn create_totp(secret_base32: &str, account_name: &str, issuer: &str) -> Result<TOTP, String> {
    let secret = Secret::Encoded(secret_base32.to_string());
    TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret.to_bytes().map_err(|e| e.to_string())?,
        Some(issuer.to_string()),
        account_name.to_string(),
    )
    .map_err(|e| e.to_string())
}

pub fn generate_new_totp(
    account_name: &str,
    issuer: &str,
) -> Result<(String, String, String), String> {
    let mut secret_bytes = [0u8; 20];
    rand::rngs::OsRng.fill_bytes(&mut secret_bytes);
    let secret = Secret::Raw(secret_bytes.to_vec());
    let base32_secret = secret.to_encoded().to_string();
    let totp = create_totp(&base32_secret, account_name, issuer)?;
    let uri = totp.get_url();
    Ok((base32_secret.clone(), uri, base32_secret))
}

pub fn verify_totp(secret_base32: &str, code: &str, last_used_step: u64) -> Result<u64, ()> {
    let totp = create_totp(secret_base32, "user", "40Labs").map_err(|_| ())?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let current_step = now / 30;
    for skew in [-1i64, 0, 1] {
        let step = (current_step as i64 + skew) as u64;
        if step <= last_used_step {
            continue;
        }
        let timestamp = step * 30;
        if totp.check(code, timestamp) {
            return Ok(step);
        }
    }
    Err(())
}

pub fn encrypt_secret(secret: &str, key_bytes: &[u8; 32]) -> Result<Vec<u8>, String> {
    let key = Key::<Aes256Gcm>::from_slice(key_bytes);
    let cipher = Aes256Gcm::new(key);
    let mut nonce_bytes = [0u8; 12];
    rand::rngs::OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, secret.as_bytes())
        .map_err(|e| e.to_string())?;

    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(combined)
}

pub fn decrypt_secret(encrypted: &[u8], key_bytes: &[u8; 32]) -> Result<String, String> {
    if encrypted.len() < 12 {
        return Err("Encrypted data too short".to_string());
    }
    let (nonce_bytes, ciphertext) = encrypted.split_at(12);
    let key = Key::<Aes256Gcm>::from_slice(key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| e.to_string())?;
    String::from_utf8(plaintext).map_err(|e| e.to_string())
}
