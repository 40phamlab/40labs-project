use aes_gcm::{
    aead::{Aead, KeyInit, Payload},
    Aes256Gcm, Nonce,
};
use argon2::{Argon2, Params, Version};
use chrono::Utc;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use zeroize::Zeroizing;
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

const MAGIC_BYTES: &[u8; 15] = b"40LABS_CORE_BAK";
const FORMAT_VERSION: u8 = 0x01;
const CIPHER_ID_AES_GCM_ARGON2: u8 = 0x01;
const HEADER_SIZE: usize = 57;

// KDF parameters
const ARGON2_MEM_KB: u32 = 65536; // 64 MB
const ARGON2_ITERATIONS: u32 = 3;
const ARGON2_PARALLELISM: u32 = 1;

// Extraction security limits
const MAX_FILE_SIZE_BYTES: u64 = 500 * 1024 * 1024; // 500 MB per file
const MAX_TOTAL_EXTRACT_BYTES: u64 = 2 * 1024 * 1024 * 1024; // 2 GB total
const MAX_FILE_COUNT: usize = 10_000;

const PROHIBITED_EXTENSIONS: &[&str] = &[
    "exe", "bat", "cmd", "sh", "ps1", "dll", "so", "dylib", "vbs", "js", "mjs", "jar", "msi",
    "scr", "pif", "application", "com", "hta", "cpl",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupFileEntry {
    pub relative_path: String,
    pub size_bytes: u64,
    pub sha256: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupManifest {
    pub manifest_version: String,
    pub app_version: String,
    pub schema_version: i64,
    pub created_at: String,
    pub business_id: String,
    pub business_name: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub exported_by_user_id: Option<String>,
    pub record_counts: HashMap<String, u64>,
    pub file_entries: Vec<BackupFileEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupPreview {
    pub business_id: String,
    pub business_name: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub created_at: String,
    pub app_version: String,
    pub schema_version: i64,
    pub is_schema_compatible: bool,
    pub total_records: u64,
    pub record_counts: HashMap<String, u64>,
    pub file_count: u64,
    pub total_file_bytes: u64,
    pub checksum_valid: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportResult {
    pub archive_path: String,
    pub size_bytes: u64,
    pub business_id: String,
    pub business_name: String,
    pub total_records: u64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestoreResult {
    pub business_id: String,
    pub business_name: String,
    pub total_records_restored: u64,
    pub files_restored: u64,
    pub safety_backup_path: String,
    pub restored_at: String,
}

/// Derive a 32-byte encryption key from password and salt using Argon2id
fn derive_key(
    password: &str,
    salt: &[u8; 16],
    mem_kb: u32,
    iterations: u32,
    parallelism: u32,
) -> Result<Zeroizing<[u8; 32]>, String> {
    if password.is_empty() {
        return Err("Password cannot be empty.".to_string());
    }
    let params = Params::new(mem_kb, iterations, parallelism, Some(32))
        .map_err(|e| format!("Invalid Argon2 parameters: {e}"))?;

    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, Version::V0x13, params);
    let mut key = Zeroizing::new([0u8; 32]);
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut *key)
        .map_err(|e| format!("Key derivation failed: {e}"))?;

    Ok(key)
}

/// Encrypt plaintext with AES-256-GCM and return header + ciphertext + tag
fn encrypt_core_pack(password: &str, plaintext: &[u8]) -> Result<Vec<u8>, String> {
    let mut salt = [0u8; 16];
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut salt);
    rand::thread_rng().fill_bytes(&mut nonce_bytes);

    let key = derive_key(
        password,
        &salt,
        ARGON2_MEM_KB,
        ARGON2_ITERATIONS,
        ARGON2_PARALLELISM,
    )?;

    // Build 56-byte header
    let mut header = Vec::with_capacity(HEADER_SIZE);
    header.extend_from_slice(MAGIC_BYTES);
    header.push(FORMAT_VERSION);
    header.push(CIPHER_ID_AES_GCM_ARGON2);
    header.extend_from_slice(&salt);
    header.extend_from_slice(&nonce_bytes);
    header.extend_from_slice(&ARGON2_MEM_KB.to_be_bytes());
    header.extend_from_slice(&ARGON2_ITERATIONS.to_be_bytes());
    header.extend_from_slice(&ARGON2_PARALLELISM.to_be_bytes());

    debug_assert_eq!(header.len(), HEADER_SIZE);

    let cipher = Aes256Gcm::new_from_slice(&*key)
        .map_err(|e| format!("Cipher initialization error: {e}"))?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    // AAD binds the full header to the ciphertext
    let payload = Payload {
        msg: plaintext,
        aad: &header,
    };

    let ciphertext = cipher
        .encrypt(nonce, payload)
        .map_err(|_| "Encryption failed.".to_string())?;

    let mut output = Vec::with_capacity(header.len() + ciphertext.len());
    output.extend_from_slice(&header);
    output.extend_from_slice(&ciphertext);

    Ok(output)
}

/// Decrypt header + ciphertext + tag and verify authentication
fn decrypt_core_pack(password: &str, encrypted_data: &[u8]) -> Result<Vec<u8>, String> {
    if encrypted_data.len() < HEADER_SIZE {
        return Err("File is too small to be a valid .core backup.".to_string());
    }

    let header = &encrypted_data[..HEADER_SIZE];
    if &header[0..15] != MAGIC_BYTES {
        return Err("Invalid file format. The file is not a valid 40Labs .core backup.".to_string());
    }

    let version = header[15];
    if version > FORMAT_VERSION {
        return Err(format!(
            "Unsupported backup format version ({version}). Please update 40Labs Core."
        ));
    }

    let cipher_id = header[16];
    if cipher_id != CIPHER_ID_AES_GCM_ARGON2 {
        return Err(format!(
            "Unsupported encryption algorithm identifier ({cipher_id})."
        ));
    }

    let mut salt = [0u8; 16];
    let mut nonce_bytes = [0u8; 12];
    salt.copy_from_slice(&header[17..33]);
    nonce_bytes.copy_from_slice(&header[33..45]);

    let mem_kb = u32::from_be_bytes(header[45..49].try_into().unwrap());
    let iterations = u32::from_be_bytes(header[49..53].try_into().unwrap());
    let parallelism = u32::from_be_bytes(header[53..57].try_into().unwrap());

    // Sanity check KDF params to prevent DoS
    if mem_kb > 256 * 1024 || iterations > 20 || parallelism > 8 {
        return Err("Backup file specifies insecure or excessive KDF parameters.".to_string());
    }

    let key = derive_key(password, &salt, mem_kb, iterations, parallelism)?;

    let cipher = Aes256Gcm::new_from_slice(&*key)
        .map_err(|e| format!("Cipher initialization error: {e}"))?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = &encrypted_data[HEADER_SIZE..];
    let payload = Payload {
        msg: ciphertext,
        aad: header,
    };

    cipher
        .decrypt(nonce, payload)
        .map_err(|_| "Incorrect password or corrupted backup file.".to_string())
}

/// Compute SHA-256 hash of a file
fn compute_file_sha256(path: &Path) -> Result<String, String> {
    let mut file = File::open(path)
        .map_err(|e| format!("Failed to open file for SHA-256 calculation ({}): {e}", path.display()))?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 65536];
    loop {
        let n = file
            .read(&mut buffer)
            .map_err(|e| format!("Error reading file during SHA-256 ({}): {e}", path.display()))?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

/// Compute SHA-256 hash of byte slice
fn compute_bytes_sha256(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

/// Validates that a zip entry path is relative, safe, and does not perform path traversal
fn sanitize_zip_path(raw_path: &str) -> Result<PathBuf, String> {
    let path = Path::new(raw_path);

    if path.is_absolute() {
        return Err(format!("Absolute paths are prohibited in backup archive: '{raw_path}'"));
    }

    for component in path.components() {
        match component {
            std::path::Component::ParentDir => {
                return Err(format!("Path traversal ('..') detected in backup archive: '{raw_path}'"));
            }
            std::path::Component::Prefix(_) | std::path::Component::RootDir => {
                return Err(format!("Invalid path component in backup archive: '{raw_path}'"));
            }
            _ => {}
        }
    }

    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        if PROHIBITED_EXTENSIONS.contains(&ext.to_lowercase().as_str()) {
            return Err(format!("Restoring executable file type '.{ext}' is strictly prohibited for security reasons."));
        }
    }

    Ok(path.to_path_buf())
}

/// Query record counts from all persistent tables
async fn query_record_counts(pool: &SqlitePool) -> Result<HashMap<String, u64>, String> {
    let tables = vec![
        "business",
        "branch",
        "owner",
        "app_user",
        "staff_permission_set",
        "user_credential",
        "recovery_code",
        "bound_device",
        "paired_device",
        "permission_grant",
        "customer",
        "medicine",
        "inventory_item",
        "stock_adjustment",
        "sale",
        "sale_line",
        "fiscal_receipt",
        "test_catalog_entry",
        "lab_order",
        "lab_sample",
        "lab_result",
        "lab_report",
        "lab_qc_equipment",
        "lab_qc_record",
        "supplier",
        "purchase_order",
        "purchase_order_line",
        "audit_log",
        "notifications",
        "notification_messages",
        "message_attachments",
        "threads",
        "schedules",
        "staff_notifications",
        "staff_notification_reads",
        "integrations_config",
        "partner_facility",
    ];

    let mut map = HashMap::new();
    for table in tables {
        let sql = format!("SELECT COUNT(*) FROM {table}");
        let res: Result<(i64,), _> = sqlx::query_as(&sql).fetch_one(pool).await;
        if let Ok((count,)) = res {
            map.insert(table.to_string(), count as u64);
        }
    }
    Ok(map)
}

/// Query current schema migration version
async fn query_schema_version(pool: &SqlitePool) -> Result<i64, String> {
    let res: Result<(i64,), _> = sqlx::query_as(
        "SELECT MAX(version) FROM _sqlx_migrations WHERE success = 1",
    )
    .fetch_one(pool)
    .await;

    match res {
        Ok((ver,)) => Ok(ver),
        Err(_) => Ok(1),
    }
}

/// Create a Disaster Recovery Pack (.core) file
pub async fn export_disaster_recovery_pack<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    pool: &SqlitePool,
    destination_path: &str,
    password: &str,
    exported_by_user_id: Option<String>,
) -> Result<ExportResult, String> {
    let doc_root = crate::services::documents::documents_root(app).ok();
    export_disaster_recovery_pack_impl(
        pool,
        doc_root.as_deref(),
        destination_path,
        password,
        exported_by_user_id,
    )
    .await
}

pub async fn export_disaster_recovery_pack_impl(
    pool: &SqlitePool,
    doc_root: Option<&Path>,
    destination_path: &str,
    password: &str,
    exported_by_user_id: Option<String>,
) -> Result<ExportResult, String> {
    if password.len() < 6 {
        return Err("Password must be at least 6 characters long.".to_string());
    }

    let dest = Path::new(destination_path);
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create output directory: {e}"))?;
    }

    // 1. Fetch business identity & metadata
    let business_row: Option<(String, String, String, String, Option<String>)> = sqlx::query_as(
        "SELECT business_id, name, workspace_id, branch_id, logo_url FROM business LIMIT 1",
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to read business profile: {e}"))?;

    let (business_id, business_name, workspace_id, branch_id, logo_url) = match business_row {
        Some(row) => row,
        None => return Err("No business profile found in database to export.".to_string()),
    };

    let schema_version = query_schema_version(pool).await?;
    let record_counts = query_record_counts(pool).await?;
    let total_records: u64 = record_counts.values().sum();

    // 2. Take clean SQLite snapshot using VACUUM INTO
    let temp_dir = std::env::temp_dir().join(format!("40labs_backup_export_{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create temporary export directory: {e}"))?;

    let snapshot_db_path = temp_dir.join("database.sqlite");
    if snapshot_db_path.exists() {
        let _ = fs::remove_file(&snapshot_db_path);
    }

    let snapshot_db_str = snapshot_db_path.to_string_lossy().to_string();
    let vacuum_query = format!("VACUUM INTO '{}'", snapshot_db_str.replace('\'', "''"));
    sqlx::query(&vacuum_query)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to create database snapshot: {e}"))?;

    // 3. Collect files from Documents directory
    let mut file_entries = Vec::new();
    let mut files_to_zip: Vec<(PathBuf, String)> = Vec::new();

    if let Some(root) = doc_root {
        if root.exists() {
            let mut stack = vec![root.to_path_buf()];
            while let Some(dir) = stack.pop() {
                if let Ok(entries) = fs::read_dir(&dir) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_dir() {
                            stack.push(path);
                        } else if path.is_file() {
                            if let Ok(rel) = path.strip_prefix(root) {
                                let rel_str = format!("files/{}", rel.to_string_lossy().replace('\\', "/"));
                                if let Ok(meta) = fs::metadata(&path) {
                                    if let Ok(sha256) = compute_file_sha256(&path) {
                                        file_entries.push(BackupFileEntry {
                                            relative_path: rel_str.clone(),
                                            size_bytes: meta.len(),
                                            sha256,
                                        });
                                        files_to_zip.push((path, rel_str));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Include business logo if outside documents root or standalone
    if let Some(logo_path_str) = logo_url {
        let logo_p = Path::new(&logo_path_str);
        if logo_p.exists() && logo_p.is_file() {
            let zip_rel = format!("files/logo_{}", logo_p.file_name().unwrap_or_default().to_string_lossy());
            if !files_to_zip.iter().any(|(_, r)| r == &zip_rel) {
                let logo_size = fs::metadata(logo_p).map(|m| m.len()).unwrap_or(u64::MAX);
                if logo_size < MAX_FILE_SIZE_BYTES {
                    if let Ok(sha256) = compute_file_sha256(logo_p) {
                        file_entries.push(BackupFileEntry {
                            relative_path: zip_rel.clone(),
                            size_bytes: logo_size,
                            sha256,
                        });
                        files_to_zip.push((logo_p.to_path_buf(), zip_rel));
                    }
                }
            }
        }
    }

    // 4. Construct Manifest
    let created_at = Utc::now().to_rfc3339();
    let manifest = BackupManifest {
        manifest_version: "1.0".to_string(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        schema_version,
        created_at: created_at.clone(),
        business_id: business_id.clone(),
        business_name: business_name.clone(),
        workspace_id: workspace_id.clone(),
        branch_id: branch_id.clone(),
        exported_by_user_id: exported_by_user_id.clone(),
        record_counts: record_counts.clone(),
        file_entries,
    };

    let manifest_bytes = serde_json::to_vec_pretty(&manifest)
        .map_err(|e| format!("Failed to serialize manifest: {e}"))?;

    // 5. Compress into Zip in memory
    let zip_buf = Vec::new();
    let mut zip = ZipWriter::new(std::io::Cursor::new(zip_buf));
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // Add manifest.json
    zip.start_file("manifest.json", options)
        .map_err(|e| format!("Failed to write manifest to zip: {e}"))?;
    zip.write_all(&manifest_bytes)
        .map_err(|e| format!("Failed to write manifest content: {e}"))?;

    // Add database.sqlite
    let db_bytes = fs::read(&snapshot_db_path)
        .map_err(|e| format!("Failed to read database snapshot: {e}"))?;
    zip.start_file("database.sqlite", options)
        .map_err(|e| format!("Failed to write database to zip: {e}"))?;
    zip.write_all(&db_bytes)
        .map_err(|e| format!("Failed to write database content: {e}"))?;

    // Add attached files
    for (src_path, rel_path) in files_to_zip {
        if let Ok(content) = fs::read(&src_path) {
            if zip.start_file(&rel_path, options).is_ok() {
                let _ = zip.write_all(&content);
            }
        }
    }

    let zip_cursor = zip.finish().map_err(|e| format!("Failed to finalize zip archive: {e}"))?;
    let zip_plaintext = zip_cursor.into_inner();

    // Clean temp dir
    let _ = fs::remove_dir_all(&temp_dir);

    // 6. Encrypt pack
    let encrypted_pack = encrypt_core_pack(password, &zip_plaintext)?;

    // 7. Write to destination file
    fs::write(dest, &encrypted_pack)
        .map_err(|e| format!("Failed to save .core backup file ({}): {e}", dest.display()))?;

    // 8. Record audit log entry
    let audit_id = format!("audit_{}", uuid::Uuid::new_v4());
    let metadata_json = serde_json::json!({
        "archive_path": destination_path,
        "size_bytes": encrypted_pack.len(),
        "total_records": total_records,
        "business_id": business_id,
    })
    .to_string();

    let _ = sqlx::query(
        "INSERT INTO audit_log (id, workspace_id, branch_id, action, performed_by_user_id, target_entity_type, target_entity_id, metadata) VALUES (?, ?, ?, 'disaster_recovery_exported', ?, 'business', ?, ?)"
    )
    .bind(&audit_id)
    .bind(&workspace_id)
    .bind(&branch_id)
    .bind(exported_by_user_id.as_deref())
    .bind(&business_id)
    .bind(&metadata_json)
    .execute(pool)
    .await;

    Ok(ExportResult {
        archive_path: destination_path.to_string(),
        size_bytes: encrypted_pack.len() as u64,
        business_id,
        business_name,
        total_records,
        created_at,
    })
}

/// Decrypt and inspect a .core backup pack for restoration preview
pub async fn preview_disaster_recovery_pack(
    pool: &SqlitePool,
    archive_path: &str,
    password: &str,
) -> Result<BackupPreview, String> {
    let encrypted_bytes = fs::read(archive_path)
        .map_err(|e| format!("Failed to open backup archive file ({archive_path}): {e}"))?;

    let decrypted_zip_bytes = decrypt_core_pack(password, &encrypted_bytes)?;

    let mut zip = ZipArchive::new(std::io::Cursor::new(decrypted_zip_bytes))
        .map_err(|e| format!("Failed to parse zip archive: {e}"))?;

    // 1. Read manifest
    let mut manifest_file = zip
        .by_name("manifest.json")
        .map_err(|_| "Backup archive is missing 'manifest.json' metadata.".to_string())?;

    let mut manifest_buf = Vec::new();
    manifest_file
        .read_to_end(&mut manifest_buf)
        .map_err(|e| format!("Failed to read manifest file: {e}"))?;

    let manifest: BackupManifest = serde_json::from_slice(&manifest_buf)
        .map_err(|e| format!("Failed to parse backup manifest JSON: {e}"))?;

    drop(manifest_file);

    // 2. Check schema compatibility
    let current_app_schema = query_schema_version(pool).await?;
    let is_schema_compatible = manifest.schema_version <= current_app_schema;

    // 3. Verify files checksums inside zip
    let mut checksum_valid = true;
    for file_entry in &manifest.file_entries {
        if let Ok(mut zf) = zip.by_name(&file_entry.relative_path) {
            let mut file_content = Vec::new();
            if zf.read_to_end(&mut file_content).is_ok() {
                let actual_sha = compute_bytes_sha256(&file_content);
                if actual_sha != file_entry.sha256 {
                    checksum_valid = false;
                    tracing::warn!(
                        "Checksum mismatch for file in backup: {} (expected {}, got {})",
                        file_entry.relative_path,
                        file_entry.sha256,
                        actual_sha
                    );
                }
            } else {
                checksum_valid = false;
            }
        } else {
            checksum_valid = false;
        }
    }

    let total_records: u64 = manifest.record_counts.values().sum();
    let file_count = manifest.file_entries.len() as u64;
    let total_file_bytes: u64 = manifest.file_entries.iter().map(|e| e.size_bytes).sum();

    Ok(BackupPreview {
        business_id: manifest.business_id,
        business_name: manifest.business_name,
        workspace_id: manifest.workspace_id,
        branch_id: manifest.branch_id,
        created_at: manifest.created_at,
        app_version: manifest.app_version,
        schema_version: manifest.schema_version,
        is_schema_compatible,
        total_records,
        record_counts: manifest.record_counts,
        file_count,
        total_file_bytes,
        checksum_valid,
    })
}

/// Execute full Disaster Recovery restoration from a .core backup file
pub async fn restore_disaster_recovery_pack<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    state: &crate::db::AppState,
    archive_path: &str,
    password: &str,
    performed_by_user_id: Option<String>,
) -> Result<RestoreResult, String> {
    use tauri::Manager;

    let encrypted_bytes = fs::read(archive_path)
        .map_err(|e| format!("Failed to read backup archive file ({archive_path}): {e}"))?;

    let zip_bytes = decrypt_core_pack(password, &encrypted_bytes)?;

    let mut zip = ZipArchive::new(std::io::Cursor::new(zip_bytes))
        .map_err(|e| format!("Failed to read zip contents: {e}"))?;

    // 1. Stage archive in a temporary staging folder
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {e}"))?;
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {e}"))?;

    let staging_dir = app_data_dir.join(format!("staging_restore_{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&staging_dir)
        .map_err(|e| format!("Failed to create staging directory: {e}"))?;

    let mut total_extracted_bytes: u64 = 0;
    let file_count = zip.len();

    if file_count > MAX_FILE_COUNT {
        let _ = fs::remove_dir_all(&staging_dir);
        return Err(format!("Backup archive contains too many files ({file_count}). Max permitted is {MAX_FILE_COUNT}."));
    }

    // Extract files safely
    for i in 0..zip.len() {
        let mut zip_file = zip.by_index(i).map_err(|e| format!("Zip extraction error at index {i}: {e}"))?;
        let raw_name = zip_file.name().to_string();

        if zip_file.is_dir() {
            continue;
        }

        let rel_path = sanitize_zip_path(&raw_name)?;
        let target_path = staging_dir.join(&rel_path);

        if let Some(parent) = target_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create staging subfolder: {e}"))?;
        }

        let uncompressed_size = zip_file.size();
        if uncompressed_size > MAX_FILE_SIZE_BYTES {
            let _ = fs::remove_dir_all(&staging_dir);
            return Err(format!("File '{raw_name}' in backup exceeds maximum permitted file size limit."));
        }

        total_extracted_bytes += uncompressed_size;
        if total_extracted_bytes > MAX_TOTAL_EXTRACT_BYTES {
            let _ = fs::remove_dir_all(&staging_dir);
            return Err("Backup archive extracted size exceeds total maximum size limit (2 GB).".to_string());
        }

        let mut out_file = File::create(&target_path)
            .map_err(|e| format!("Failed to create staging file ({}): {e}", target_path.display()))?;

        std::io::copy(&mut zip_file, &mut out_file)
            .map_err(|e| format!("Failed to write staging file ({}): {e}", target_path.display()))?;
    }

    // 2. Read and validate manifest in staging
    let manifest_path = staging_dir.join("manifest.json");
    if !manifest_path.exists() {
        let _ = fs::remove_dir_all(&staging_dir);
        return Err("Restoration failed: 'manifest.json' not found in backup.".to_string());
    }

    let manifest_bytes = fs::read(&manifest_path)
        .map_err(|e| format!("Failed to read manifest from staging: {e}"))?;
    let manifest: BackupManifest = serde_json::from_slice(&manifest_bytes)
        .map_err(|e| format!("Failed to parse staging manifest JSON: {e}"))?;

    let staged_db_path = staging_dir.join("database.sqlite");
    if !staged_db_path.exists() {
        let _ = fs::remove_dir_all(&staging_dir);
        return Err("Restoration failed: 'database.sqlite' missing from backup archive.".to_string());
    }

    // 3. Open staged DB to verify integrity and run pending migrations
    let staged_connect_opts = SqliteConnectOptions::new()
        .filename(&staged_db_path)
        .foreign_keys(true);

    let staged_pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(staged_connect_opts)
        .await
        .map_err(|e| format!("Failed to open staged backup database: {e}"))?;

    // Check PRAGMA integrity_check and foreign_key_check
    let integrity_row: (String,) = sqlx::query_as("PRAGMA integrity_check")
        .fetch_one(&staged_pool)
        .await
        .map_err(|e| format!("Integrity check on backup database failed: {e}"))?;

    if integrity_row.0 != "ok" {
        staged_pool.close().await;
        let _ = fs::remove_dir_all(&staging_dir);
        return Err(format!("Backup database is corrupted: {}", integrity_row.0));
    }

    let fk_violations: Vec<(String, Option<i64>, String, i64)> =
        sqlx::query_as("PRAGMA foreign_key_check")
            .fetch_all(&staged_pool)
            .await
            .map_err(|e| format!("Foreign key check failed: {e}"))?;

    if !fk_violations.is_empty() {
        staged_pool.close().await;
        let _ = fs::remove_dir_all(&staging_dir);
        return Err(format!("Backup database contains {} foreign key violations.", fk_violations.len()));
    }

    // Check schema version and run migrations on staging DB if needed
    let current_app_schema = query_schema_version(&state.pool).await?;
    if manifest.schema_version > current_app_schema {
        staged_pool.close().await;
        let _ = fs::remove_dir_all(&staging_dir);
        return Err(format!(
            "Cannot restore backup: Schema version ({}) is newer than current app schema ({current_app_schema}). Please update 40Labs Core.",
            manifest.schema_version
        ));
    } else if manifest.schema_version < current_app_schema {
        tracing::info!(
            "Backup database schema version ({}) is older than current ({current_app_schema}). Running migrations on staging database...",
            manifest.schema_version
        );
        static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../../../infra/db/sqlite-schema/migrations");
        MIGRATOR
            .run(&staged_pool)
            .await
            .map_err(|e| format!("Failed to apply migrations to restored database: {e}"))?;
    }

    staged_pool.close().await;

    // 4. Create Pre-Restore Safety Backup
    let backups_folder = app_data_dir.join("backups");
    fs::create_dir_all(&backups_folder)
        .map_err(|e| format!("Failed to create safety backups directory: {e}"))?;

    let safety_folder_name = format!("pre_restore_safety_{}", Utc::now().format("%Y%m%d_%H%M%S"));
    let safety_dir = backups_folder.join(&safety_folder_name);
    fs::create_dir_all(&safety_dir)
        .map_err(|e| format!("Failed to create safety backup folder: {e}"))?;

    let live_db_path = if cfg!(debug_assertions) {
        crate::db::resolve_db_file_path().map_err(|e| e.to_string())?
    } else {
        app_data_dir.join("40labs.db")
    };

    if live_db_path.exists() {
        let backup_db_path = safety_dir.join("40labs.db");
        fs::copy(&live_db_path, &backup_db_path)
            .map_err(|e| format!("Failed to create safety copy of current database: {e}"))?;
    }

    let doc_root = crate::services::documents::documents_root(app).ok();
    if let Some(ref docs) = doc_root {
        if docs.exists() {
            let safety_docs = safety_dir.join("Documents");
            let _ = copy_recursively(docs, &safety_docs);
        }
    }

    // 5. Swap live database and documents with staging data
    tracing::info!("Closing active live database connections before swapping restored database...");
    state.pool.close().await;

    let swap_res: Result<(), String> = async {
        // Remove WAL/SHM files
        let wal_path = PathBuf::from(format!("{}-wal", live_db_path.display()));
        let shm_path = PathBuf::from(format!("{}-shm", live_db_path.display()));
        let _ = fs::remove_file(&wal_path);
        let _ = fs::remove_file(&shm_path);

        fs::copy(&staged_db_path, &live_db_path)
            .map_err(|e| format!("Failed to overwrite live database with restored database: {e}"))?;

        // Restore files into Documents folder
        let staged_files_dir = staging_dir.join("files");
        if staged_files_dir.exists() {
            if let Some(ref docs) = doc_root {
                fs::create_dir_all(docs)
                    .map_err(|e| format!("Failed to prepare documents directory: {e}"))?;
                copy_recursively(&staged_files_dir, docs)
                    .map_err(|e| format!("Failed to copy restored files to Documents folder: {e}"))?;
            }
        }
        Ok(())
    }
    .await;

    // Clean up staging directory
    let _ = fs::remove_dir_all(&staging_dir);

    if let Err(swap_err) = swap_res {
        tracing::error!("Restoration swap failed: {swap_err}. Attempting rollback from safety backup...");
        if let Err(rb_err) = rollback_from_safety(&live_db_path, doc_root.as_deref(), &safety_dir) {
            tracing::error!("CRITICAL: Rollback failed: {rb_err}");
            return Err(format!("Restoration failed ({swap_err}) and rollback failed ({rb_err}). Please inspect safety backup at {}", safety_dir.display()));
        }
        return Err(format!("Restoration failed: {swap_err}. Application was safely rolled back to pre-restore state."));
    }

    // 6. Verify restored database by opening it with state pool
    // Re-initialize live database pool
    let new_pool_res = crate::db::init_db_pool_for_app(app)
        .await
        .map_err(|e| e.to_string());

    let new_pool = match new_pool_res {
        Ok(p) => p,
        Err(e) => {
            tracing::error!("Failed to re-initialize database pool after restore: {e}. Rolling back...");
            let _ = rollback_from_safety(&live_db_path, doc_root.as_deref(), &safety_dir);
            return Err(format!("Failed to connect to restored database ({e}). Rolled back to previous state."));
        }
    };

    // Note: Since `state.pool` in AppState is a value (SqlitePool), in Rust/SQLx SqlitePool is an Arc internally,
    // closing it closed all handles. We record audit log on `new_pool`.
    let total_records_restored: u64 = manifest.record_counts.values().sum();
    let restored_at = Utc::now().to_rfc3339();

    let audit_id = format!("audit_{}", uuid::Uuid::new_v4());
    let audit_meta = serde_json::json!({
        "original_business_id": manifest.business_id,
        "original_business_name": manifest.business_name,
        "backup_created_at": manifest.created_at,
        "safety_backup_path": safety_dir.to_string_lossy(),
        "total_records_restored": total_records_restored,
    })
    .to_string();

    let _ = sqlx::query(
        "INSERT INTO audit_log (id, workspace_id, branch_id, action, performed_by_user_id, target_entity_type, target_entity_id, metadata) VALUES (?, ?, ?, 'disaster_recovery_restored', ?, 'business', ?, ?)"
    )
    .bind(&audit_id)
    .bind(&manifest.workspace_id)
    .bind(&manifest.branch_id)
    .bind(performed_by_user_id.as_deref())
    .bind(&manifest.business_id)
    .bind(&audit_meta)
    .execute(&new_pool)
    .await;

    Ok(RestoreResult {
        business_id: manifest.business_id,
        business_name: manifest.business_name,
        total_records_restored,
        files_restored: manifest.file_entries.len() as u64,
        safety_backup_path: safety_dir.to_string_lossy().to_string(),
        restored_at,
    })
}

fn copy_recursively(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst)
        .map_err(|e| format!("Failed to create destination dir ({}): {e}", dst.display()))?;
    for entry in fs::read_dir(src).map_err(|e| e.to_string())?.flatten() {
        let ty = entry.file_type().map_err(|e| e.to_string())?;
        let src_p = entry.path();
        let dst_p = dst.join(entry.file_name());
        if ty.is_dir() {
            copy_recursively(&src_p, &dst_p)?;
        } else {
            fs::copy(&src_p, &dst_p)
                .map_err(|e| format!("Failed to copy file ({} -> {}): {e}", src_p.display(), dst_p.display()))?;
        }
    }
    Ok(())
}

fn rollback_from_safety(live_db_path: &Path, doc_root: Option<&Path>, safety_dir: &Path) -> Result<(), String> {
    let safety_db = safety_dir.join("40labs.db");
    if safety_db.exists() {
        fs::copy(&safety_db, live_db_path)
            .map_err(|e| format!("Failed to restore database from safety copy: {e}"))?;
    }
    let safety_docs = safety_dir.join("Documents");
    if safety_docs.exists() {
        if let Some(docs) = doc_root {
            copy_recursively(&safety_docs, docs)?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_decryption_roundtrip() {
        let password = "SuperSecretPassword123!";
        let plaintext = b"Hello 40Labs Disaster Recovery Pack Payload!";

        let encrypted = encrypt_core_pack(password, plaintext).expect("Encryption failed");
        assert!(encrypted.len() > HEADER_SIZE);

        let decrypted = decrypt_core_pack(password, &encrypted).expect("Decryption failed");
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_incorrect_password_fails() {
        let password = "CorrectPassword123!";
        let wrong_password = "WrongPassword456!";
        let plaintext = b"Sensitive business data";

        let encrypted = encrypt_core_pack(password, plaintext).unwrap();
        let res = decrypt_core_pack(wrong_password, &encrypted);

        assert!(res.is_err());
        assert!(res.unwrap_err().contains("Incorrect password"));
    }

    #[test]
    fn test_corrupted_ciphertext_fails() {
        let password = "Password123!";
        let plaintext = b"Data to encrypt";

        let mut encrypted = encrypt_core_pack(password, plaintext).unwrap();
        // Tamper with ciphertext byte
        let len = encrypted.len();
        encrypted[len - 1] ^= 0xFF;

        let res = decrypt_core_pack(password, &encrypted);
        assert!(res.is_err());
    }

    #[test]
    fn test_path_traversal_sanitization() {
        assert!(sanitize_zip_path("../../etc/passwd").is_err());
        assert!(sanitize_zip_path("..\\windows\\system32\\cmd.exe").is_err());
        assert!(sanitize_zip_path("/var/data").is_err());
        assert!(sanitize_zip_path("files/malicious.exe").is_err());
        assert!(sanitize_zip_path("files/reports/valid_report.pdf").is_ok());
    }

    #[tokio::test]
    async fn test_database_export_and_preview_integration() {
        use crate::db::init_db_pool_with_url;

        let test_dir = std::env::temp_dir().join(format!("40labs_dr_test_{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&test_dir).unwrap();

        let db_path = test_dir.join("live.db");
        let pool = init_db_pool_with_url(&format!("sqlite:{}?mode=rwc", db_path.display()))
            .await
            .unwrap();

        // Insert business profile
        sqlx::query(
            r#"
            INSERT INTO business (
                id, workspace_id, branch_id, business_id, name, tin, tmda_number,
                role_scopes, tier, contact_mobile, contact_email, appearance_mode,
                onboarding_state, country, language, created_at, updated_at
            ) VALUES (
                'biz_test_1', 'ws_dr_test', 'br_dr_test', 'AFYA-9999', 'Afya Disaster Recovery Pharmacy',
                '123456789', 'TMDA-999', '["pharmacy"]', 'free', '+255700000000',
                'info@afyadr.co.tz', 'light', 'setup_complete', 'TZ', 'sw-TZ',
                '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
            )
            "#,
        )
        .execute(&pool)
        .await
        .unwrap();

        // Insert customer
        sqlx::query(
            r#"
            INSERT INTO customer (
                id, workspace_id, branch_id, full_name, phone, outstanding_balance, created_at, updated_at
            ) VALUES (
                'cust_dr_1', 'ws_dr_test', 'br_dr_test', 'Juma Kapoya', '+255712345678', 15000,
                '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
            )
            "#,
        )
        .execute(&pool)
        .await
        .unwrap();

        let archive_path = test_dir.join("disaster_pack.core");
        let password = "DR_Test_Password_2026!";

        let export_res = export_disaster_recovery_pack_impl(
            &pool,
            None,
            &archive_path.to_string_lossy(),
            password,
            Some("user_dr_1".to_string()),
        )
        .await
        .expect("Export should succeed");

        assert_eq!(export_res.business_id, "AFYA-9999");
        assert_eq!(export_res.business_name, "Afya Disaster Recovery Pharmacy");
        assert!(export_res.size_bytes > 0);
        assert!(archive_path.exists());

        // Preview
        let preview = preview_disaster_recovery_pack(
            &pool,
            &archive_path.to_string_lossy(),
            password,
        )
        .await
        .expect("Preview should succeed");

        assert_eq!(preview.business_id, "AFYA-9999");
        assert_eq!(preview.business_name, "Afya Disaster Recovery Pharmacy");
        assert!(preview.is_schema_compatible);
        assert!(preview.checksum_valid);
        assert_eq!(*preview.record_counts.get("customer").unwrap_or(&0), 1);

        // Wrong password fails
        let wrong_pw = preview_disaster_recovery_pack(
            &pool,
            &archive_path.to_string_lossy(),
            "WrongPassword123!",
        )
        .await;
        assert!(wrong_pw.is_err());

        pool.close().await;
        let _ = fs::remove_dir_all(&test_dir);
    }
}
