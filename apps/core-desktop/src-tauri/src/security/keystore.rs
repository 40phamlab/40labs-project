use ed25519_dalek::{SigningKey, VerifyingKey, Signer};
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
            let master_secret_bytes = Self::load_or_create_master_secret()?;
            let device_key_bytes = Self::load_or_create_device_key()?;
            Self::from_raw_keys(master_secret_bytes, device_key_bytes)
        }
    }

    pub fn in_memory() -> Result<Self, KeystoreError> {
        let mut master = [0u8; 32];
        let mut device = [0u8; 32];
        OsRng.fill_bytes(&mut master);
        OsRng.fill_bytes(&mut device);
        Self::from_raw_keys(master, device)
    }

    fn from_raw_keys(master_secret_bytes: [u8; 32], device_key_bytes: [u8; 32]) -> Result<Self, KeystoreError> {
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
    fn load_or_create_master_secret() -> Result<[u8; 32], KeystoreError> {
        let entry = match keyring::Entry::new(SERVICE_NAME, MASTER_SECRET_ENTRY) {
            Ok(e) => e,
            Err(_err) => {
                #[cfg(debug_assertions)]
                {
                    let mut bytes = [0u8; 32];
                    OsRng.fill_bytes(&mut bytes);
                    return Ok(bytes);
                }
                #[cfg(not(debug_assertions))]
                return Err(KeystoreError::Unavailable(_err.to_string()));
            }
        };

        match entry.get_password() {
            Ok(encoded) => {
                let bytes = hex::decode(encoded.trim())
                    .map_err(|e| KeystoreError::SerializationError(e.to_string()))?;
                if bytes.len() != 32 {
                    return Err(KeystoreError::SerializationError("Invalid master secret length".into()));
                }
                let mut arr = [0u8; 32];
                arr.copy_from_slice(&bytes);
                Ok(arr)
            }
            Err(_) => {
                let mut bytes = [0u8; 32];
                OsRng.fill_bytes(&mut bytes);
                let encoded = hex::encode(bytes);
                entry.set_password(&encoded).map_err(|e| {
                    #[cfg(debug_assertions)]
                    {
                        return KeystoreError::KeychainError(e.to_string());
                    }
                    #[cfg(not(debug_assertions))]
                    KeystoreError::Unavailable(e.to_string())
                })?;
                Ok(bytes)
            }
        }
    }

    #[allow(dead_code)]
    fn load_or_create_device_key() -> Result<[u8; 32], KeystoreError> {
        let entry = match keyring::Entry::new(SERVICE_NAME, DEVICE_KEY_ENTRY) {
            Ok(e) => e,
            Err(_err) => {
                #[cfg(debug_assertions)]
                {
                    let mut bytes = [0u8; 32];
                    OsRng.fill_bytes(&mut bytes);
                    return Ok(bytes);
                }
                #[cfg(not(debug_assertions))]
                return Err(KeystoreError::Unavailable(_err.to_string()));
            }
        };

        match entry.get_password() {
            Ok(encoded) => {
                let bytes = hex::decode(encoded.trim())
                    .map_err(|e| KeystoreError::SerializationError(e.to_string()))?;
                if bytes.len() != 32 {
                    return Err(KeystoreError::SerializationError("Invalid device key length".into()));
                }
                let mut arr = [0u8; 32];
                arr.copy_from_slice(&bytes);
                Ok(arr)
            }
            Err(_) => {
                let mut bytes = [0u8; 32];
                OsRng.fill_bytes(&mut bytes);
                let encoded = hex::encode(bytes);
                entry.set_password(&encoded).map_err(|e| {
                    #[cfg(debug_assertions)]
                    {
                        return KeystoreError::KeychainError(e.to_string());
                    }
                    #[cfg(not(debug_assertions))]
                    KeystoreError::Unavailable(e.to_string())
                })?;
                Ok(bytes)
            }
        }
    }
}
