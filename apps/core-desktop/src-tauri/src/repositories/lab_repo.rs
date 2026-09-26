use sqlx::SqlitePool;
use crate::models::lab::{LabOrder, LabSample};

pub struct LabRepository;

impl LabRepository {
    pub async fn list_orders(pool: &SqlitePool) -> Result<Vec<LabOrder>, sqlx::Error> {
        sqlx::query_as::<_, LabOrder>(
            "SELECT * FROM lab_order ORDER BY created_at DESC"
        )
        .fetch_all(pool)
        .await
    }

    pub async fn create_order(pool: &SqlitePool, order: &LabOrder) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO lab_order (
                id, workspace_id, branch_id, customer_id, sale_id, ordered_by_user_id,
                status, test_catalog_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&order.id)
        .bind(&order.workspace_id)
        .bind(&order.branch_id)
        .bind(&order.customer_id)
        .bind(&order.sale_id)
        .bind(&order.ordered_by_user_id)
        .bind(&order.status)
        .bind(&order.test_catalog_id)
        .bind(&order.created_at)
        .bind(&order.updated_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn update_order_status(
        pool: &SqlitePool,
        id: &str,
        status: &str,
        updated_at: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "UPDATE lab_order SET status = ?, updated_at = ? WHERE id = ?"
        )
        .bind(status)
        .bind(updated_at)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn list_samples(pool: &SqlitePool) -> Result<Vec<LabSample>, sqlx::Error> {
        sqlx::query_as::<_, LabSample>(
            "SELECT * FROM lab_sample ORDER BY created_at DESC"
        )
        .fetch_all(pool)
        .await
    }

    pub async fn create_sample(pool: &SqlitePool, sample: &LabSample) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO lab_sample (
                id, workspace_id, branch_id, lab_order_id, collected_by_user_id,
                collected_at, sample_label, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&sample.id)
        .bind(&sample.workspace_id)
        .bind(&sample.branch_id)
        .bind(&sample.lab_order_id)
        .bind(&sample.collected_by_user_id)
        .bind(&sample.collected_at)
        .bind(&sample.sample_label)
        .bind(&sample.status)
        .bind(&sample.created_at)
        .bind(&sample.updated_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn update_sample_status(
        pool: &SqlitePool,
        id: &str,
        status: &str,
        updated_at: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "UPDATE lab_sample SET status = ?, updated_at = ? WHERE id = ?"
        )
        .bind(status)
        .bind(updated_at)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(())
    }
}
