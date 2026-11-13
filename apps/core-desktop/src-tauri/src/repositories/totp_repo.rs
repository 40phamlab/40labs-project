use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqlitePool;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct UserTotp {
    pub user_id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub secret_enc: Vec<u8>,
    pub enabled_at: Option<String>,
    pub last_used_step: i64,
    pub created_at: String,
    pub updated_at: String,
}

pub struct TotpRepository;

impl TotpRepository {
    pub async fn upsert_pending(
        pool: &SqlitePool,
        user_id: &str,
        workspace_id: &str,
        branch_id: &str,
        secret_enc: &[u8],
        now: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO user_totp (user_id, workspace_id, branch_id, secret_enc, enabled_at, last_used_step, created_at, updated_at)
            VALUES (?, ?, ?, ?, NULL, 0, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                secret_enc = excluded.secret_enc,
                enabled_at = NULL,
                last_used_step = 0,
                updated_at = excluded.updated_at
            "#,
        )
        .bind(user_id)
        .bind(workspace_id)
        .bind(branch_id)
        .bind(secret_enc)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn get_by_user_id(
        pool: &SqlitePool,
        user_id: &str,
    ) -> Result<Option<UserTotp>, sqlx::Error> {
        sqlx::query_as::<_, UserTotp>("SELECT * FROM user_totp WHERE user_id = ?")
            .bind(user_id)
            .fetch_optional(pool)
            .await
    }

    pub async fn confirm(pool: &SqlitePool, user_id: &str, now: &str) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE user_totp SET enabled_at = ?, updated_at = ? WHERE user_id = ?")
            .bind(now)
            .bind(now)
            .bind(user_id)
            .execute(pool)
            .await?;
        Ok(())
    }

    pub async fn update_last_used_step(
        pool: &SqlitePool,
        user_id: &str,
        step: u64,
        now: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE user_totp SET last_used_step = ?, updated_at = ? WHERE user_id = ?")
            .bind(step as i64)
            .bind(now)
            .bind(user_id)
            .execute(pool)
            .await?;
        Ok(())
    }

    pub async fn delete(pool: &SqlitePool, user_id: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM user_totp WHERE user_id = ?")
            .bind(user_id)
            .execute(pool)
            .await?;
        Ok(())
    }
}
