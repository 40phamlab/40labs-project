use sqlx::SqlitePool;
use crate::models::audit::AuditLogEntry;

pub struct AuditRepository;

impl AuditRepository {
    pub async fn list(pool: &SqlitePool) -> Result<Vec<AuditLogEntry>, sqlx::Error> {
        sqlx::query_as::<_, AuditLogEntry>(
            "SELECT * FROM audit_log ORDER BY created_at DESC"
        )
        .fetch_all(pool)
        .await
    }

    pub async fn create(pool: &SqlitePool, entry: &AuditLogEntry) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO audit_log (
                id, workspace_id, branch_id, action, performed_by_user_id,
                target_entity_type, target_entity_id, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&entry.id)
        .bind(&entry.workspace_id)
        .bind(&entry.branch_id)
        .bind(&entry.action)
        .bind(&entry.performed_by_user_id)
        .bind(&entry.target_entity_type)
        .bind(&entry.target_entity_id)
        .bind(&entry.metadata)
        .bind(&entry.created_at)
        .execute(pool)
        .await?;

        Ok(())
    }
}
