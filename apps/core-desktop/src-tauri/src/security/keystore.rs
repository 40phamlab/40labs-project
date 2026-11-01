use ed25519_dalek::{Signer, SigningKey, VerifyingKey};
use hkdf::Hkdf;
use rand::rngs::OsRng;
use rand::RngCore;
use sha2::Sha256;
use zeroize::Zeroizing;

#[allow(dead_code)]
const SERVICE_NAME: &str = "com.40labs.core-desktop";
#[allow(dead_code)]
const MASTER_SECRET_ENTRY: &str = "master-secret-v1";
#[allow(dead_code)]
const DEVICE_KEY_ENTRY: &str = "device-private-key-v1";

#[allow(dead_code)]
pub const DB_KEY_V1_CONSTANT: &str = "db_key_v1";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SecretStatus {
    Loaded,
    Created,
    DevFile,
    Error,
}

impl std::fmt::Display for SecretStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SecretStatus::Loaded => write!(f, "loaded"),
            SecretStatus::Created => write!(f, "created"),
            SecretStatus::DevFile => write!(f, "dev_file"),
            SecretStatus::Error => write!(f, "error"),
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum KeystoreError {
    #[error("Keychain operation failed: {0}")]
    KeychainError(String),
    #[error("Key material serialization/deserialization failed: {0}")]
    SerializationError(String),
    #[error("Keystore unavailable and fail-closed enforced: {0}")]
    Unavailable(String),
}

pub struct Keystore {
    #[allow(dead_code)]
    master_secret: Zeroizing<[u8; 32]>,
    pin_pepper: Zeroizing<[u8; 32]>,
    signing_key: Zeroizing<[u8; 32]>,
    verifying_key: VerifyingKey,
}

impl std::fmt::Debug for Keystore {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Keystore")
            .field("verifying_key", &self.verifying_key)
            .field("master_secret", &"[REDACTED]")
            .field("pin_pepper", &"[REDACTED]")
            .field("signing_key", &"[REDACTED]")
            .finish()
    }
}

impl Keystore {
    pub fn init() -> Result<Self, KeystoreError> {
        #[cfg(test)]
        {
            Self::in_memory()
        }
        #[cfg(not(test))]
        {
            let (master_secret_bytes, master_status) = Self::load_or_create_master_secret()?;
            let (device_key_bytes, device_status) = Self::load_or_create_device_key()?;
            tracing::info!(
                "keystore: master_secret={} device_key={}",
                master_status,
                device_status
            );
            Self::from_raw_keys(master_secret_bytes, device_key_bytes)
        }
    }

    pub fn in_memory() -> Result<Self, KeystoreError> {
        let mut master = [0u8; 32];
        let mut device = [0u8; 32];
        OsRng.fill_bytes(&mut master);
        OsRng.fill_bytes(&mut device);
        tracing::info!("keystore: master_secret=created device_key=created (in_memory)");
        Self::from_raw_keys(master, device)
    }

    fn from_raw_keys(
        master_secret_bytes: [u8; 32],
        device_key_bytes: [u8; 32],
    ) -> Result<Self, KeystoreError> {
        let master_secret = Zeroizing::new(master_secret_bytes);

        let hk = Hkdf::<Sha256>::new(Some(b"40labs_salt_v1"), master_secret.as_ref());
        let mut pin_pepper = [0u8; 32];
        hk.expand(b"pin_pepper_v1", &mut pin_pepper)
            .map_err(|e| KeystoreError::SerializationError(e.to_string()))?;
        let pin_pepper = Zeroizing::new(pin_pepper);

        let signing_key_bytes = Zeroizing::new(device_key_bytes);
        let signing_key_arr = *signing_key_bytes;
        let signing_key_obj = SigningKey::from_bytes(&signing_key_arr);
        let verifying_key = signing_key_obj.verifying_key();
        let signing_key = Zeroizing::new(signing_key_arr);

        Ok(Self {
            master_secret,
            pin_pepper,
            signing_key,
            verifying_key,
        })
    }

    pub fn pin_pepper(&self) -> &[u8; 32] {
        &*self.pin_pepper
    }

    pub fn verifying_key(&self) -> &VerifyingKey {
        &self.verifying_key
    }

    pub fn sign(&self, msg: &[u8]) -> ed25519_dalek::Signature {
        let signing_key = SigningKey::from_bytes(&*self.signing_key);
        signing_key.sign(msg)
    }

    #[allow(dead_code)]
    fn load_or_create_master_secret() -> Result<([u8; 32], SecretStatus), KeystoreError> {
        load_or_create_secret(MASTER_SECRET_ENTRY, ".dev-keystore")
    }

    #[allow(dead_code)]
    fn load_or_create_device_key() -> Result<([u8; 32], SecretStatus), KeystoreError> {
        load_or_create_secret(DEVICE_KEY_ENTRY, ".dev-device-key")
    }
}

