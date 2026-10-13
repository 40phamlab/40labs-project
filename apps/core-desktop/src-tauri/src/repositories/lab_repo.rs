use sqlx::SqlitePool;
use crate::models::lab::{LabOrder, LabSample, LabResult, TestCatalogEntry};

pub struct LabRepository;

impl LabRepository {
    pub async fn list_orders(pool: &SqlitePool, workspace_id: &str) -> Result<Vec<LabOrder>, sqlx::Error> {
        sqlx::query_as::<_, LabOrder>(
            "SELECT * FROM lab_order WHERE workspace_id = ? ORDER BY created_at DESC"
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn create_order(executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>, order: &LabOrder) -> Result<(), sqlx::Error> {
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
        .execute(executor)
        .await?;

        Ok(())
    }

    pub async fn update_order_status(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        workspace_id: &str,
        id: &str,
        status: &str,
        updated_at: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "UPDATE lab_order SET status = ?, updated_at = ? WHERE workspace_id = ? AND id = ?"
        )
        .bind(status)
        .bind(updated_at)
        .bind(workspace_id)
        .bind(id)
        .execute(executor)
        .await?;

        Ok(())
    }

    pub async fn list_samples(pool: &SqlitePool, workspace_id: &str) -> Result<Vec<LabSample>, sqlx::Error> {
        sqlx::query_as::<_, LabSample>(
            "SELECT * FROM lab_sample WHERE workspace_id = ? ORDER BY created_at DESC"
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn create_sample(executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>, sample: &LabSample) -> Result<(), sqlx::Error> {
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
        .execute(executor)
        .await?;

        Ok(())
    }

    pub async fn update_sample_status(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        workspace_id: &str,
        id: &str,
        status: &str,
        updated_at: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "UPDATE lab_sample SET status = ?, updated_at = ? WHERE workspace_id = ? AND id = ?"
        )
        .bind(status)
        .bind(updated_at)
        .bind(workspace_id)
        .bind(id)
        .execute(executor)
        .await?;

        Ok(())
    }

    pub async fn list_results(pool: &SqlitePool, workspace_id: &str) -> Result<Vec<LabResult>, sqlx::Error> {
        sqlx::query_as::<_, LabResult>(
            "SELECT * FROM lab_result WHERE workspace_id = ? ORDER BY created_at DESC"
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn list_catalog(pool: &SqlitePool, workspace_id: &str) -> Result<Vec<TestCatalogEntry>, sqlx::Error> {
        sqlx::query_as::<_, TestCatalogEntry>(
            "SELECT * FROM test_catalog_entry WHERE workspace_id = ? ORDER BY name ASC"
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn enter_result(executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>, result: &LabResult) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO lab_result (
                id, workspace_id, branch_id, lab_order_id, entered_by_user_id,
                value, reference_range, is_out_of_range, override_authorized_by_user_id,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&result.id)
        .bind(&result.workspace_id)
        .bind(&result.branch_id)
        .bind(&result.lab_order_id)
        .bind(&result.entered_by_user_id)
        .bind(&result.value)
        .bind(&result.reference_range)
        .bind(if result.is_out_of_range { 1 } else { 0 })
        .bind(&result.override_authorized_by_user_id)
        .bind(&result.created_at)
        .bind(&result.updated_at)
        .execute(executor)
        .await?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_db_pool_with_url;

    async fn seed_lab_prerequisites(pool: &SqlitePool) {
        sqlx::query(
            r#"
            INSERT OR IGNORE INTO app_user (
                id, workspace_id, branch_id, username, first_name, last_name, full_name,
                role, role_preset, active, created_at, updated_at
            ) VALUES (
                'user_lab_test', 'ws_lab', 'br_lab', 'labtech', 'Lab', 'Tech', 'Lab Tech',
                'staff', 'admin', 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
            )
            "#,
        )
        .execute(pool)
        .await
        .unwrap();

        sqlx::query(
            r#"
            INSERT OR IGNORE INTO test_catalog_entry (
                id, workspace_id, branch_id, name, category, reference_range, price, created_at, updated_at
            ) VALUES (
                'test_cat_01', 'ws_lab', 'br_lab', 'Full Blood Picture', 'Hematology', '4.0-10.0', 15000, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
            )
            "#,
        )
        .execute(pool)
        .await
        .unwrap();

        sqlx::query(
            r#"
            INSERT OR IGNORE INTO customer (
                id, workspace_id, branch_id, full_name, phone, created_at, updated_at
            ) VALUES (
                'cust_lab_01', 'ws_lab', 'br_lab', 'Juma Juma', '0711223344', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
            )
            "#,
        )
        .execute(pool)
        .await
        .unwrap();

        let order = LabOrder {
            id: "ord_lab_01".to_string(),
            workspace_id: "ws_lab".to_string(),
            branch_id: "br_lab".to_string(),
            created_at: "2026-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
            customer_id: "cust_lab_01".to_string(),
            sale_id: None,
            ordered_by_user_id: "user_lab_test".to_string(),
            status: "pending".to_string(),
            test_catalog_id: "test_cat_01".to_string(),
        };
        LabRepository::create_order(pool, &order).await.unwrap();
    }

    #[tokio::test]
    async fn test_lab_sample_create_and_list() {
        let pool = init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to initialize DB pool");

        seed_lab_prerequisites(&pool).await;

        let sample = LabSample {
            id: "sample_001".to_string(),
            workspace_id: "ws_lab".to_string(),
            branch_id: "br_lab".to_string(),
            created_at: "2026-01-01T10:00:00Z".to_string(),
            updated_at: "2026-01-01T10:00:00Z".to_string(),
            lab_order_id: "ord_lab_01".to_string(),
            collected_by_user_id: "user_lab_test".to_string(),
            collected_at: "2026-01-01T10:00:00Z".to_string(),
            sample_label: "BLOOD-SAMPLE-A1".to_string(),
            status: "collected".to_string(),
        };

        LabRepository::create_sample(&pool, &sample)
            .await
            .expect("Failed to create sample");

        let samples = LabRepository::list_samples(&pool, "ws_lab")
            .await
            .expect("Failed to list samples");

        assert_eq!(samples.len(), 1);
        assert_eq!(samples[0].id, "sample_001");
        assert_eq!(samples[0].sample_label, "BLOOD-SAMPLE-A1");
        assert_eq!(samples[0].status, "collected");

        // Test updating status
        LabRepository::update_sample_status(&pool, "ws_lab", "sample_001", "used", "2026-01-01T11:00:00Z")
            .await
            .expect("Failed to update sample status");

        let updated_samples = LabRepository::list_samples(&pool, "ws_lab")
            .await
            .expect("Failed to list updated samples");

        assert_eq!(updated_samples.len(), 1);
        assert_eq!(updated_samples[0].status, "used");
    }

    #[tokio::test]
    async fn test_lab_results_and_catalog() {
        let pool = init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to initialize DB pool");

        seed_lab_prerequisites(&pool).await;

        let catalog = LabRepository::list_catalog(&pool, "ws_lab")
            .await
            .expect("Failed to list test catalog");
        assert_eq!(catalog.len(), 1);
        assert_eq!(catalog[0].name, "Full Blood Picture");

        let result = LabResult {
            id: "result_001".to_string(),
            workspace_id: "ws_lab".to_string(),
            branch_id: "br_lab".to_string(),
            lab_order_id: "ord_lab_01".to_string(),
            entered_by_user_id: "user_lab_test".to_string(),
            value: "Hb 13.5 g/dL".to_string(),
            reference_range: Some("12.0-16.0 g/dL".to_string()),
            is_out_of_range: false,
            override_authorized_by_user_id: None,
            created_at: "2026-01-01T12:00:00Z".to_string(),
            updated_at: "2026-01-01T12:00:00Z".to_string(),
        };

        LabRepository::enter_result(&pool, &result)
            .await
            .expect("Failed to enter lab result");

        let results = LabRepository::list_results(&pool, "ws_lab")
            .await
            .expect("Failed to list lab results");

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "result_001");
        assert_eq!(results[0].value, "Hb 13.5 g/dL");
        assert!(!results[0].is_out_of_range);
    }

    #[tokio::test]
    async fn test_migration_upgrade_existing_lab_sample_data_preservation() {
        let pool = sqlx::SqlitePool::connect("sqlite::memory:")
            .await
            .expect("Failed to connect to in-memory SQLite");

        // 1. Create table as it existed in 0001_init.sql WITHOUT status column
        sqlx::query(
            r#"
            CREATE TABLE lab_sample (
              id TEXT PRIMARY KEY,
              workspace_id TEXT NOT NULL,
              branch_id TEXT NOT NULL,
              lab_order_id TEXT NOT NULL,
              collected_by_user_id TEXT NOT NULL,
              collected_at TEXT NOT NULL,
              sample_label TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
              updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
            );
            "#,
        )
        .execute(&pool)
        .await
        .unwrap();

        // 2. Insert existing sample record before migration
        sqlx::query(
            r#"
            INSERT INTO lab_sample (
                id, workspace_id, branch_id, lab_order_id, collected_by_user_id,
                collected_at, sample_label, created_at, updated_at
            ) VALUES (
                'legacy_sample_99', 'ws_lab', 'br_lab', 'ord_legacy_01', 'user_legacy',
                '2025-12-31T23:59:59Z', 'LEGACY-LABEL-99', '2025-12-31T23:59:59Z', '2025-12-31T23:59:59Z'
            )
            "#,
        )
        .execute(&pool)
        .await
        .unwrap();

        // 3. Execute forward-only migration (matching 0003_lab_sample_status.sql)
        sqlx::query(
            "ALTER TABLE lab_sample ADD COLUMN status TEXT NOT NULL DEFAULT 'collected' CHECK (status IN ('collected','insufficient','declined','used','removed'));",
        )
        .execute(&pool)
        .await
        .expect("Migration failed to execute");

        // 4. Verify existing record was preserved and assigned default status
        let samples = LabRepository::list_samples(&pool, "ws_lab")
            .await
            .expect("Failed to list samples post-migration");

        assert_eq!(samples.len(), 1);
        assert_eq!(samples[0].id, "legacy_sample_99");
        assert_eq!(samples[0].sample_label, "LEGACY-LABEL-99");
        assert_eq!(samples[0].status, "collected");
    }
}
