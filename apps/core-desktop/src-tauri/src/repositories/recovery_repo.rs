use sqlx::{SqlitePool, SqliteConnection};
use crate::models::auth::RecoveryCode;

pub struct RecoveryRepository;

impl RecoveryRepository {
    pub async fn invalidate_active_batches(conn: &mut SqliteConnection, user_id: &str, invalidated_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE recovery_code
            SET invalidated_at = ?
            WHERE user_id = ? AND used_at IS NULL AND invalidated_at IS NULL
            "#,
        )
        .bind(invalidated_at)
        .bind(user_id)
        .execute(conn)
        .await?;
        Ok(())
    }

    pub async fn create(conn: &mut SqliteConnection, code: &RecoveryCode) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO recovery_code (id, workspace_id, branch_id, user_id, batch_id, code_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&code.id)
        .bind(&code.workspace_id)
        .bind(&code.branch_id)
        .bind(&code.user_id)
        .bind(&code.batch_id)
        .bind(&code.code_hash)
        .bind(&code.created_at)
        .execute(conn)
        .await?;
        Ok(())
    }

    pub async fn get_active_by_user(pool: &SqlitePool, user_id: &str) -> Result<Vec<RecoveryCode>, sqlx::Error> {
        sqlx::query_as::<_, RecoveryCode>(
            r#"
            SELECT * FROM recovery_code
            WHERE user_id = ? AND used_at IS NULL AND invalidated_at IS NULL
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
    }

    pub async fn mark_used(conn: &mut SqliteConnection, id: &str, used_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE recovery_code SET used_at = ? WHERE id = ?")
            .bind(used_at)
            .bind(id)
            .execute(conn)
            .await?;
        Ok(())
    }
}
