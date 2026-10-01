use tauri::{State, Manager};
use sha2::{Sha256, Digest};
use crate::db::AppState;
use crate::models::notification::{
    Notification, NotificationMessage, MessageAttachment,
    SendMessagePayload, SaveAttachmentPayload
};
use crate::repositories::notification_repo::NotificationRepository;
use crate::models::{DEFAULT_WORKSPACE_ID, DEFAULT_BRANCH_ID};

const MAX_IMAGE_SIZE: i64 = 16 * 1024 * 1024; // 16 MB
const MAX_AUDIO_SIZE: i64 = 16 * 1024 * 1024; // 16 MB
const MAX_FILE_SIZE: i64 = 100 * 1024 * 1024; // 100 MB

#[tauri::command]
pub async fn get_notifications(
    state: State<'_, AppState>,
) -> Result<Vec<Notification>, String> {
    NotificationRepository::list(&state.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn get_notification_messages(
    state: State<'_, AppState>,
    notification_id: String,
) -> Result<Vec<NotificationMessage>, String> {
    NotificationRepository::list_messages(&state.pool, &notification_id)
        .await
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub async fn send_notification_message(
    state: State<'_, AppState>,
    payload: SendMessagePayload,
) -> Result<NotificationMessage, String> {
    let notif = NotificationRepository::get_by_id(&state.pool, &payload.notification_id)
        .await
        .map_err(|e| format!("Database error: {}", e))?
        .ok_or_else(|| "Notification not found".to_string())?;

    let now = chrono::Utc::now().to_rfc3339();
    let msg_id = format!("msg_{}", uuid::Uuid::new_v4());

    let msg = NotificationMessage {
        id: msg_id,
        workspace_id: notif.workspace_id.clone(),
        branch_id: notif.branch_id.clone(),
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
        .map_err(|e| format!("Database error: {}", e))?;

    // Append outgoing reply format into notification body for backwards compatibility/preview
    let time_str = chrono::Local::now().format("%H:%M").to_string();
    let reply_formatted = format!("\n\n--- You replied ({}) ---\n{}", time_str, payload.body);
    let updated_body = format!("{}{}", notif.body, reply_formatted);

    sqlx::query(
        "UPDATE notifications SET body = ?, status = 'read', updated_at = ? WHERE id = ?"
    )
    .bind(&updated_body)
    .bind(&now)
    .bind(&payload.notification_id)
    .execute(&state.pool)
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    Ok(msg)
}

#[tauri::command]
pub async fn mark_notification_read(
    state: State<'_, AppState>,
    id: String,
) -> Result<Notification, String> {
    NotificationRepository::update_status(&state.pool, &id, "read")
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    NotificationRepository::get_by_id(&state.pool, &id)
        .await
        .map_err(|e| format!("Database error: {}", e))?
        .ok_or_else(|| "Notification not found".to_string())
}

#[tauri::command]
pub async fn archive_notification(
    state: State<'_, AppState>,
    id: String,
) -> Result<Notification, String> {
    NotificationRepository::soft_delete(&state.pool, &id)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    NotificationRepository::get_by_id(&state.pool, &id)
        .await
        .map_err(|e| format!("Database error: {}", e))?
        .ok_or_else(|| "Notification not found".to_string())
}

#[tauri::command]
pub async fn save_attachment(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    payload: SaveAttachmentPayload,
) -> Result<MessageAttachment, String> {
    let bytes = match payload.bytes {
        Some(b) => b,
        None => return Err("Attachment bytes are required".to_string()),
    };

    match payload.kind.as_str() {
        "image" => {
            if bytes.len() as i64 > MAX_IMAGE_SIZE {
                return Err("Image attachment exceeds 16MB limit".to_string());
            }
        }
        "audio" => {
            if bytes.len() as i64 > MAX_AUDIO_SIZE {
                return Err("Audio attachment exceeds 16MB limit".to_string());
            }
        }
        "file" => {
            if bytes.len() as i64 > MAX_FILE_SIZE {
                return Err("File attachment exceeds 100MB limit".to_string());
            }
        }
        _ => return Err("Invalid attachment kind".to_string()),
    }

    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let sha256_hash = format!("{:x}", hasher.finalize());

    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;
    let workspace_id = if payload.workspace_id.is_empty() {
        DEFAULT_WORKSPACE_ID.to_string()
    } else {
        payload.workspace_id
    };
    let branch_id = if payload.branch_id.is_empty() {
        DEFAULT_BRANCH_ID.to_string()
    } else {
        payload.branch_id
    };

    let attachment_id = format!("att_{}", uuid::Uuid::new_v4());
    let attachments_dir = app_data_dir.join("attachments").join(&workspace_id);
    std::fs::create_dir_all(&attachments_dir)
        .map_err(|e| format!("Failed to create attachment directory: {}", e))?;

    let full_storage_path = attachments_dir.join(&attachment_id);
    let storage_path_relative = format!("attachments/{}/{}", workspace_id, attachment_id);

    // File first
    std::fs::write(&full_storage_path, &bytes)
        .map_err(|e| format!("Failed to write attachment file: {}", e))?;

    let now = chrono::Utc::now().to_rfc3339();
    let attachment = MessageAttachment {
        id: attachment_id,
        workspace_id,
        branch_id,
        message_id: payload.message_id,
        kind: payload.kind,
        file_name: payload.file_name,
        mime_type: payload.mime_type,
        size_bytes: bytes.len() as i64,
        storage_path: storage_path_relative,
        sha256: sha256_hash,
        duration_ms: None,
        created_at: now.clone(),
        updated_at: now.clone(),
    };

    // Row second. If row insert fails, delete the file.
    if let Err(err) = NotificationRepository::create_attachment(&state.pool, &attachment).await {
        let _ = std::fs::remove_file(&full_storage_path);
        return Err(format!("Database error inserting attachment: {}", err));
    }

    Ok(attachment)
}

#[tauri::command]
pub async fn export_attachment(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    attachment_id: String,
    dest_path: Option<String>,
) -> Result<String, String> {
    let att = NotificationRepository::get_attachment(&state.pool, &attachment_id)
        .await
        .map_err(|e| format!("Database error: {}", e))?
        .ok_or_else(|| "Attachment not found".to_string())?;

    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;
    let source_path = app_data_dir.join(&att.storage_path);

    if !source_path.exists() {
        return Err("Stored attachment file not found on disk".to_string());
    }

    let target_path = if let Some(path) = dest_path {
        std::path::PathBuf::from(path)
    } else {
        return Err("Destination path required".to_string());
    };

    if let Some(parent) = target_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create target directory: {}", e))?;
    }

    std::fs::copy(&source_path, &target_path)
        .map_err(|e| format!("Failed to copy file: {}", e))?;

    Ok(target_path.to_string_lossy().to_string())
}
