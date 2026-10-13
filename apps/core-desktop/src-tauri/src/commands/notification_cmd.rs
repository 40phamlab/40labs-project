use crate::auth::{AuthEngine, AuthErrorResponse};
use crate::db::AppState;
use crate::models::notification::{
    MessageAttachment, Notification, NotificationMessage, SaveAttachmentPayload, SendMessagePayload,
};
use crate::repositories::notification_repo::NotificationRepository;
use crate::services::documents::{ensure_layout, sanitize_file_name, unique_path, ExportCategory};
use sha2::{Digest, Sha256};
use tauri::{Manager, State};

const MAX_IMAGE_SIZE: i64 = 16 * 1024 * 1024; // 16 MB
const MAX_AUDIO_SIZE: i64 = 16 * 1024 * 1024; // 16 MB
const MAX_FILE_SIZE: i64 = 100 * 1024 * 1024; // 100 MB

fn validate_attachment_content(bytes: &[u8], kind: &str, file_name: &str, declared_mime: &str) -> Result<(), String> {
    let extension = std::path::Path::new(file_name).extension().and_then(|v| v.to_str())
        .map(|v| v.to_ascii_lowercase()).ok_or("File extension is required")?;
    if file_name.contains('/') || file_name.contains('\\') || file_name.starts_with('.') { return Err("Unsafe attachment file name".into()); }
    let detected = infer::get(bytes).map(|v| v.mime_type());
    let (expected_kind, expected_mime) = match extension.as_str() {
        "png" => ("image", "image/png"), "jpg" | "jpeg" => ("image", "image/jpeg"),
        "gif" => ("image", "image/gif"), "webp" => ("image", "image/webp"),
        "wav" => ("audio", "audio/wav"), "mp3" => ("audio", "audio/mpeg"),
        "ogg" | "oga" => ("audio", "audio/ogg"), "webm" => ("audio", "audio/webm"),
        "m4a" | "mp4" => ("audio", "audio/mp4"), "pdf" => ("file", "application/pdf"),
        "txt" => ("file", "text/plain"),
        _ => return Err("Unsupported type. Supported: PNG, JPEG, GIF, WebP, WAV, MP3, OGG, WebM, M4A/MP4 audio, PDF, and UTF-8 TXT".into()),
    };
    let declared_mime_base = declared_mime.split(';').next().unwrap_or("").trim();
    if kind != expected_kind || !declared_mime_base.eq_ignore_ascii_case(expected_mime) { return Err("Attachment kind or MIME type does not match its safe extension".into()); }
    if extension == "txt" {
        if bytes.is_empty() || std::str::from_utf8(bytes).is_err() || bytes.contains(&0) { return Err("TXT attachment must contain non-empty UTF-8 text".into()); }
    } else {
        let format_ok = match extension.as_str() {
            "png" => bytes.starts_with(b"\x89PNG\r\n\x1a\n") && bytes.len() >= 45 && bytes.get(12..16) == Some(b"IHDR") && bytes.windows(4).any(|w| w == b"IEND"),
            "jpg" | "jpeg" => bytes.starts_with(&[0xff, 0xd8, 0xff]) && bytes.ends_with(&[0xff, 0xd9]),
            "gif" => (bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a")) && bytes.ends_with(&[0x3b]),
            "webp" => bytes.len() >= 12 && bytes.starts_with(b"RIFF") && bytes.get(8..12) == Some(b"WEBP"),
            "wav" => bytes.len() >= 44 && bytes.starts_with(b"RIFF") && bytes.get(8..12) == Some(b"WAVE"),
            "mp3" => bytes.starts_with(b"ID3") || (bytes.len() > 2 && bytes[0] == 0xff && bytes[1] & 0xe0 == 0xe0),
            "ogg" | "oga" => bytes.starts_with(b"OggS"),
            "webm" => bytes.starts_with(b"\x1aE\xdf\xa3") && (bytes.windows(6).any(|w| w == b"A_OPUS") || bytes.windows(8).any(|w| w == b"A_VORBIS")),
            "m4a" | "mp4" => bytes.len() >= 12 && bytes.get(4..8) == Some(b"ftyp") && bytes.windows(4).any(|w| w == b"soun"),
            "pdf" => bytes.starts_with(b"%PDF-") && bytes.windows(5).rev().take(1024).any(|w| w == b"%%EOF"),
            _ => false,
        };
        let detected_matches = detected == Some(expected_mime)
            || (expected_mime == "audio/mp4" && detected == Some("video/mp4"))
            || (extension == "webm" && detected == Some("video/webm"));
        if !format_ok || !detected_matches {
            return Err("File content signature or format structure does not match its declared type".into());
        }
    }
    Ok(())
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExportResult {
    pub path: String,
    pub folder: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CreateNotificationPayload {
    pub category: String,
    pub sender_name: String,
    pub sender_address: Option<String>,
    pub body: String,
    pub channel: Option<String>,
    pub recipient_customer_id: Option<String>,
}

#[tauri::command]
pub async fn create_notification(
    state: State<'_, AppState>,
    payload: CreateNotificationPayload,
) -> Result<Notification, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    let recipient = if let Some(customer_id) = payload.recipient_customer_id.as_deref() {
        Some(crate::repositories::customer_repo::CustomerRepository::get_by_id(
            &state.pool,
            &ctx.workspace_id,
            customer_id,
        ).await.map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
        .filter(|customer| customer.archived_at.is_none())
        .ok_or_else(|| crate::auth::AuthError::NotFound("Customer not found in this workspace".to_string()).to_response())?)
    } else {
        None
    };

    let sender_name = recipient.as_ref().map(|c| c.full_name.as_str()).unwrap_or(&payload.sender_name);

    let now = chrono::Utc::now().to_rfc3339();
    let notif_id = format!("notif_{}", uuid::Uuid::new_v4());
    let subject = if recipient.is_some() {
        format!("Conversation with {}", sender_name)
    } else {
        format!("{} Notification", payload.category.to_uppercase())
    };
    let channel = payload.channel.unwrap_or_else(|| "amob".to_string());

    let notif = Notification {
        id: notif_id.clone(),
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        category: payload.category,
        source_type: "remote".to_string(),
        sender_name: sender_name.to_string(),
        sender_business_id: None,
        subject,
        body: payload.body.clone(),
        status: "unread".to_string(),
        channel,
        content_type: Some("text".to_string()),
        html_content: None,
        plain_text_content: Some(payload.body.clone()),
        related_entity_type: recipient.as_ref().map(|_| "customer".to_string()),
        related_entity_id: recipient.as_ref().map(|c| c.id.clone()),
        received_at: now.clone(),
        created_at: now.clone(),
        updated_at: now.clone(),
    };

    NotificationRepository::create(&state.pool, &notif)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    if !payload.body.trim().is_empty() {
    let msg = NotificationMessage {
        id: format!("msg_{}", uuid::Uuid::new_v4()),
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        notification_id: notif_id,
        direction: "incoming".to_string(),
        content_type: "text".to_string(),
        body: payload.body,
        html_content: None,
        status: "read".to_string(),
        sent_at: now.clone(),
        created_at: now.clone(),
        updated_at: now,
        attachments: None,
    };

    NotificationRepository::create_message(&state.pool, &msg)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;
    }

    Ok(notif)
}

#[tauri::command]
pub async fn get_notifications(
    state: State<'_, AppState>,
) -> Result<Vec<Notification>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    NotificationRepository::list(&state.pool, &ctx.workspace_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn get_notification_messages(
    state: State<'_, AppState>,
    notification_id: String,
) -> Result<Vec<NotificationMessage>, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;
    NotificationRepository::list_messages(&state.pool, &ctx.workspace_id, &notification_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn send_notification_message(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    payload: SendMessagePayload,
) -> Result<NotificationMessage, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    let notif =
        NotificationRepository::get_by_id(&state.pool, &ctx.workspace_id, &payload.notification_id)
            .await
            .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
            .ok_or_else(|| {
                crate::auth::AuthError::NotFound("Notification not found".to_string()).to_response()
            })?;

    let now = chrono::Utc::now().to_rfc3339();
    let msg_id = format!("msg_{}", uuid::Uuid::new_v4());

    let msg = NotificationMessage {
        id: msg_id,
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        notification_id: payload.notification_id.clone(),
        direction: "outgoing".to_string(),
        content_type: payload.content_type.unwrap_or_else(|| "text".to_string()),
        body: payload.body.clone(),
        html_content: payload.html_content,
        status: "queued".to_string(),
        sent_at: now.clone(),
        created_at: now.clone(),
        updated_at: now.clone(),
        attachments: None,
    };

    let time_str = chrono::Local::now().format("%H:%M").to_string();
    let reply_formatted = format!("\n\n--- You replied ({}) ---\n{}", time_str, payload.body);
    let updated_body = format!("{}{}", notif.body, reply_formatted);

    let attachment_ids = payload.attachment_ids.unwrap_or_default();
    let mut seen = std::collections::HashSet::new();
    if attachment_ids.iter().any(|id| !seen.insert(id)) {
        return Err(crate::auth::AuthError::PolicyViolation("Duplicate attachment id".into()).to_response());
    }
    if let Err(err) = NotificationRepository::create_message_with_attachments(&state.pool, &msg, &attachment_ids, &updated_body).await {
        // Roll back staged uploads too, so a failed send leaves no orphaned rows or files.
        if let Ok(app_data_dir) = app.path().app_data_dir() {
            for id in &attachment_ids {
                if let Ok(Some(att)) = NotificationRepository::get_attachment(&state.pool, &ctx.workspace_id, id).await {
                    if att.message_id.is_none() {
                        if let (Ok(base), Ok(file)) = (
                            app_data_dir.join("attachments").join(&ctx.workspace_id).canonicalize(),
                            app_data_dir.join(&att.storage_path).canonicalize(),
                        ) {
                            if file.starts_with(base) { let _ = tokio::fs::remove_file(file).await; }
                        }
                        let _ = sqlx::query("DELETE FROM message_attachments WHERE id = ? AND workspace_id = ? AND message_id IS NULL")
                            .bind(id).bind(&ctx.workspace_id).execute(&state.pool).await;
                    }
                }
            }
        }
        return Err(crate::auth::AuthError::DatabaseError(err.to_string()).to_response());
    }

    Ok(msg)
}

#[tauri::command]
pub async fn mark_notification_read(
    state: State<'_, AppState>,
    id: String,
) -> Result<Notification, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    NotificationRepository::update_status(&state.pool, &ctx.workspace_id, &id, "read")
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    NotificationRepository::get_by_id(&state.pool, &ctx.workspace_id, &id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| {
            crate::auth::AuthError::NotFound("Notification not found".to_string()).to_response()
        })
}

#[tauri::command]
pub async fn archive_notification(
    state: State<'_, AppState>,
    id: String,
) -> Result<Notification, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    NotificationRepository::soft_delete(&state.pool, &ctx.workspace_id, &id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    NotificationRepository::get_by_id(&state.pool, &ctx.workspace_id, &id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| {
            crate::auth::AuthError::NotFound("Notification not found".to_string()).to_response()
        })
}

#[tauri::command]
pub async fn save_attachment(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    payload: SaveAttachmentPayload,
) -> Result<MessageAttachment, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    if !matches!(payload.kind.as_str(), "image" | "audio" | "file") {
        return Err(crate::auth::AuthError::PolicyViolation("Invalid attachment kind".to_string()).to_response());
    }

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;

    let attachment_id = format!("att_{}", uuid::Uuid::new_v4());
    let attachments_dir = app_data_dir.join("attachments").join(&ctx.workspace_id);
    tokio::fs::create_dir_all(&attachments_dir)
        .await
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;

    let full_storage_path = attachments_dir.join(&attachment_id);
    let storage_path_relative = format!("attachments/{}/{}", ctx.workspace_id, attachment_id);

    let mut size_bytes: i64 = 0;
    let mut hasher = Sha256::new();

    let limit = match payload.kind.as_str() {
        "image" => MAX_IMAGE_SIZE,
        "audio" => MAX_AUDIO_SIZE,
        "file" => MAX_FILE_SIZE,
        _ => MAX_FILE_SIZE,
    };

    if let Some(bytes) = &payload.bytes {
        if bytes.len() as i64 > 16 * 1024 * 1024 {
            return Err(crate::auth::AuthError::PolicyViolation(
                "Bytes exceed 16MB IPC limit; use source_path for large files".to_string(),
            )
            .to_response());
        }
        if bytes.len() as i64 > limit {
            return Err(crate::auth::AuthError::PolicyViolation(format!(
                "Attachment exceeds size limit for kind '{}'",
                payload.kind
            ))
            .to_response());
        }
        size_bytes = bytes.len() as i64;
        hasher.update(bytes);
        if let Err(e) = tokio::fs::write(&full_storage_path, bytes).await {
            let _ = tokio::fs::remove_file(&full_storage_path).await;
            return Err(crate::auth::AuthError::InternalError(e.to_string()).to_response());
        }
    } else if let Some(source_path_str) = &payload.source_path {
        let src_path = std::path::Path::new(source_path_str);
        if !src_path.is_absolute() || !src_path.is_file() {
            return Err(crate::auth::AuthError::PolicyViolation(
                "Source path must be an absolute file".to_string(),
            )
            .to_response());
        }

        let mut src_file = match tokio::fs::File::open(src_path).await {
            Ok(f) => f,
            Err(e) => {
                return Err(crate::auth::AuthError::NotFound(format!(
                    "Source file not found: {}",
                    e
                ))
                .to_response())
            }
        };
        let mut dest_file = match tokio::fs::File::create(&full_storage_path).await {
            Ok(f) => f,
            Err(e) => {
                return Err(crate::auth::AuthError::InternalError(e.to_string()).to_response())
            }
        };

        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let mut buf = [0u8; 8192];
        loop {
            let n = match src_file.read(&mut buf).await {
                Ok(0) => break,
                Ok(n) => n,
                Err(e) => {
                    let _ = tokio::fs::remove_file(&full_storage_path).await;
                    return Err(crate::auth::AuthError::InternalError(e.to_string()).to_response());
                }
            };
            size_bytes += n as i64;
            if size_bytes > limit {
                let _ = tokio::fs::remove_file(&full_storage_path).await;
                return Err(crate::auth::AuthError::PolicyViolation(format!(
                    "File exceeds size limit for kind '{}'",
                    payload.kind
                ))
                .to_response());
            }
            hasher.update(&buf[..n]);
            if let Err(e) = dest_file.write_all(&buf[..n]).await {
                let _ = tokio::fs::remove_file(&full_storage_path).await;
                return Err(crate::auth::AuthError::InternalError(e.to_string()).to_response());
            }
        }
        if let Err(e) = dest_file.flush().await {
            let _ = tokio::fs::remove_file(&full_storage_path).await;
            return Err(crate::auth::AuthError::InternalError(e.to_string()).to_response());
        }
    } else {
        return Err(crate::auth::AuthError::PolicyViolation(
            "Either bytes or source_path must be provided".to_string(),
        )
        .to_response());
    }

    let content = match tokio::fs::read(&full_storage_path).await {
        Ok(bytes) => bytes,
        Err(e) => { let _ = tokio::fs::remove_file(&full_storage_path).await; return Err(crate::auth::AuthError::InternalError(e.to_string()).to_response()); }
    };
    if let Err(reason) = validate_attachment_content(&content, &payload.kind, &payload.file_name, &payload.mime_type) {
        let _ = tokio::fs::remove_file(&full_storage_path).await;
        return Err(crate::auth::AuthError::PolicyViolation(reason).to_response());
    }

    let sha256_hash = format!("{:x}", hasher.finalize());

    let now = chrono::Utc::now().to_rfc3339();
    let attachment = MessageAttachment {
        id: attachment_id,
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        message_id: None,
        kind: payload.kind,
        file_name: payload.file_name,
        mime_type: payload.mime_type,
        size_bytes,
        storage_path: storage_path_relative,
        sha256: sha256_hash,
        duration_ms: None,
        created_at: now.clone(),
        updated_at: now.clone(),
    };

    if let Err(err) = NotificationRepository::create_attachment(&state.pool, &attachment).await {
        let _ = tokio::fs::remove_file(&full_storage_path).await;
        return Err(crate::auth::AuthError::DatabaseError(err.to_string()).to_response());
    }

    Ok(attachment)
}

#[tauri::command]
pub async fn resolve_attachment_path(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    attachment_id: String,
) -> Result<String, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    let att =
        NotificationRepository::get_attachment(&state.pool, &ctx.workspace_id, &attachment_id)
            .await
            .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
            .ok_or_else(|| {
                crate::auth::AuthError::NotFound("Attachment not found".to_string()).to_response()
            })?;

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    let source_path = app_data_dir.join(&att.storage_path);

    let canonical_app_data = app_data_dir
        .canonicalize()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    let canonical_source = source_path.canonicalize().map_err(|_e| {
        crate::auth::AuthError::NotFound("Stored file not found".to_string()).to_response()
    })?;

    let expected_prefix = canonical_app_data
        .join("attachments")
        .join(&ctx.workspace_id);
    if !canonical_source.starts_with(&expected_prefix) {
        return Err(crate::auth::AuthError::PolicyViolation(
            "Access denied: path traversal attempt".to_string(),
        )
        .to_response());
    }

    Ok(canonical_source.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn export_attachment(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    attachment_id: String,
    category: ExportCategory,
) -> Result<ExportResult, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    let att =
        NotificationRepository::get_attachment(&state.pool, &ctx.workspace_id, &attachment_id)
            .await
            .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
            .ok_or_else(|| {
                crate::auth::AuthError::NotFound("Attachment not found".to_string()).to_response()
            })?;

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    let source_path = app_data_dir.join(&att.storage_path);

    let canonical_app_data = app_data_dir
        .canonicalize()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    let canonical_source = source_path.canonicalize().map_err(|_e| {
        crate::auth::AuthError::NotFound("Stored file not found".to_string()).to_response()
    })?;

    let expected_prefix = canonical_app_data
        .join("attachments")
        .join(&ctx.workspace_id);
    if !canonical_source.starts_with(&expected_prefix) {
        return Err(
            crate::auth::AuthError::PolicyViolation("Access denied".to_string()).to_response(),
        );
    }

    let root =
        ensure_layout(&app).map_err(|e| crate::auth::AuthError::InternalError(e).to_response())?;
    let target_dir = root.join(category.folder_name());
    std::fs::create_dir_all(&target_dir)
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;

    let sanitized = sanitize_file_name(&att.file_name);
    let target_path = unique_path(&target_dir, &sanitized);

    std::fs::copy(&canonical_source, &target_path)
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;

    Ok(ExportResult {
        path: target_path.to_string_lossy().to_string(),
        folder: category.folder_name().to_string(),
    })
}

#[tauri::command]
pub async fn save_bytes_to_documents(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    category: ExportCategory,
    file_name: String,
    bytes: Vec<u8>,
) -> Result<ExportResult, AuthErrorResponse> {
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let _ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    if bytes.len() as i64 > MAX_FILE_SIZE {
        return Err(crate::auth::AuthError::PolicyViolation(
            "File exceeds 100MB limit".to_string(),
        )
        .to_response());
    }

    let root =
        ensure_layout(&app).map_err(|e| crate::auth::AuthError::InternalError(e).to_response())?;
    let target_dir = root.join(category.folder_name());
    std::fs::create_dir_all(&target_dir)
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;

    let sanitized = sanitize_file_name(&file_name);
    let target_path = unique_path(&target_dir, &sanitized);

    std::fs::write(&target_path, &bytes)
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;

    Ok(ExportResult {
        path: target_path.to_string_lossy().to_string(),
        folder: category.folder_name().to_string(),
    })
}

#[tauri::command]
pub async fn export_attachment_to_path(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    attachment_id: String,
    dest_path: String,
) -> Result<String, AuthErrorResponse> {
    // "Save as…" frontend-driven dialog export:
    // Requires an absolute path, rejects UNC/device paths (\\?\, \\.\), and sanitizes only the final component.
    // Why: When user chooses a specific destination via dialog, we respect their directory choice
    // but sanitize the filename component to prevent path injection/traversal while preserving target folder.
    let engine = AuthEngine::new(
        state.auth_state.clone(),
        state.pool.clone(),
        state.keystore.clone(),
    );
    let ctx = engine
        .require_session()
        .await
        .map_err(|e| e.to_response())?;

    let att =
        NotificationRepository::get_attachment(&state.pool, &ctx.workspace_id, &attachment_id)
            .await
            .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
            .ok_or_else(|| {
                crate::auth::AuthError::NotFound("Attachment not found".to_string()).to_response()
            })?;

    let dest = std::path::PathBuf::from(&dest_path);
    if !dest.is_absolute() {
        return Err(crate::auth::AuthError::PolicyViolation(
            "Destination path must be absolute".to_string(),
        )
        .to_response());
    }

    let path_str = dest.to_string_lossy();
    if path_str.starts_with(r"\\?\")
        || path_str.starts_with(r"\\.\")
        || path_str.starts_with(r"//?/")
        || path_str.starts_with(r"//./")
    {
        return Err(crate::auth::AuthError::PolicyViolation(
            "UNC and device paths are prohibited".to_string(),
        )
        .to_response());
    }

    let file_name_comp = dest
        .file_name()
        .ok_or_else(|| {
            crate::auth::AuthError::PolicyViolation("Invalid destination file name".to_string())
                .to_response()
        })?
        .to_string_lossy();
    let sanitized_file_name = sanitize_file_name(&file_name_comp);

    let parent = dest.parent().ok_or_else(|| {
        crate::auth::AuthError::PolicyViolation("Invalid destination directory".to_string())
            .to_response()
    })?;
    let final_dest = parent.join(sanitized_file_name);

    if let Some(p) = final_dest.parent() {
        std::fs::create_dir_all(p)
            .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    }

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    let source_path = app_data_dir.join(&att.storage_path);

    let canonical_app_data = app_data_dir
        .canonicalize()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    let canonical_source = source_path.canonicalize().map_err(|_e| {
        crate::auth::AuthError::NotFound("Stored file not found".to_string()).to_response()
    })?;

    let expected_prefix = canonical_app_data
        .join("attachments")
        .join(&ctx.workspace_id);
    if !canonical_source.starts_with(&expected_prefix) {
        return Err(
            crate::auth::AuthError::PolicyViolation("Access denied".to_string()).to_response(),
        );
    }

    std::fs::copy(&canonical_source, &final_dest)
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;

    Ok(final_dest.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::validate_attachment_content;

    #[test]
    fn rejects_invalid_signatures_and_mismatched_declarations() {
        assert!(validate_attachment_content(b"not a png", "image", "x.png", "image/png").is_err());
        assert!(validate_attachment_content(b"%PDF-1.7 fake", "image", "x.png", "image/png").is_err());
        assert!(validate_attachment_content(b"%PDF-1.7", "file", "x.pdf", "text/plain").is_err());
    }

    #[test]
    fn accepts_supported_content_with_matching_extension_and_mime() {
        let mut png = b"\x89PNG\r\n\x1a\n".to_vec();
        png.extend_from_slice(&[0, 0, 0, 13, b'I', b'H', b'D', b'R', 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 0, 0, 0, 0]);
        png.extend_from_slice(&[0, 0, 0, 0, b'I', b'E', b'N', b'D', 0, 0, 0, 0]);
        assert!(validate_attachment_content(&png, "image", "photo.png", "image/png").is_ok());
        assert!(validate_attachment_content(b"hello\n", "file", "notes.txt", "text/plain").is_ok());
    }

}
