use sqlx::SqlitePool;
use crate::models::notification::{Notification, NotificationMessage, MessageAttachment};

pub struct NotificationRepository;

impl NotificationRepository {
    pub async fn list(pool: &SqlitePool, workspace_id: &str) -> Result<Vec<Notification>, sqlx::Error> {
        sqlx::query_as::<_, Notification>(
            "SELECT * FROM notifications WHERE workspace_id = ? ORDER BY received_at DESC"
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn get_by_id(pool: &SqlitePool, workspace_id: &str, id: &str) -> Result<Option<Notification>, sqlx::Error> {
        sqlx::query_as::<_, Notification>(
            "SELECT * FROM notifications WHERE workspace_id = ? AND id = ?"
        )
        .bind(workspace_id)
        .bind(id)
        .fetch_optional(pool)
        .await
    }

    pub async fn create(pool: &SqlitePool, n: &Notification) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO notifications (
                id, workspace_id, branch_id, category, source_type, sender_name,
                sender_business_id, subject, body, status, channel, content_type,
                html_content, plain_text_content, related_entity_type, related_entity_id,
                received_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&n.id)
        .bind(&n.workspace_id)
        .bind(&n.branch_id)
        .bind(&n.category)
        .bind(&n.source_type)
        .bind(&n.sender_name)
        .bind(&n.sender_business_id)
        .bind(&n.subject)
        .bind(&n.body)
        .bind(&n.status)
        .bind(&n.channel)
        .bind(&n.content_type)
        .bind(&n.html_content)
        .bind(&n.plain_text_content)
        .bind(&n.related_entity_type)
        .bind(&n.related_entity_id)
        .bind(&n.received_at)
        .bind(&n.created_at)
        .bind(&n.updated_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn update_status(pool: &SqlitePool, workspace_id: &str, id: &str, status: &str) -> Result<(), sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query(
            "UPDATE notifications SET status = ?, updated_at = ? WHERE workspace_id = ? AND id = ?"
        )
        .bind(status)
        .bind(now)
        .bind(workspace_id)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn soft_delete(pool: &SqlitePool, workspace_id: &str, id: &str) -> Result<(), sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query(
            "UPDATE notifications SET status = 'archived', updated_at = ? WHERE workspace_id = ? AND id = ?"
        )
        .bind(now)
        .bind(workspace_id)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn list_messages(pool: &SqlitePool, workspace_id: &str, notification_id: &str) -> Result<Vec<NotificationMessage>, sqlx::Error> {
        let mut messages = sqlx::query_as::<_, NotificationMessage>(
            "SELECT * FROM notification_messages WHERE workspace_id = ? AND notification_id = ? ORDER BY sent_at ASC"
        )
        .bind(workspace_id)
        .bind(notification_id)
        .fetch_all(pool)
        .await?;

        for msg in &mut messages {
            let attachments = sqlx::query_as::<_, MessageAttachment>(
                "SELECT * FROM message_attachments WHERE workspace_id = ? AND message_id = ?"
            )
            .bind(workspace_id)
            .bind(&msg.id)
            .fetch_all(pool)
            .await?;
            msg.attachments = Some(attachments);
        }

        Ok(messages)
    }

    pub async fn create_message(pool: &SqlitePool, msg: &NotificationMessage) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO notification_messages (
                id, workspace_id, branch_id, notification_id, direction,
                content_type, body, html_content, status, sent_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&msg.id)
        .bind(&msg.workspace_id)
        .bind(&msg.branch_id)
        .bind(&msg.notification_id)
        .bind(&msg.direction)
        .bind(&msg.content_type)
        .bind(&msg.body)
        .bind(&msg.html_content)
        .bind(&msg.status)
        .bind(&msg.sent_at)
        .bind(&msg.created_at)
        .bind(&msg.updated_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn get_attachment(pool: &SqlitePool, workspace_id: &str, attachment_id: &str) -> Result<Option<MessageAttachment>, sqlx::Error> {
        sqlx::query_as::<_, MessageAttachment>(
            "SELECT * FROM message_attachments WHERE workspace_id = ? AND id = ?"
        )
        .bind(workspace_id)
        .bind(attachment_id)
        .fetch_optional(pool)
        .await
    }

    pub async fn create_attachment(pool: &SqlitePool, att: &MessageAttachment) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO message_attachments (
                id, workspace_id, branch_id, message_id, kind,
                file_name, mime_type, size_bytes, storage_path, sha256,
                duration_ms, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&att.id)
        .bind(&att.workspace_id)
        .bind(&att.branch_id)
        .bind(&att.message_id)
        .bind(&att.kind)
        .bind(&att.file_name)
        .bind(&att.mime_type)
        .bind(att.size_bytes)
        .bind(&att.storage_path)
        .bind(&att.sha256)
        .bind(att.duration_ms)
        .bind(&att.created_at)
        .bind(&att.updated_at)
        .execute(pool)
        .await?;

        Ok(())
    }
}
