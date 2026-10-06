use sqlx::{SqlitePool, SqliteConnection};
use crate::models::auth::UserCredential;

pub struct CredentialRepository;

impl CredentialRepository {
    pub async fn get_by_user_id(pool: &SqlitePool, user_id: &str) -> Result<Option<UserCredential>, sqlx::Error> {
        sqlx::query_as::<_, UserCredential>("SELECT * FROM user_credential WHERE user_id = ?")
            .bind(user_id)
            .fetch_optional(pool)
            .await
    }

    pub async fn create(conn: &mut SqliteConnection, cred: &UserCredential) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO user_credential (
                user_id, workspace_id, branch_id, password_hash, pin_hash,
                failed_password_attempts, failed_pin_attempts, locked_until,
                password_changed_at, pin_changed_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&cred.user_id)
        .bind(&cred.workspace_id)
        .bind(&cred.branch_id)
        .bind(&cred.password_hash)
        .bind(&cred.pin_hash)
        .bind(cred.failed_password_attempts)
        .bind(cred.failed_pin_attempts)
        .bind(&cred.locked_until)
        .bind(&cred.password_changed_at)
        .bind(&cred.pin_changed_at)
        .bind(&cred.created_at)
        .bind(&cred.updated_at)
        .execute(conn)
        .await?;
        Ok(())
    }

    pub async fn update_password(conn: &mut SqliteConnection, user_id: &str, password_hash: &str, changed_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE user_credential
            SET password_hash = ?, password_changed_at = ?, failed_password_attempts = 0, locked_until = NULL, updated_at = ?
            WHERE user_id = ?
            "#,
        )
        .bind(password_hash)
        .bind(changed_at)
        .bind(changed_at)
        .bind(user_id)
        .execute(conn)
        .await?;
        Ok(())
    }

    pub async fn update_pin(conn: &mut SqliteConnection, user_id: &str, pin_hash: &str, changed_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE user_credential
            SET pin_hash = ?, pin_changed_at = ?, failed_pin_attempts = 0, updated_at = ?
            WHERE user_id = ?
            "#,
        )
        .bind(pin_hash)
        .bind(changed_at)
        .bind(changed_at)
        .bind(user_id)
        .execute(conn)
        .await?;
        Ok(())
    }

    pub async fn increment_password_failures(conn: &mut SqliteConnection, user_id: &str, attempts: i64, locked_until: Option<&str>, updated_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE user_credential
            SET failed_password_attempts = ?, locked_until = ?, updated_at = ?
            WHERE user_id = ?
            "#,
        )
        .bind(attempts)
        .bind(locked_until)
        .bind(updated_at)
        .bind(user_id)
        .execute(conn)
        .await?;
        Ok(())
    }

    pub async fn reset_password_failures(conn: &mut SqliteConnection, user_id: &str, updated_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE user_credential
            SET failed_password_attempts = 0, locked_until = NULL, updated_at = ?
            WHERE user_id = ?
            "#,
        )
        .bind(updated_at)
        .bind(user_id)
        .execute(conn)
        .await?;
        Ok(())
    }

    pub async fn increment_pin_failures(conn: &mut SqliteConnection, user_id: &str, attempts: i64, updated_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE user_credential
            SET failed_pin_attempts = ?, updated_at = ?
            WHERE user_id = ?
            "#,
        )
        .bind(attempts)
        .bind(updated_at)
        .bind(user_id)
        .execute(conn)
        .await?;
        Ok(())
    }

    pub async fn reset_pin_failures(conn: &mut SqliteConnection, user_id: &str, updated_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE user_credential
            SET failed_pin_attempts = 0, updated_at = ?
            WHERE user_id = ?
            "#,
        )
        .bind(updated_at)
        .bind(user_id)
        .execute(conn)
        .await?;
        Ok(())
    }
}
