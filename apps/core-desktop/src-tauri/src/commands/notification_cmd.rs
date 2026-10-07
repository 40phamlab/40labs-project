use tauri::{State, Manager};
use sha2::{Sha256, Digest};
use crate::db::AppState;
use crate::models::notification::{
    Notification, NotificationMessage, MessageAttachment,
    SendMessagePayload, SaveAttachmentPayload
};
use crate::repositories::notification_repo::NotificationRepository;
use crate::auth::{AuthEngine, AuthErrorResponse};

const MAX_IMAGE_SIZE: i64 = 16 * 1024 * 1024; // 16 MB
const MAX_AUDIO_SIZE: i64 = 16 * 1024 * 1024; // 16 MB
const MAX_FILE_SIZE: i64 = 100 * 1024 * 1024; // 100 MB

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

    let bytes = match payload.bytes {
        Some(b) => b,
        None => return Err(crate::auth::AuthError::PolicyViolation("Attachment bytes are required".to_string()).to_response()),
    };

    match payload.kind.as_str() {
        "image" => {
            if bytes.len() as i64 > MAX_IMAGE_SIZE {
                return Err(crate::auth::AuthError::PolicyViolation("Image exceeds 16MB".to_string()).to_response());
            }
        }
        "audio" => {
            if bytes.len() as i64 > MAX_AUDIO_SIZE {
                return Err(crate::auth::AuthError::PolicyViolation("Audio exceeds 16MB".to_string()).to_response());
            }
        }
        "file" => {
            if bytes.len() as i64 > MAX_FILE_SIZE {
                return Err(crate::auth::AuthError::PolicyViolation("File exceeds 100MB".to_string()).to_response());
            }
        }
        _ => return Err(crate::auth::AuthError::PolicyViolation("Invalid attachment kind".to_string()).to_response()),
    }

    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let sha256_hash = format!("{:x}", hasher.finalize());

    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;

    let attachment_id = format!("att_{}", uuid::Uuid::new_v4());
    let attachments_dir = app_data_dir.join("attachments").join(&ctx.workspace_id);
    std::fs::create_dir_all(&attachments_dir)
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;

    let full_storage_path = attachments_dir.join(&attachment_id);
    let storage_path_relative = format!("attachments/{}/{}", ctx.workspace_id, attachment_id);

    std::fs::write(&full_storage_path, &bytes)
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;

    let now = chrono::Utc::now().to_rfc3339();
    let attachment = MessageAttachment {
        id: attachment_id,
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
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

    if let Err(err) = NotificationRepository::create_attachment(&state.pool, &attachment).await {
        let _ = std::fs::remove_file(&full_storage_path);
        return Err(crate::auth::AuthError::DatabaseError(err.to_string()).to_response());
    }

    Ok(attachment)
}

#[tauri::command]
pub async fn export_attachment(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    attachment_id: String,
    dest_path: Option<String>,
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

    if !source_path.exists() {
        return Err(crate::auth::AuthError::NotFound("Stored file not found".to_string()).to_response());
    }

    let target_path = if let Some(path) = dest_path {
        std::path::PathBuf::from(path)
    } else {
        return Err(crate::auth::AuthError::PolicyViolation("Destination path required".to_string()).to_response());
    };

    if let Some(parent) = target_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;
    }

    std::fs::copy(&source_path, &target_path)
        .map_err(|e| crate::auth::AuthError::InternalError(e.to_string()).to_response())?;

    Ok(target_path.to_string_lossy().to_string())
}