fn load_or_create_secret(
    entry_name: &str,
    dev_filename: &str,
) -> Result<([u8; 32], SecretStatus), KeystoreError> {
    let entry_res = keyring::Entry::new(SERVICE_NAME, entry_name);

    match entry_res {
        Ok(entry) => match entry.get_password() {
            Ok(encoded) => {
                let bytes = hex::decode(encoded.trim())
                    .map_err(|e| KeystoreError::SerializationError(e.to_string()))?;
                if bytes.len() != 32 {
                    return Err(KeystoreError::SerializationError(
                        "Invalid secret length".into(),
                    ));
                }
                let mut arr = [0u8; 32];
                arr.copy_from_slice(&bytes);
                Ok((arr, SecretStatus::Loaded))
            }
            Err(keyring::Error::NoEntry) => {
                let mut bytes = [0u8; 32];
                OsRng.fill_bytes(&mut bytes);
                let encoded = hex::encode(bytes);
                match entry.set_password(&encoded) {
                    Ok(()) => Ok((bytes, SecretStatus::Created)),
                    Err(e) => {
                        #[cfg(debug_assertions)]
                        {
                            match load_or_create_dev_file(dev_filename, bytes) {
                                Ok(arr) => Ok((arr, SecretStatus::DevFile)),
                                Err(_) => Err(KeystoreError::KeychainError(e.to_string())),
                            }
                        }
                        #[cfg(not(debug_assertions))]
                        Err(KeystoreError::Unavailable(e.to_string()))
                    }
                }
            }
            Err(other_err) => {
                #[cfg(debug_assertions)]
                {
                    let mut bytes = [0u8; 32];
                    OsRng.fill_bytes(&mut bytes);
                    match load_or_create_dev_file(dev_filename, bytes) {
                        Ok(arr) => Ok((arr, SecretStatus::DevFile)),
                        Err(_) => Err(KeystoreError::Unavailable(other_err.to_string())),
                    }
                }
                #[cfg(not(debug_assertions))]
                Err(KeystoreError::Unavailable(other_err.to_string()))
            }
        },
        Err(err) => {
            #[cfg(debug_assertions)]
            {
                let mut bytes = [0u8; 32];
                OsRng.fill_bytes(&mut bytes);
                match load_or_create_dev_file(dev_filename, bytes) {
                    Ok(arr) => Ok((arr, SecretStatus::DevFile)),
                    Err(_) => Err(KeystoreError::Unavailable(err.to_string())),
                }
            }
            #[cfg(not(debug_assertions))]
            Err(KeystoreError::Unavailable(err.to_string()))
        }
    }
}

fn load_or_create_dev_file(
    filename: &str,
    default_bytes: [u8; 32],
) -> Result<[u8; 32], std::io::Error> {
    use std::fs;
    use std::path::Path;

    let dir = Path::new("dev-data");
    if !dir.exists() {
        fs::create_dir_all(dir)?;
    }
    let path = dir.join(filename);

    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(bytes) = hex::decode(content.trim()) {
                if bytes.len() == 32 {
                    let mut arr = [0u8; 32];
                    arr.copy_from_slice(&bytes);
                    return Ok(arr);
                }
            }
        }
    }

    let encoded = hex::encode(default_bytes);
    fs::write(&path, encoded)?;
    Ok(default_bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_raw_keys_deterministic() {
        let master = [42u8; 32];
        let device = [99u8; 32];
        let k1 = Keystore::from_raw_keys(master, device).unwrap();
        let k2 = Keystore::from_raw_keys(master, device).unwrap();
        assert_eq!(k1.pin_pepper(), k2.pin_pepper());
        assert_eq!(
            k1.verifying_key().as_bytes(),
            k2.verifying_key().as_bytes()
        );
    }

    #[test]
    fn test_pin_verification_across_keystores() {
        let master = [123u8; 32];
        let device = [210u8; 32];
        let k1 = Keystore::from_raw_keys(master, device).unwrap();
        let k2 = Keystore::from_raw_keys(master, device).unwrap();

        let pin = "1234";
        let user_id = "user_1";
        let hashed = crate::security::hashing::hash_pin(user_id, pin, k1.pin_pepper()).unwrap();
        assert!(crate::security::hashing::verify_pin(
            user_id,
            pin,
            k2.pin_pepper(),
            &hashed
        ));
    }

    #[test]
    #[cfg(debug_assertions)]
    fn test_dev_file_fallback_roundtrip() {
        let path = std::path::Path::new("dev-data/.dev-keystore");
        if path.exists() {
            let _ = std::fs::remove_file(path);
        }

        let bytes1 = [7u8; 32];
        let r1 = load_or_create_dev_file(".dev-keystore", bytes1).unwrap();

        let bytes2 = [8u8; 32];
        let r2 = load_or_create_dev_file(".dev-keystore", bytes2).unwrap();

        assert_eq!(r1, bytes1);
        assert_eq!(r2, bytes1);

        let _ = std::fs::remove_file(path);
    }
}
