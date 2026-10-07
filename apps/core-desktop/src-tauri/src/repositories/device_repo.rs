use sqlx::SqlitePool;
use crate::models::device::PairedDevice;
use chrono::Utc;
use uuid::Uuid;

pub async fn get_paired_devices(pool: &SqlitePool, workspace_id: &str) -> Result<Vec<PairedDevice>, sqlx::Error> {
    sqlx::query_as::<_, PairedDevice>(
        r#"
        SELECT id, workspace_id, branch_id, user_id, device_label, device_type, status, permissions_json, credential_hash, last_connected_at, paired_at, updated_at
        FROM paired_device
        WHERE workspace_id = ? AND status != 'removed'
        ORDER BY paired_at DESC
        "#,
    )
    .bind(workspace_id)
    .fetch_all(pool)
    .await
}

pub async fn get_device_by_id(pool: &SqlitePool, workspace_id: &str, id: &str) -> Result<Option<PairedDevice>, sqlx::Error> {
    sqlx::query_as::<_, PairedDevice>(
        r#"
        SELECT id, workspace_id, branch_id, user_id, device_label, device_type, status, permissions_json, credential_hash, last_connected_at, paired_at, updated_at
        FROM paired_device
        WHERE workspace_id = ? AND id = ?
        "#,
    )
    .bind(workspace_id)
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn get_device_by_credential_hash(pool: &SqlitePool, credential_hash: &str) -> Result<Option<PairedDevice>, sqlx::Error> {
    sqlx::query_as::<_, PairedDevice>(
        r#"
        SELECT id, workspace_id, branch_id, user_id, device_label, device_type, status, permissions_json, credential_hash, last_connected_at, paired_at, updated_at
        FROM paired_device
        WHERE credential_hash = ?
        "#,
    )
    .bind(credential_hash)
    .fetch_optional(pool)
    .await
}

pub async fn create_paired_device(
    pool: &SqlitePool,
    workspace_id: &str,
    branch_id: &str,
    user_id: &str,
    device_label: &str,
    device_type: &str,
    permissions_json: &str,
    credential_hash: &str,
) -> Result<PairedDevice, sqlx::Error> {
    let id = format!("dev_{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO paired_device (id, workspace_id, branch_id, user_id, device_label, device_type, status, permissions_json, credential_hash, last_connected_at, paired_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(workspace_id)
    .bind(branch_id)
    .bind(user_id)
    .bind(device_label)
    .bind(device_type)
    .bind(permissions_json)
    .bind(credential_hash)
    .bind(&now)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;

    get_device_by_id(pool, workspace_id, &id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn update_device_status(pool: &SqlitePool, workspace_id: &str, id: &str, status: &str) -> Result<(), sqlx::Error> {
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        UPDATE paired_device
        SET status = ?, updated_at = ?
        WHERE workspace_id = ? AND id = ?
        "#,
    )
    .bind(status)
    .bind(&now)
    .bind(workspace_id)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_device_permissions(pool: &SqlitePool, workspace_id: &str, id: &str, permissions_json: &str) -> Result<(), sqlx::Error> {
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        UPDATE paired_device
        SET permissions_json = ?, updated_at = ?
        WHERE workspace_id = ? AND id = ?
        "#,
    )
    .bind(permissions_json)
    .bind(&now)
    .bind(workspace_id)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_last_connected(pool: &SqlitePool, workspace_id: &str, id: &str) -> Result<(), sqlx::Error> {
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        UPDATE paired_device
        SET last_connected_at = ?, updated_at = ?
        WHERE workspace_id = ? AND id = ?
        "#,
    )
    .bind(&now)
    .bind(&now)
    .bind(workspace_id)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}
