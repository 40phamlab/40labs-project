use ed25519_dalek::{Signer, SigningKey, VerifyingKey};
use hkdf::Hkdf;
use rand::rngs::OsRng;
use rand::RngCore;
use sha2::Sha256;
use zeroize::Zeroizing;

pub fn resolve_labs_profile_with_cfg(debug: bool) -> Option<String> {
    if !debug {
        return None;
    }
    if let Ok(profile) = std::env::var("LABS_PROFILE") {
        let profile = profile.trim().to_lowercase();
        if !profile.is_empty() {
            let valid = profile.len() <= 16
                && profile
                    .chars()
                    .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-');
            if valid {
                return Some(profile);
            } else {
                tracing::warn!(
                    profile = %profile,
                    "Invalid LABS_PROFILE environment variable: must match [a-z0-9-]{{1,16}}. Falling back to default."
                );
            }
        }
    }
    None
}

pub fn resolve_labs_profile() -> Option<String> {
    resolve_labs_profile_with_cfg(cfg!(debug_assertions))
}

pub fn service_name() -> String {
    let base = "com.40labs.core-desktop";
    if let Some(profile) = resolve_labs_profile() {
        format!("{}-{}", base, profile)
    } else {
        base.to_string()
    }
}

fn dev_filename(base: &str) -> String {
    if let Some(profile) = resolve_labs_profile() {
        format!("{}-{}", base, profile)
    } else {
        base.to_string()
    }
}

#[allow(dead_code)]
const MASTER_SECRET_ENTRY: &str = "master-secret-v1";
#[allow(dead_code)]
const DEVICE_KEY_ENTRY: &str = "device-private-key-v1";

pub trait RegistrationKeychain: Send + Sync {
    fn cloud_device_id(&self) -> Result<String, KeystoreError>;
    fn rotate_cloud_device_id(&self) -> Result<String, KeystoreError>;
    fn has_cloud_credentials(&self) -> Result<bool, KeystoreError>;
    fn store_cloud_device_credentials(
        &self,
        credentials: &crate::activation::DeviceCredentials,
    ) -> Result<(), KeystoreError>;
    fn store_pending_registration_result(&self, value: &str) -> Result<(), KeystoreError>;
    fn load_pending_registration_result(&self) -> Result<Option<String>, KeystoreError>;
    fn clear_pending_registration_result(&self) -> Result<(), KeystoreError>;
}

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
    pub fn cloud_device_id() -> Result<String, KeystoreError> {
        let entry = keyring::Entry::new(&service_name(), "cloud-device-id-v1")
            .map_err(|e| KeystoreError::KeychainError(e.to_string()))?;
        match entry.get_password() {
            Ok(id) if !id.is_empty() => Ok(id),
            Ok(_) => Err(KeystoreError::SerializationError(
                "Empty cloud device ID".into(),
            )),
            Err(keyring::Error::NoEntry) => {
                let id = format!("desktop-{}", uuid::Uuid::new_v4().simple());
                entry
                    .set_password(&id)
                    .map_err(|e| KeystoreError::KeychainError(e.to_string()))?;
                Ok(id)
            }
            Err(e) => Err(KeystoreError::KeychainError(e.to_string())),
        }
    }

    pub fn rotate_cloud_device_id() -> Result<String, KeystoreError> {
        let entry = keyring::Entry::new(&service_name(), "cloud-device-id-v1")
            .map_err(|e| KeystoreError::KeychainError(e.to_string()))?;
        let id = format!("desktop-{}", uuid::Uuid::new_v4().simple());
        entry
            .set_password(&id)
            .map_err(|e| KeystoreError::KeychainError(e.to_string()))?;
        Ok(id)
    }

    pub fn has_cloud_credentials() -> Result<bool, KeystoreError> {
        match keyring::Entry::new(&service_name(), "cloud-device-credentials-v1") {
            Ok(entry) => match entry.get_password() {
                Ok(_) => Ok(true),
                Err(keyring::Error::NoEntry) => Ok(false),
                Err(e) => Err(KeystoreError::KeychainError(e.to_string())),
            },
            Err(e) => Err(KeystoreError::KeychainError(e.to_string())),
        }
    }

    pub fn store_cloud_credentials<T: serde::Serialize>(
        credentials: &T,
    ) -> Result<(), KeystoreError> {
        let value = serde_json::to_string(credentials)
            .map_err(|e| KeystoreError::SerializationError(e.to_string()))?;
        keyring::Entry::new(&service_name(), "cloud-device-credentials-v1")
            .map_err(|e| KeystoreError::KeychainError(e.to_string()))?
            .set_password(&value)
            .map_err(|e| KeystoreError::KeychainError(e.to_string()))
    }

    pub fn load_cloud_credentials<T: serde::de::DeserializeOwned>() -> Result<T, KeystoreError> {
        let value = keyring::Entry::new(&service_name(), "cloud-device-credentials-v1")
            .map_err(|e| KeystoreError::KeychainError(e.to_string()))?
            .get_password()
            .map_err(|e| KeystoreError::KeychainError(e.to_string()))?;
        serde_json::from_str(&value).map_err(|e| KeystoreError::SerializationError(e.to_string()))
    }

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

    pub fn derive_key(&self, info: &[u8]) -> [u8; 32] {
        let hk = Hkdf::<Sha256>::new(Some(b"40labs_totp_salt_v1"), self.master_secret.as_ref());
        let mut key = [0u8; 32];
        hk.expand(info, &mut key)
            .expect("HKDF expand should succeed");
        key
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
        load_or_create_secret(MASTER_SECRET_ENTRY, &dev_filename(".dev-keystore"))
    }

    #[allow(dead_code)]
    fn load_or_create_device_key() -> Result<([u8; 32], SecretStatus), KeystoreError> {
        load_or_create_secret(DEVICE_KEY_ENTRY, &dev_filename(".dev-device-key"))
    }
}

