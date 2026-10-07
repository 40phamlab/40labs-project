use sqlx::{SqlitePool, SqliteConnection};
use crate::models::audit::AuditLogEntry;

pub struct AuditRepository;

pub mod audit {
    use super::*;

    /// Internal transactional append helper (no pool-level public write).
    /// Ensures audit-first logging inside the same transaction (GOTCHAS #9).
    pub async fn append(conn: &mut SqliteConnection, entry: &AuditLogEntry) -> Result<(), sqlx::Error> {
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
        .execute(conn)
        .await?;
        Ok(())
    }
}

impl AuditRepository {
    pub async fn list(pool: &SqlitePool, workspace_id: &str) -> Result<Vec<AuditLogEntry>, sqlx::Error> {
        sqlx::query_as::<_, AuditLogEntry>(
            "SELECT * FROM audit_log WHERE workspace_id = ? ORDER BY created_at DESC"
        )
        .bind(workspace_id)
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
