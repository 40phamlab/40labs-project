use tauri::{State, Manager};
use sha2::{Sha256, Digest};
use crate::db::AppState;
use crate::models::notification::{
    Notification, NotificationMessage, MessageAttachment,
    SendMessagePayload, SaveAttachmentPayload
};
use crate::repositories::notification_repo::NotificationRepository;
use crate::auth::{AuthEngine, AuthErrorResponse};
use crate::services::documents::{ExportCategory, ensure_layout, sanitize_file_name, unique_path};

const MAX_IMAGE_SIZE: i64 = 16 * 1024 * 1024; // 16 MB
const MAX_AUDIO_SIZE: i64 = 16 * 1024 * 1024; // 16 MB
const MAX_FILE_SIZE: i64 = 100 * 1024 * 1024; // 100 MB

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
}

#[tauri::command]
pub async fn create_notification(
    state: State<'_, AppState>,
    payload: CreateNotificationPayload,
) -> Result<Notification, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;

    let now = chrono::Utc::now().to_rfc3339();
    let notif_id = format!("notif_{}", uuid::Uuid::new_v4());
    let subject = format!("{} Notification", payload.category.to_uppercase());
    let channel = payload.channel.unwrap_or_else(|| "amob".to_string());

    let notif = Notification {
        id: notif_id.clone(),
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        category: payload.category,
        source_type: "remote".to_string(),
        sender_name: payload.sender_name,
        sender_business_id: None,
        subject,
        body: payload.body.clone(),
        status: "unread".to_string(),
        channel,
        content_type: Some("text".to_string()),
        html_content: None,
        plain_text_content: Some(payload.body.clone()),
        related_entity_type: None,
        related_entity_id: None,
        received_at: now.clone(),
        created_at: now.clone(),
        updated_at: now.clone(),
    };

    NotificationRepository::create(&state.pool, &notif)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

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

    Ok(notif)
}

#[tauri::command]
pub async fn get_notifications(
    state: State<'_, AppState>,
) -> Result<Vec<Notification>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;
    NotificationRepository::list(&state.pool, &ctx.workspace_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn get_notification_messages(
    state: State<'_, AppState>,
    notification_id: String,
) -> Result<Vec<NotificationMessage>, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;
    NotificationRepository::list_messages(&state.pool, &ctx.workspace_id, &notification_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())
}

#[tauri::command]
pub async fn send_notification_message(
    state: State<'_, AppState>,
    payload: SendMessagePayload,
) -> Result<NotificationMessage, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;

    let notif = NotificationRepository::get_by_id(&state.pool, &ctx.workspace_id, &payload.notification_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| crate::auth::AuthError::NotFound("Notification not found".to_string()).to_response())?;

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

    NotificationRepository::create_message(&state.pool, &msg)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    let time_str = chrono::Local::now().format("%H:%M").to_string();
    let reply_formatted = format!("\n\n--- You replied ({}) ---\n{}", time_str, payload.body);
    let updated_body = format!("{}{}", notif.body, reply_formatted);

    sqlx::query(
        "UPDATE notifications SET body = ?, status = 'read', updated_at = ? WHERE workspace_id = ? AND id = ?"
    )
    .bind(&updated_body)
    .bind(&now)
    .bind(&ctx.workspace_id)
    .bind(&payload.notification_id)
    .execute(&state.pool)
    .await
    .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    Ok(msg)
}

#[tauri::command]
pub async fn mark_notification_read(
    state: State<'_, AppState>,
    id: String,
) -> Result<Notification, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;

    NotificationRepository::update_status(&state.pool, &ctx.workspace_id, &id, "read")
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    NotificationRepository::get_by_id(&state.pool, &ctx.workspace_id, &id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| crate::auth::AuthError::NotFound("Notification not found".to_string()).to_response())
}

#[tauri::command]
pub async fn archive_notification(
    state: State<'_, AppState>,
    id: String,
) -> Result<Notification, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;

    NotificationRepository::soft_delete(&state.pool, &ctx.workspace_id, &id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?;

    NotificationRepository::get_by_id(&state.pool, &ctx.workspace_id, &id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| crate::auth::AuthError::NotFound("Notification not found".to_string()).to_response())
}

