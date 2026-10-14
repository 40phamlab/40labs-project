use crate::models::notification::{MessageAttachment, Notification, NotificationMessage, Thread};
use sqlx::SqlitePool;

pub struct NotificationRepository;

impl NotificationRepository {
    pub async fn list(
        pool: &SqlitePool,
        workspace_id: &str,
    ) -> Result<Vec<Notification>, sqlx::Error> {
        sqlx::query_as::<_, Notification>(
            "SELECT * FROM notifications WHERE workspace_id = ? ORDER BY received_at DESC",
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn get_by_id(
        pool: &SqlitePool,
        workspace_id: &str,
        id: &str,
    ) -> Result<Option<Notification>, sqlx::Error> {
        sqlx::query_as::<_, Notification>(
            "SELECT * FROM notifications WHERE workspace_id = ? AND id = ?",
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
            "#,
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

    pub async fn update_status(
        pool: &SqlitePool,
        workspace_id: &str,
        id: &str,
        status: &str,
    ) -> Result<(), sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query(
            "UPDATE notifications SET status = ?, updated_at = ? WHERE workspace_id = ? AND id = ?",
        )
        .bind(status)
        .bind(now)
        .bind(workspace_id)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn soft_delete(
        pool: &SqlitePool,
        workspace_id: &str,
        id: &str,
    ) -> Result<(), sqlx::Error> {
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

    pub async fn list_messages(
        pool: &SqlitePool,
        workspace_id: &str,
        notification_id: &str,
    ) -> Result<Vec<NotificationMessage>, sqlx::Error> {
        let mut messages = sqlx::query_as::<_, NotificationMessage>(
            "SELECT * FROM notification_messages WHERE workspace_id = ? AND notification_id = ? ORDER BY sent_at ASC"
        )
        .bind(workspace_id)
        .bind(notification_id)
        .fetch_all(pool)
        .await?;

        for msg in &mut messages {
            let attachments = sqlx::query_as::<_, MessageAttachment>(
                "SELECT * FROM message_attachments WHERE workspace_id = ? AND message_id = ?",
            )
            .bind(workspace_id)
            .bind(&msg.id)
            .fetch_all(pool)
            .await?;
            msg.attachments = Some(attachments);
        }

        Ok(messages)
    }

    pub async fn create_message(
        pool: &SqlitePool,
        msg: &NotificationMessage,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO notification_messages (
                id, workspace_id, branch_id, notification_id, direction,
                content_type, body, html_content, status, sent_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
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

    pub async fn create_message_with_attachments(
        pool: &SqlitePool,
        msg: &NotificationMessage,
        attachment_ids: &[String],
        notification_body: &str,
    ) -> Result<(), sqlx::Error> {
        let mut tx = pool.begin().await?;
        sqlx::query(
            r#"INSERT INTO notification_messages (
                id, workspace_id, branch_id, notification_id, direction,
                content_type, body, html_content, status, sent_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        )
        .bind(&msg.id).bind(&msg.workspace_id).bind(&msg.branch_id)
        .bind(&msg.notification_id).bind(&msg.direction).bind(&msg.content_type)
        .bind(&msg.body).bind(&msg.html_content).bind(&msg.status)
        .bind(&msg.sent_at).bind(&msg.created_at).bind(&msg.updated_at)
        .execute(&mut *tx).await?;

        for attachment_id in attachment_ids {
            let result = sqlx::query(
                "UPDATE message_attachments SET message_id = ?, updated_at = ? WHERE id = ? AND workspace_id = ? AND message_id IS NULL",
            )
            .bind(&msg.id).bind(&msg.updated_at).bind(attachment_id).bind(&msg.workspace_id)
            .execute(&mut *tx).await?;
            if result.rows_affected() != 1 {
                return Err(sqlx::Error::RowNotFound);
            }
        }
        sqlx::query("UPDATE notifications SET body = ?, status = 'read', updated_at = ? WHERE workspace_id = ? AND id = ?")
            .bind(notification_body).bind(&msg.updated_at).bind(&msg.workspace_id).bind(&msg.notification_id)
            .execute(&mut *tx).await?;
        tx.commit().await
    }

    pub async fn get_attachment(
        pool: &SqlitePool,
        workspace_id: &str,
        attachment_id: &str,
    ) -> Result<Option<MessageAttachment>, sqlx::Error> {
        sqlx::query_as::<_, MessageAttachment>(
            "SELECT * FROM message_attachments WHERE workspace_id = ? AND id = ?",
        )
        .bind(workspace_id)
        .bind(attachment_id)
        .fetch_optional(pool)
        .await
    }

    pub async fn create_attachment(
        pool: &SqlitePool,
        att: &MessageAttachment,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO message_attachments (
                id, workspace_id, branch_id, message_id, kind,
                file_name, mime_type, size_bytes, storage_path, sha256,
                duration_ms, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
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

    pub async fn list_threads(
        pool: &SqlitePool,
        workspace_id: &str,
        include_archived: bool,
    ) -> Result<Vec<Thread>, sqlx::Error> {
        let archived_filter = if include_archived { 1 } else { 0 };
        sqlx::query_as::<_, Thread>(
            r#"
            SELECT
              t.*,
              (SELECT COUNT(*) FROM notification_messages m WHERE m.thread_id = t.id AND m.direction = 'incoming' AND m.status != 'read') AS unread_count
            FROM threads t
            WHERE t.workspace_id = ?
            AND (? = 1 OR t.archived = 0)
            ORDER BY t.last_message_at DESC
            "#,
        )
        .bind(workspace_id)
        .bind(archived_filter)
        .fetch_all(pool)
        .await
    }

    pub async fn get_thread_by_id(
        pool: &SqlitePool,
        workspace_id: &str,
        thread_id: &str,
    ) -> Result<Option<Thread>, sqlx::Error> {
        sqlx::query_as::<_, Thread>(
            r#"
            SELECT
              t.*,
              (SELECT COUNT(*) FROM notification_messages m WHERE m.thread_id = t.id AND m.direction = 'incoming' AND m.status != 'read') AS unread_count
            FROM threads t
            WHERE t.workspace_id = ? AND t.id = ?
            "#,
        )
        .bind(workspace_id)
        .bind(thread_id)
        .fetch_optional(pool)
        .await
    }

    pub async fn find_or_create_thread(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
        counterparty_type: &str,
        counterparty_key: &str,
        counterparty_id: Option<&str>,
        display_name: &str,
    ) -> Result<Thread, sqlx::Error> {
        if let Some(existing) = sqlx::query_as::<_, Thread>(
            r#"
            SELECT
              t.*,
              (SELECT COUNT(*) FROM notification_messages m WHERE m.thread_id = t.id AND m.direction = 'incoming' AND m.status != 'read') AS unread_count
            FROM threads t
            WHERE t.workspace_id = ? AND t.counterparty_key = ?
            "#,
        )
        .bind(workspace_id)
        .bind(counterparty_key)
        .fetch_optional(pool)
        .await? {
            return Ok(existing);
        }

        let now = chrono::Utc::now().to_rfc3339();
        let thread_id = format!("thread_{}", uuid::Uuid::new_v4());
        sqlx::query(
            r#"
            INSERT INTO threads (
                id, workspace_id, branch_id, counterparty_type, counterparty_key,
                counterparty_id, display_name, last_message_at, last_message_preview,
                archived, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, ?)
            "#,
        )
        .bind(&thread_id)
        .bind(workspace_id)
        .bind(branch_id)
        .bind(counterparty_type)
        .bind(counterparty_key)
        .bind(counterparty_id)
        .bind(display_name)
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await?;

        Self::get_thread_by_id(pool, workspace_id, &thread_id)
            .await?
            .ok_or_else(|| sqlx::Error::RowNotFound)
    }

    pub async fn append_thread_message(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
        thread_id: &str,
        msg: &NotificationMessage,
        attachment_ids: &[String],
    ) -> Result<(), sqlx::Error> {
        let mut tx = pool.begin().await?;

        sqlx::query(
            r#"
            INSERT INTO notification_messages (
                id, workspace_id, branch_id, notification_id, thread_id, direction,
                content_type, body, html_content, status, sent_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&msg.id)
        .bind(workspace_id)
        .bind(branch_id)
        .bind(&msg.notification_id)
        .bind(thread_id)
        .bind(&msg.direction)
        .bind(&msg.content_type)
        .bind(&msg.body)
        .bind(&msg.html_content)
        .bind(&msg.status)
        .bind(&msg.sent_at)
        .bind(&msg.created_at)
        .bind(&msg.updated_at)
        .execute(&mut *tx)
        .await?;

        for att_id in attachment_ids {
            sqlx::query(
                "UPDATE message_attachments SET message_id = ?, updated_at = ? WHERE id = ? AND workspace_id = ? AND message_id IS NULL",
            )
            .bind(&msg.id)
            .bind(&msg.updated_at)
            .bind(att_id)
            .bind(workspace_id)
            .execute(&mut *tx)
            .await?;
        }

        sqlx::query(
            r#"
            UPDATE threads
            SET last_message_at = ?, last_message_preview = ?, archived = 0, updated_at = ?
            WHERE workspace_id = ? AND id = ?
            "#,
        )
        .bind(&msg.sent_at)
        .bind(&msg.body)
        .bind(&msg.updated_at)
        .bind(workspace_id)
        .bind(thread_id)
        .execute(&mut *tx)
        .await?;

        tx.commit().await
    }

    pub async fn list_messages_by_thread(
        pool: &SqlitePool,
        workspace_id: &str,
        thread_id: &str,
    ) -> Result<Vec<NotificationMessage>, sqlx::Error> {
        let mut messages = sqlx::query_as::<_, NotificationMessage>(
            "SELECT * FROM notification_messages WHERE workspace_id = ? AND thread_id = ? ORDER BY sent_at ASC",
        )
        .bind(workspace_id)
        .bind(thread_id)
        .fetch_all(pool)
        .await?;

        for msg in &mut messages {
            let attachments = sqlx::query_as::<_, MessageAttachment>(
                "SELECT * FROM message_attachments WHERE workspace_id = ? AND message_id = ?",
            )
            .bind(workspace_id)
            .bind(&msg.id)
            .fetch_all(pool)
            .await?;
            msg.attachments = Some(attachments);
        }

        Ok(messages)
    }

    pub async fn mark_thread_read(
        pool: &SqlitePool,
        workspace_id: &str,
        thread_id: &str,
    ) -> Result<(), sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query(
            r#"
            UPDATE notification_messages
            SET status = 'read', updated_at = ?
            WHERE workspace_id = ? AND thread_id = ? AND direction = 'incoming' AND status != 'read'
            "#,
        )
        .bind(now)
        .bind(workspace_id)
        .bind(thread_id)
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn archive_thread(
        pool: &SqlitePool,
        workspace_id: &str,
        thread_id: &str,
    ) -> Result<(), sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query(
            "UPDATE threads SET archived = 1, updated_at = ? WHERE workspace_id = ? AND id = ?",
        )
        .bind(now)
        .bind(workspace_id)
        .bind(thread_id)
        .execute(pool)
        .await?;
        Ok(())
    }
}

#[cfg(test)]
mod attachment_tests {
    use super::NotificationRepository;
    use crate::models::notification::NotificationMessage;
    use sqlx::sqlite::SqlitePoolOptions;

    #[tokio::test]
    async fn linking_is_atomic_and_workspace_scoped() {
        let pool = SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
        sqlx::query("CREATE TABLE notifications (id TEXT PRIMARY KEY, workspace_id TEXT, body TEXT, status TEXT, updated_at TEXT)").execute(&pool).await.unwrap();
        sqlx::query("CREATE TABLE notification_messages (id TEXT PRIMARY KEY, workspace_id TEXT, branch_id TEXT, notification_id TEXT, direction TEXT, content_type TEXT, body TEXT, html_content TEXT, status TEXT, sent_at TEXT, created_at TEXT, updated_at TEXT)").execute(&pool).await.unwrap();
        sqlx::query("CREATE TABLE message_attachments (id TEXT PRIMARY KEY, workspace_id TEXT, branch_id TEXT, message_id TEXT, kind TEXT, file_name TEXT, mime_type TEXT, size_bytes INTEGER, storage_path TEXT, sha256 TEXT, duration_ms INTEGER, created_at TEXT, updated_at TEXT)").execute(&pool).await.unwrap();
        sqlx::query("INSERT INTO notifications VALUES ('n1', 'ws1', 'old', 'unread', 't')").execute(&pool).await.unwrap();
        for (id, workspace) in [("a1", "ws1"), ("a2", "ws2")] {
            sqlx::query("INSERT INTO message_attachments (id, workspace_id, branch_id, message_id, kind, file_name, mime_type, size_bytes, storage_path, sha256, created_at, updated_at) VALUES (?, ?, 'b', NULL, 'file', 'x.txt', 'text/plain', 1, 'p', 'h', 't', 't')")
                .bind(id).bind(workspace).execute(&pool).await.unwrap();
        }
        let message = |id: &str| NotificationMessage {
            id: id.into(), workspace_id: "ws1".into(), branch_id: "b".into(), notification_id: "n1".into(),
            thread_id: None,
            direction: "outgoing".into(), content_type: "text".into(), body: "reply".into(), html_content: None,
            status: "queued".into(), sent_at: "t".into(), created_at: "t".into(), updated_at: "t".into(), attachments: None,
        };
        NotificationRepository::create_message_with_attachments(&pool, &message("m1"), &["a1".into()], "updated")
            .await.unwrap();
        let linked: (String,) = sqlx::query_as("SELECT message_id FROM message_attachments WHERE id = 'a1'").fetch_one(&pool).await.unwrap();
        assert_eq!(linked.0, "m1");

        let result = NotificationRepository::create_message_with_attachments(&pool, &message("m2"), &["a2".into()], "bad")
            .await;
        assert!(result.is_err());
        let messages: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM notification_messages WHERE id = 'm2'").fetch_one(&pool).await.unwrap();
        assert_eq!(messages.0, 0, "failed association must roll back message insertion");
        assert!(NotificationRepository::get_attachment(&pool, "ws1", "a2").await.unwrap().is_none());
        let staged: (Option<String>,) = sqlx::query_as("SELECT message_id FROM message_attachments WHERE id = 'a2'").fetch_one(&pool).await.unwrap();
        assert!(staged.0.is_none());
    }
}