impl RegistrationKeychain for Keystore {
    fn cloud_device_id(&self) -> Result<String, KeystoreError> {
        Keystore::cloud_device_id()
    }

    fn rotate_cloud_device_id(&self) -> Result<String, KeystoreError> {
        Keystore::rotate_cloud_device_id()
    }

    fn has_cloud_credentials(&self) -> Result<bool, KeystoreError> {
        Keystore::has_cloud_credentials()
    }

    fn store_cloud_device_credentials(
        &self,
        credentials: &crate::activation::DeviceCredentials,
    ) -> Result<(), KeystoreError> {
        Keystore::store_cloud_credentials(credentials)
    }

    fn store_pending_registration_result(&self, value: &str) -> Result<(), KeystoreError> {
        keyring::Entry::new(&service_name(), "pending-registration-result-v1")
            .map_err(|e| KeystoreError::KeychainError(e.to_string()))?
            .set_password(value)
            .map_err(|e| KeystoreError::KeychainError(e.to_string()))
    }

    fn load_pending_registration_result(&self) -> Result<Option<String>, KeystoreError> {
        let entry = keyring::Entry::new(&service_name(), "pending-registration-result-v1")
            .map_err(|e| KeystoreError::KeychainError(e.to_string()))?;
        match entry.get_password() {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(error) => Err(KeystoreError::KeychainError(error.to_string())),
        }
    }

    fn clear_pending_registration_result(&self) -> Result<(), KeystoreError> {
        let entry = keyring::Entry::new(&service_name(), "pending-registration-result-v1")
            .map_err(|e| KeystoreError::KeychainError(e.to_string()))?;
        match entry.delete_password() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(error) => Err(KeystoreError::KeychainError(error.to_string())),
        }
    }
}

fn load_or_create_secret(
    entry_name: &str,
    dev_filename: &str,
) -> Result<([u8; 32], SecretStatus), KeystoreError> {
    let entry_res = keyring::Entry::new(&service_name(), entry_name);

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
    fn test_labs_profile_isolation_and_release_ignore() {
        std::env::set_var("LABS_PROFILE", "test-profile");
        assert_eq!(resolve_labs_profile_with_cfg(false), None);

        std::env::set_var("LABS_PROFILE", "alpha");
        assert_eq!(resolve_labs_profile_with_cfg(true), Some("alpha".into()));
        assert_eq!(service_name(), "com.40labs.core-desktop-alpha");
        assert_eq!(dev_filename(".dev-keystore"), ".dev-keystore-alpha");

        std::env::set_var("LABS_PROFILE", "INVALID_PROFILE!");
        assert_eq!(resolve_labs_profile_with_cfg(true), None);
        assert_eq!(service_name(), "com.40labs.core-desktop");

        std::env::set_var("LABS_PROFILE", "verylongprofilenamethatiswaytoolong");
        assert_eq!(resolve_labs_profile_with_cfg(true), None);

        std::env::remove_var("LABS_PROFILE");
        assert_eq!(resolve_labs_profile_with_cfg(true), None);
        assert_eq!(service_name(), "com.40labs.core-desktop");
    }

    #[test]
    fn test_from_raw_keys_deterministic() {
        let master = [42u8; 32];
        let device = [99u8; 32];
        let k1 = Keystore::from_raw_keys(master, device).unwrap();
        let k2 = Keystore::from_raw_keys(master, device).unwrap();
        assert_eq!(k1.pin_pepper(), k2.pin_pepper());
        assert_eq!(k1.verifying_key().as_bytes(), k2.verifying_key().as_bytes());
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
