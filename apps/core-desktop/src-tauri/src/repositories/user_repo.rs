use sqlx::{SqlitePool, SqliteConnection};
use crate::models::auth::{AppUser, Owner, PermissionGrant};

pub struct UserRepository;

impl UserRepository {
    pub async fn get_by_id(pool: &SqlitePool, id: &str) -> Result<Option<AppUser>, sqlx::Error> {
        sqlx::query_as::<_, AppUser>("SELECT * FROM app_user WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn get_by_username(pool: &SqlitePool, username: &str) -> Result<Option<AppUser>, sqlx::Error> {
        sqlx::query_as::<_, AppUser>("SELECT * FROM app_user WHERE username = ?")
            .bind(username.trim().to_lowercase())
            .fetch_optional(pool)
            .await
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<AppUser>, sqlx::Error> {
        sqlx::query_as::<_, AppUser>("SELECT * FROM app_user ORDER BY created_at DESC")
            .fetch_all(pool)
            .await
    }

    pub async fn count_active_sudo(pool: &SqlitePool) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM app_user WHERE role = 'sudo' AND active = 1"
        )
        .fetch_one(pool)
        .await?;
        Ok(row.0)
    }

    pub async fn create(conn: &mut SqliteConnection, user: &AppUser) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO app_user (
                id, workspace_id, branch_id, username, first_name, last_name, full_name,
                phone, role, role_preset, is_superintendent, active, owner_id,
                must_change_credentials, last_login_at, created_by_user_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&user.id)
        .bind(&user.workspace_id)
        .bind(&user.branch_id)
        .bind(&user.username)
        .bind(&user.first_name)
        .bind(&user.last_name)
        .bind(&user.full_name)
        .bind(&user.phone)
        .bind(&user.role)
        .bind(&user.role_preset)
        .bind(user.is_superintendent)
        .bind(user.active)
        .bind(&user.owner_id)
        .bind(user.must_change_credentials)
        .bind(&user.last_login_at)
        .bind(&user.created_by_user_id)
        .bind(&user.created_at)
        .bind(&user.updated_at)
        .execute(conn)
        .await?;
        Ok(())
    }

    pub async fn update_active(conn: &mut SqliteConnection, id: &str, active: i64, updated_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE app_user SET active = ?, updated_at = ? WHERE id = ?")
            .bind(active)
            .bind(updated_at)
            .bind(id)
            .execute(conn)
            .await?;
        Ok(())
    }

    pub async fn update_profile(conn: &mut SqliteConnection, id: &str, first_name: &str, last_name: &str, full_name: &str, phone: Option<&str>, role_preset: &str, updated_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE app_user
            SET first_name = ?, last_name = ?, full_name = ?, phone = ?, role_preset = ?, updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(first_name)
        .bind(last_name)
        .bind(full_name)
        .bind(phone)
        .bind(role_preset)
        .bind(updated_at)
        .bind(id)
        .execute(conn)
        .await?;
        Ok(())
    }

    pub async fn update_last_login(conn: &mut SqliteConnection, id: &str, last_login_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE app_user SET last_login_at = ?, updated_at = ? WHERE id = ?")
            .bind(last_login_at)
            .bind(last_login_at)
            .bind(id)
            .execute(conn)
            .await?;
        Ok(())
    }

    // Owner repo methods
    pub async fn create_owner(conn: &mut SqliteConnection, owner: &Owner) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO owner (id, workspace_id, branch_id, first_name, last_name, phone, email, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&owner.id)
        .bind(&owner.workspace_id)
        .bind(&owner.branch_id)
        .bind(&owner.first_name)
        .bind(&owner.last_name)
        .bind(&owner.phone)
        .bind(&owner.email)
        .bind(&owner.created_at)
        .bind(&owner.updated_at)
        .execute(conn)
        .await?;
        Ok(())
    }

    // Permission grants
    pub async fn get_permissions(pool: &SqlitePool, user_id: &str) -> Result<Vec<PermissionGrant>, sqlx::Error> {
        sqlx::query_as::<_, PermissionGrant>("SELECT * FROM permission_grant WHERE user_id = ?")
            .bind(user_id)
            .fetch_all(pool)
            .await
    }

    pub async fn set_permission_grants(conn: &mut SqliteConnection, user_id: &str, workspace_id: &str, branch_id: &str, permissions: &[String], granted_by: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM permission_grant WHERE user_id = ?")
            .bind(user_id)
            .execute(&mut *conn)
            .await?;

        for p in permissions {
            let id = format!("grant_{}_{}", uuid::Uuid::new_v4().simple(), p);
            sqlx::query(
                r#"
                INSERT INTO permission_grant (id, workspace_id, branch_id, user_id, permission, granted_by_user_id)
                VALUES (?, ?, ?, ?, ?, ?)
                "#,
            )
            .bind(id)
            .bind(workspace_id)
            .bind(branch_id)
            .bind(user_id)
            .bind(p)
            .bind(granted_by)
            .execute(&mut *conn)
            .await?;
        }
        Ok(())
    }
}
