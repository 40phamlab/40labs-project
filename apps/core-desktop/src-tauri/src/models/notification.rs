use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct Notification {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub category: String,
    pub source_type: String,
    pub sender_name: String,
    pub sender_business_id: Option<String>,
    pub subject: String,
    pub body: String,
    pub status: String,
    pub channel: String,
    pub content_type: Option<String>,
    pub html_content: Option<String>,
    pub plain_text_content: Option<String>,
    pub related_entity_type: Option<String>,
    pub related_entity_id: Option<String>,
    pub received_at: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct NotificationMessage {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub notification_id: String,
    pub direction: String,
    pub content_type: String,
    pub body: String,
    pub html_content: Option<String>,
    pub status: String,
    pub sent_at: String,
    pub created_at: String,
    pub updated_at: String,
    #[sqlx(skip)]
    pub attachments: Option<Vec<MessageAttachment>>,
}

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
pub struct MessageAttachment {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub message_id: String,
    pub kind: String,
    pub file_name: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub storage_path: String,
    pub sha256: String,
    pub duration_ms: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CreateNotificationPayload {
    pub category: String,
    pub sender_name: String,
    pub sender_address: Option<String>,
    pub body: String,
    pub channel: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SendMessagePayload {
    pub notification_id: String,
    pub body: String,
    pub content_type: Option<String>,
    pub html_content: Option<String>,
    pub attachment_ids: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SaveAttachmentPayload {
    pub workspace_id: String,
    pub branch_id: String,
    pub message_id: String,
    pub kind: String,
    pub file_name: String,
    pub mime_type: String,
    pub bytes: Option<Vec<u8>>,
    pub source_path: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ExportAttachmentPayload {
    pub attachment_id: String,
    pub dest_path: Option<String>,
}