#[tauri::command]
pub async fn save_attachment(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    payload: SaveAttachmentPayload,
) -> Result<MessageAttachment, AuthErrorResponse> {
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;

    // Validate mime vs kind
    let mime_lower = payload.mime_type.to_lowercase();
    match payload.kind.as_str() {
        "image" => {
            if !mime_lower.starts_with("image/") {
                return Err(crate::auth::AuthError::PolicyViolation("Mime type must be image/* for kind 'image'".to_string()).to_response());
            }
        }
        "audio" => {
            if !mime_lower.starts_with("audio/") {
                return Err(crate::auth::AuthError::PolicyViolation("Mime type must be audio/* for kind 'audio'".to_string()).to_response());
            }
        }
        "file" => {
            // file can be any mime type (video, application/*, etc.)
        }
        _ => return Err(crate::auth::AuthError::PolicyViolation("Invalid attachment kind".to_string()).to_response()),
    }

    let app_data_dir = app.path().app_data_dir()
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
            return Err(crate::auth::AuthError::PolicyViolation("Bytes exceed 16MB IPC limit; use source_path for large files".to_string()).to_response());
        }
        if bytes.len() as i64 > limit {
            return Err(crate::auth::AuthError::PolicyViolation(format!("Attachment exceeds size limit for kind '{}'", payload.kind)).to_response());
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
            return Err(crate::auth::AuthError::PolicyViolation("Source path must be an absolute file".to_string()).to_response());
        }

        let mut src_file = match tokio::fs::File::open(src_path).await {
            Ok(f) => f,
            Err(e) => return Err(crate::auth::AuthError::NotFound(format!("Source file not found: {}", e)).to_response()),
        };
        let mut dest_file = match tokio::fs::File::create(&full_storage_path).await {
            Ok(f) => f,
            Err(e) => return Err(crate::auth::AuthError::InternalError(e.to_string()).to_response()),
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
                return Err(crate::auth::AuthError::PolicyViolation(format!("File exceeds size limit for kind '{}'", payload.kind)).to_response());
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
        return Err(crate::auth::AuthError::PolicyViolation("Either bytes or source_path must be provided".to_string()).to_response());
    }

    let sha256_hash = format!("{:x}", hasher.finalize());

    let now = chrono::Utc::now().to_rfc3339();
    let attachment = MessageAttachment {
        id: attachment_id,
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        message_id: payload.message_id,
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
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;

    let att = NotificationRepository::get_attachment(&state.pool, &ctx.workspace_id, &attachment_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| crate::auth::AuthError::NotFound("Attachment not found".to_string()).to_response())?;

    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    let source_path = app_data_dir.join(&att.storage_path);

    let canonical_app_data = app_data_dir.canonicalize()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    let canonical_source = source_path.canonicalize()
        .map_err(|_e| crate::auth::AuthError::NotFound("Stored file not found".to_string()).to_response())?;

    let expected_prefix = canonical_app_data.join("attachments").join(&ctx.workspace_id);
    if !canonical_source.starts_with(&expected_prefix) {
        return Err(crate::auth::AuthError::PolicyViolation("Access denied: path traversal attempt".to_string()).to_response());
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
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;

    let att = NotificationRepository::get_attachment(&state.pool, &ctx.workspace_id, &attachment_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| crate::auth::AuthError::NotFound("Attachment not found".to_string()).to_response())?;

    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    let source_path = app_data_dir.join(&att.storage_path);

    let canonical_app_data = app_data_dir.canonicalize()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    let canonical_source = source_path.canonicalize()
        .map_err(|_e| crate::auth::AuthError::NotFound("Stored file not found".to_string()).to_response())?;

    let expected_prefix = canonical_app_data.join("attachments").join(&ctx.workspace_id);
    if !canonical_source.starts_with(&expected_prefix) {
        return Err(crate::auth::AuthError::PolicyViolation("Access denied".to_string()).to_response());
    }

    let root = ensure_layout(&app)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())?;
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
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let _ctx = engine.require_session().await.map_err(|e| e.to_response())?;

    if bytes.len() as i64 > MAX_FILE_SIZE {
        return Err(crate::auth::AuthError::PolicyViolation("File exceeds 100MB limit".to_string()).to_response());
    }

    let root = ensure_layout(&app)
        .map_err(|e| crate::auth::AuthError::InternalError(e).to_response())?;
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
    let engine = AuthEngine::new(state.auth_state.clone(), state.pool.clone(), state.keystore.clone());
    let ctx = engine.require_session().await.map_err(|e| e.to_response())?;

    let att = NotificationRepository::get_attachment(&state.pool, &ctx.workspace_id, &attachment_id)
        .await
        .map_err(|e| crate::auth::AuthError::DatabaseError(e.to_string()).to_response())?
        .ok_or_else(|| crate::auth::AuthError::NotFound("Attachment not found".to_string()).to_response())?;

    let dest = std::path::PathBuf::from(&dest_path);
    if !dest.is_absolute() {
        return Err(crate::auth::AuthError::PolicyViolation("Destination path must be absolute".to_string()).to_response());
    }

    let path_str = dest.to_string_lossy();
    if path_str.starts_with(r"\\?\") || path_str.starts_with(r"\\.\") || path_str.starts_with(r"//?/") || path_str.starts_with(r"//./") {
        return Err(crate::auth::AuthError::PolicyViolation("UNC and device paths are prohibited".to_string()).to_response());
    }

    let file_name_comp = dest.file_name()
        .ok_or_else(|| crate::auth::AuthError::PolicyViolation("Invalid destination file name".to_string()).to_response())?
        .to_string_lossy();
    let sanitized_file_name = sanitize_file_name(&file_name_comp);

    let parent = dest.parent()
        .ok_or_else(|| crate::auth::AuthError::PolicyViolation("Invalid destination directory".to_string()).to_response())?;
    let final_dest = parent.join(sanitized_file_name);

    if let Some(p) = final_dest.parent() {
        std::fs::create_dir_all(p)
            .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    }

    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    let source_path = app_data_dir.join(&att.storage_path);

    let canonical_app_data = app_data_dir.canonicalize()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    let canonical_source = source_path.canonicalize()
        .map_err(|_e| crate::auth::AuthError::NotFound("Stored file not found".to_string()).to_response())?;

    let expected_prefix = canonical_app_data.join("attachments").join(&ctx.workspace_id);
    if !canonical_source.starts_with(&expected_prefix) {
        return Err(crate::auth::AuthError::PolicyViolation("Access denied".to_string()).to_response());
    }

    std::fs::copy(&canonical_source, &final_dest)
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;

    Ok(final_dest.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_mime_vs_kind_validation_logic() {
        let is_valid = |kind: &str, mime: &str| {
            let mime_lower = mime.to_lowercase();
            match kind {
                "image" => mime_lower.starts_with("image/"),
                "audio" => mime_lower.starts_with("audio/"),
                "file" => true,
                _ => false,
            }
        };

        assert!(is_valid("image", "image/png"));
        assert!(!is_valid("image", "application/pdf"));
        assert!(is_valid("audio", "audio/mpeg"));
        assert!(!is_valid("audio", "image/png"));
        assert!(is_valid("file", "application/pdf"));
        assert!(is_valid("file", "video/mp4"));
    }
}

