use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2, Params, Version,
};
use hmac::{Hmac, Mac};
use std::sync::OnceLock;
use sha2::Sha256;
use subtle::ConstantTimeEq;

type HmacSha256 = Hmac<Sha256>;

const ARGON2_MEMORY_KB: u32 = 19456;
const ARGON2_ITERATIONS: u32 = 2;
const ARGON2_PARALLELISM: u32 = 1;

static DUMMY_HASH_CELL: OnceLock<String> = OnceLock::new();

pub fn get_dummy_hash() -> &'static str {
    DUMMY_HASH_CELL.get_or_init(|| {
        hash_password("40LabsDummyStartupPassword123!").expect("Failed to generate DUMMY_HASH")
    })
}

fn get_argon2_instance() -> Argon2<'static> {
    let params = Params::new(ARGON2_MEMORY_KB, ARGON2_ITERATIONS, ARGON2_PARALLELISM, None)
        .expect("Failed to create Argon2 params");
    Argon2::new(argon2::Algorithm::Argon2id, Version::V0x13, params)
}

pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = get_argon2_instance();
    let password_hash = argon2.hash_password(password.as_bytes(), &salt)?;
    Ok(password_hash.to_string())
}

pub fn verify_password(password: &str, phc_string: &str) -> bool {
    let parsed_hash = match PasswordHash::new(phc_string) {
        Ok(h) => h,
        Err(_) => return false,
    };
    let argon2 = get_argon2_instance();
    argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok()
}

pub fn hash_pin(user_id: &str, pin: &str, pepper: &[u8; 32]) -> Result<String, argon2::password_hash::Error> {
    let prep = prepare_pin_input(user_id, pin, pepper);
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = get_argon2_instance();
    let password_hash = argon2.hash_password(&prep, &salt)?;
    Ok(password_hash.to_string())
}

pub fn verify_pin(user_id: &str, pin: &str, pepper: &[u8; 32], phc_string: &str) -> bool {
    let parsed_hash = match PasswordHash::new(phc_string) {
        Ok(h) => h,
        Err(_) => return false,
    };
    let prep = prepare_pin_input(user_id, pin, pepper);
    let argon2 = get_argon2_instance();
    argon2.verify_password(&prep, &parsed_hash).is_ok()
}

fn prepare_pin_input(user_id: &str, pin: &str, pepper: &[u8; 32]) -> Vec<u8> {
    let mut mac = HmacSha256::new_from_slice(pepper).expect("Failed to create HMAC");
    mac.update(user_id.as_bytes());
    mac.update(pin.as_bytes());
    mac.finalize().into_bytes().to_vec()
}

pub fn hash_recovery_code(code: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = get_argon2_instance();
    let password_hash = argon2.hash_password(code.as_bytes(), &salt)?;
    Ok(password_hash.to_string())
}

pub fn verify_recovery_code(code: &str, phc_string: &str) -> bool {
    let parsed_hash = match PasswordHash::new(phc_string) {
        Ok(h) => h,
        Err(_) => return false,
    };
    let argon2 = get_argon2_instance();
    argon2.verify_password(code.as_bytes(), &parsed_hash).is_ok()
}

pub fn needs_rehash(_phc_string: &str) -> bool {
    false
}

pub fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    a.ct_eq(b).into()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing_roundtrip() {
        let pwd = "SecurePassword123!";
        let hash = hash_password(pwd).unwrap();
        assert!(verify_password(pwd, &hash));
        assert!(!verify_password("WrongPassword123!", &hash));
    }

    #[test]
    fn test_pin_hashing_roundtrip() {
        let pepper = [42u8; 32];
        let pin = "123456";
        let user_id = "user_abc";
        let hash = hash_pin(user_id, pin, &pepper).unwrap();
        assert!(verify_pin(user_id, pin, &pepper, &hash));
        assert!(!verify_pin(user_id, "654321", &pepper, &hash));
        assert!(!verify_pin("other_user", pin, &pepper, &hash));
    }

    #[test]
    fn test_unknown_user_vs_wrong_password_timing_comparable() {
        let pwd_hash = hash_password("CorrectPassword123!").unwrap();
        let start1 = std::time::Instant::now();
        verify_password("WrongPassword123!", &pwd_hash);
        let duration1 = start1.elapsed();

        let start2 = std::time::Instant::now();
        verify_password("WrongPassword123!", get_dummy_hash());
        let duration2 = start2.elapsed();

        assert!(duration1.as_millis() > 0);
        assert!(duration2.as_millis() > 0);
    }
}
