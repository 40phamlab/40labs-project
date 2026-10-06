use sqlx::{SqlitePool, SqliteConnection};
use crate::models::auth::BoundDevice;

pub struct DeviceBindingRepository;

impl DeviceBindingRepository {
    pub async fn get_by_id(pool: &SqlitePool, id: &str) -> Result<Option<BoundDevice>, sqlx::Error> {
        sqlx::query_as::<_, BoundDevice>("SELECT * FROM bound_device WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn get_active_device(pool: &SqlitePool) -> Result<Option<BoundDevice>, sqlx::Error> {
        sqlx::query_as::<_, BoundDevice>("SELECT * FROM bound_device WHERE status = 'active' LIMIT 1")
            .fetch_optional(pool)
            .await
    }

    pub async fn create(conn: &mut SqliteConnection, device: &BoundDevice) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO bound_device (
                id, workspace_id, branch_id, device_label, public_key,
                bound_by_user_id, bound_at, last_sync_at, status, revoked_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&device.id)
        .bind(&device.workspace_id)
        .bind(&device.branch_id)
        .bind(&device.device_label)
        .bind(&device.public_key)
        .bind(&device.bound_by_user_id)
        .bind(&device.bound_at)
        .bind(&device.last_sync_at)
        .bind(&device.status)
        .bind(&device.revoked_at)
        .bind(&device.created_at)
        .bind(&device.updated_at)
        .execute(conn)
        .await?;
        Ok(())
    }
}
