use sqlx::SqlitePool;
use crate::models::staff_notification::StaffNotification;

pub struct StaffNotificationRepository;

impl StaffNotificationRepository {
    pub async fn create(pool: &SqlitePool, n: &StaffNotification) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO staff_notifications (
                id, workspace_id, branch_id, sender_user_id, sender_name,
                audience, target_role, target_user_id, severity, subject, body, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&n.id)
        .bind(&n.workspace_id)
        .bind(&n.branch_id)
        .bind(&n.sender_user_id)
        .bind(&n.sender_name)
        .bind(&n.audience)
        .bind(&n.target_role)
        .bind(&n.target_user_id)
        .bind(&n.severity)
        .bind(&n.subject)
        .bind(&n.body)
        .bind(&n.created_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn get_by_id(
        pool: &SqlitePool,
        id: &str,
        user_id: &str,
    ) -> Result<Option<StaffNotification>, sqlx::Error> {
        let row = sqlx::query(
            r#"
            SELECT n.*,
                   EXISTS(SELECT 1 FROM staff_notification_reads r WHERE r.notification_id = n.id AND r.user_id = ?) as is_read
            FROM staff_notifications n
            WHERE n.id = ?
            "#
        )
        .bind(user_id)
        .bind(id)
        .fetch_optional(pool)
        .await?;

        if let Some(r) = row {
            use sqlx::Row;
            let is_read_int: i32 = r.get("is_read");
            let notification = StaffNotification {
                id: r.get("id"),
                workspace_id: r.get("workspace_id"),
                branch_id: r.get("branch_id"),
                sender_user_id: r.get("sender_user_id"),
                sender_name: r.get("sender_name"),
                audience: r.get("audience"),
                target_role: r.get("target_role"),
                target_user_id: r.get("target_user_id"),
                severity: r.get("severity"),
                subject: r.get("subject"),
                body: r.get("body"),
                created_at: r.get("created_at"),
                is_read: is_read_int == 1,
            };
            Ok(Some(notification))
        } else {
            Ok(None)
        }
    }

    pub async fn list_for_user(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
        user_id: &str,
        user_role: &str,
        cursor: Option<&str>,
        limit: i64,
    ) -> Result<Vec<StaffNotification>, sqlx::Error> {
        let cursor_val = cursor.unwrap_or("9999-12-31T23:59:59Z");

        let rows = sqlx::query(
            r#"
            SELECT n.*,
                   EXISTS(SELECT 1 FROM staff_notification_reads r WHERE r.notification_id = n.id AND r.user_id = ?) as is_read
            FROM staff_notifications n
            WHERE n.workspace_id = ? AND n.branch_id = ?
              AND n.created_at < ?
              AND (
                  n.audience = 'broadcast'
                  OR n.audience = 'alert'
                  OR n.severity = 'alert'
                  OR (n.audience = 'role' AND n.target_role = ?)
                  OR (n.audience = 'direct' AND (n.target_user_id = ? OR n.sender_user_id = ?))
              )
            ORDER BY n.created_at DESC
            LIMIT ?
            "#
        )
        .bind(user_id)
        .bind(workspace_id)
        .bind(branch_id)
        .bind(cursor_val)
        .bind(user_role)
        .bind(user_id)
        .bind(user_id)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        let mut items = Vec::new();
        for r in rows {
            use sqlx::Row;
            let is_read_int: i32 = r.get("is_read");
            items.push(StaffNotification {
                id: r.get("id"),
                workspace_id: r.get("workspace_id"),
                branch_id: r.get("branch_id"),
                sender_user_id: r.get("sender_user_id"),
                sender_name: r.get("sender_name"),
                audience: r.get("audience"),
                target_role: r.get("target_role"),
                target_user_id: r.get("target_user_id"),
                severity: r.get("severity"),
                subject: r.get("subject"),
                body: r.get("body"),
                created_at: r.get("created_at"),
                is_read: is_read_int == 1,
            });
        }

        Ok(items)
    }

    pub async fn mark_as_read(
        pool: &SqlitePool,
        notification_id: &str,
        user_id: &str,
    ) -> Result<String, sqlx::Error> {
        let read_id = format!("read_{}", uuid::Uuid::new_v4().simple());
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            INSERT OR IGNORE INTO staff_notification_reads (id, notification_id, user_id, read_at)
            VALUES (?, ?, ?, ?)
            "#
        )
        .bind(read_id)
        .bind(notification_id)
        .bind(user_id)
        .bind(&now)
        .execute(pool)
        .await?;

        // Return actual read_at (if already read, fetch from DB)
        let row = sqlx::query(
            "SELECT read_at FROM staff_notification_reads WHERE notification_id = ? AND user_id = ?"
        )
        .bind(notification_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        if let Some(r) = row {
            use sqlx::Row;
            Ok(r.get("read_at"))
        } else {
            Ok(now)
        }
    }
}
