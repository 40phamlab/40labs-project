use crate::models::inventory::{InventoryItem, Medicine, MedicineWithInventory};
use crate::models::lab::{
    LabOrder, LabQcData, LabQcEquipment, LabQcRecord, LabResult, LabSample, TestCatalogEntry,
};
use sqlx::SqlitePool;

pub struct LabRepository;

impl LabRepository {
    pub async fn list_stock(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
    ) -> Result<Vec<MedicineWithInventory>, sqlx::Error> {
        let items = sqlx::query_as::<_, InventoryItem>("SELECT * FROM inventory_item WHERE workspace_id = ? AND branch_id = ? AND is_deactivated = 0 ORDER BY expiry_date ASC")
            .bind(workspace_id).bind(branch_id).fetch_all(pool).await?;
        let mut stock = Vec::new();
        for item in items {
            if let Some(medicine) = sqlx::query_as::<_, Medicine>(
                "SELECT * FROM medicine WHERE workspace_id = ? AND branch_id = ? AND id = ?",
            )
            .bind(workspace_id)
            .bind(branch_id)
            .bind(&item.medicine_id)
            .fetch_optional(pool)
            .await?
            {
                stock.push(MedicineWithInventory {
                    inventory_item: item,
                    medicine,
                });
            }
        }
        Ok(stock)
    }

    pub async fn list_orders(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
    ) -> Result<Vec<LabOrder>, sqlx::Error> {
        sqlx::query_as::<_, LabOrder>(
            "SELECT * FROM lab_order WHERE workspace_id = ? AND branch_id = ? ORDER BY created_at DESC"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .fetch_all(pool)
        .await
    }

    pub async fn create_order(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        order: &LabOrder,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO lab_order (
                id, workspace_id, branch_id, customer_id, sale_id, ordered_by_user_id,
                status, test_catalog_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
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
        branch_id: &str,
        id: &str,
        current_status: &str,
        status: &str,
        updated_at: &str,
    ) -> Result<u64, sqlx::Error> {
        sqlx::query(
            "UPDATE lab_order SET status = ?, updated_at = ? WHERE workspace_id = ? AND branch_id = ? AND id = ? AND status = ?"
        )
        .bind(status)
        .bind(updated_at)
        .bind(workspace_id)
        .bind(branch_id)
        .bind(id)
        .bind(current_status)
        .execute(executor)
        .await
        .map(|result| result.rows_affected())
    }

    pub async fn get_order_status(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        workspace_id: &str,
        branch_id: &str,
        id: &str,
    ) -> Result<Option<String>, sqlx::Error> {
        sqlx::query_scalar(
            "SELECT status FROM lab_order WHERE workspace_id = ? AND branch_id = ? AND id = ?",
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(id)
        .fetch_optional(executor)
        .await
    }

    pub async fn list_samples(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
    ) -> Result<Vec<LabSample>, sqlx::Error> {
        sqlx::query_as::<_, LabSample>(
            "SELECT * FROM lab_sample WHERE workspace_id = ? AND branch_id = ? ORDER BY created_at DESC"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .fetch_all(pool)
        .await
    }

    pub async fn create_sample(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        sample: &LabSample,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO lab_sample (
                id, workspace_id, branch_id, lab_order_id, collected_by_user_id,
                collected_at, sample_label, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
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
        branch_id: &str,
        id: &str,
        current_status: &str,
        status: &str,
        updated_at: &str,
    ) -> Result<u64, sqlx::Error> {
        sqlx::query(
            "UPDATE lab_sample SET status = ?, updated_at = ? WHERE workspace_id = ? AND branch_id = ? AND id = ? AND status = ?"
        )
        .bind(status)
        .bind(updated_at)
        .bind(workspace_id)
        .bind(branch_id)
        .bind(id)
        .bind(current_status)
        .execute(executor)
        .await
        .map(|result| result.rows_affected())
    }

    pub async fn get_sample_status(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        workspace_id: &str,
        branch_id: &str,
        id: &str,
    ) -> Result<Option<String>, sqlx::Error> {
        sqlx::query_scalar(
            "SELECT status FROM lab_sample WHERE workspace_id = ? AND branch_id = ? AND id = ?",
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(id)
        .fetch_optional(executor)
        .await
    }

    pub async fn list_results(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
    ) -> Result<Vec<LabResult>, sqlx::Error> {
        sqlx::query_as::<_, LabResult>(
            "SELECT * FROM lab_result WHERE workspace_id = ? AND branch_id = ? ORDER BY created_at DESC"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .fetch_all(pool)
        .await
    }

    pub async fn list_catalog(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
    ) -> Result<Vec<TestCatalogEntry>, sqlx::Error> {
        sqlx::query_as::<_, TestCatalogEntry>(
            "SELECT * FROM test_catalog_entry WHERE workspace_id = ? AND branch_id = ? ORDER BY name ASC"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .fetch_all(pool)
        .await
    }

    pub async fn create_catalog_entry(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        entry: &TestCatalogEntry,
    ) -> Result<(), sqlx::Error> {
        sqlx::query("INSERT INTO test_catalog_entry (id, workspace_id, branch_id, name, category, reference_range, price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&entry.id).bind(&entry.workspace_id).bind(&entry.branch_id).bind(&entry.name).bind(&entry.category)
            .bind(&entry.reference_range).bind(entry.price).bind(&entry.created_at).bind(&entry.updated_at).execute(executor).await?;
        Ok(())
    }

    pub async fn get_qc_data(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
    ) -> Result<LabQcData, sqlx::Error> {
        let equipment = sqlx::query_as::<_, LabQcEquipment>(
            "SELECT * FROM lab_qc_equipment WHERE workspace_id = ? AND branch_id = ? ORDER BY name",
        )
        .bind(workspace_id)
        .bind(branch_id)
        .fetch_all(pool)
        .await?;
        let records = sqlx::query_as::<_, LabQcRecord>("SELECT * FROM lab_qc_record WHERE workspace_id = ? AND branch_id = ? ORDER BY performed_at DESC")
            .bind(workspace_id).bind(branch_id).fetch_all(pool).await?;
        Ok(LabQcData { equipment, records })
    }

    pub async fn create_qc_equipment(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        equipment: &LabQcEquipment,
    ) -> Result<(), sqlx::Error> {
        sqlx::query("INSERT INTO lab_qc_equipment (id, workspace_id, branch_id, name, manufacturer, model, asset_tag, status, last_calibrated_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&equipment.id).bind(&equipment.workspace_id).bind(&equipment.branch_id).bind(&equipment.name)
            .bind(&equipment.manufacturer).bind(&equipment.model).bind(&equipment.asset_tag).bind(&equipment.status)
            .bind(&equipment.last_calibrated_at).bind(&equipment.created_at).bind(&equipment.updated_at).execute(executor).await?;
        Ok(())
    }

    pub async fn create_qc_record(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        record: &LabQcRecord,
    ) -> Result<(), sqlx::Error> {
        sqlx::query("INSERT INTO lab_qc_record (id, workspace_id, branch_id, equipment_id, control_name, lot_number, observed_value, expected_range, outcome, performed_by_user_id, performed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&record.id).bind(&record.workspace_id).bind(&record.branch_id).bind(&record.equipment_id)
            .bind(&record.control_name).bind(&record.lot_number).bind(&record.observed_value).bind(&record.expected_range)
            .bind(&record.outcome).bind(&record.performed_by_user_id).bind(&record.performed_at).bind(&record.created_at).bind(&record.updated_at).execute(executor).await?;
        Ok(())
    }

    pub async fn enter_result(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        result: &LabResult,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO lab_result (
                id, workspace_id, branch_id, lab_order_id, entered_by_user_id,
                value, reference_range, is_out_of_range, override_authorized_by_user_id,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
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
    async fn lab_branch_scope_hides_records_and_rejects_foreign_references() {
        let pool = init_db_pool_with_url("sqlite::memory:").await.unwrap();
        seed_lab_prerequisites(&pool).await;
        sqlx::query("INSERT INTO customer (id, workspace_id, branch_id, full_name, phone, created_at, updated_at) VALUES ('cust_b', 'ws_lab', 'br_b', 'Branch B', '2', 'now', 'now')")
            .execute(&pool).await.unwrap();
        sqlx::query("INSERT INTO test_catalog_entry (id, workspace_id, branch_id, name, category, price, created_at, updated_at) VALUES ('cat_b', 'ws_lab', 'br_b', 'B test', 'Lab', 1, 'now', 'now')")
            .execute(&pool).await.unwrap();
        let order_b = LabOrder {
            id: "order_b".into(),
            workspace_id: "ws_lab".into(),
            branch_id: "br_b".into(),
            customer_id: "cust_b".into(),
            sale_id: None,
            ordered_by_user_id: "user_lab_test".into(),
            status: "pending".into(),
            test_catalog_id: "cat_b".into(),
            created_at: "now".into(),
            updated_at: "now".into(),
        };
        LabRepository::create_order(&pool, &order_b).await.unwrap();
        LabRepository::create_sample(
            &pool,
            &LabSample {
                id: "sample_b".into(),
                workspace_id: "ws_lab".into(),
                branch_id: "br_b".into(),
                created_at: "now".into(),
                updated_at: "now".into(),
                lab_order_id: "order_b".into(),
                collected_by_user_id: "user_lab_test".into(),
                collected_at: "now".into(),
                sample_label: "B".into(),
                status: "collected".into(),
            },
        )
        .await
        .unwrap();
        LabRepository::enter_result(
            &pool,
            &LabResult {
                id: "result_b".into(),
                workspace_id: "ws_lab".into(),
                branch_id: "br_b".into(),
                lab_order_id: "order_b".into(),
                entered_by_user_id: "user_lab_test".into(),
                value: "B result".into(),
                reference_range: None,
                is_out_of_range: false,
                override_authorized_by_user_id: None,
                created_at: "now".into(),
                updated_at: "now".into(),
            },
        )
        .await
        .unwrap();

        let branch_a = LabRepository::list_orders(&pool, "ws_lab", "br_lab")
            .await
            .unwrap();
        let branch_b = LabRepository::list_orders(&pool, "ws_lab", "br_b")
            .await
            .unwrap();
        assert!(branch_a.iter().all(|o| o.id != "order_b"));
        assert_eq!(
            branch_b.iter().map(|o| o.id.as_str()).collect::<Vec<_>>(),
            vec!["order_b"]
        );
        assert!(LabRepository::list_catalog(&pool, "ws_lab", "br_lab")
            .await
            .unwrap()
            .iter()
            .all(|c| c.id != "cat_b"));
        assert!(LabRepository::list_catalog(&pool, "ws_lab", "br_b")
            .await
            .unwrap()
            .iter()
            .any(|c| c.id == "cat_b"));
        assert!(LabRepository::list_samples(&pool, "ws_lab", "br_lab")
            .await
            .unwrap()
            .iter()
            .all(|s| s.id != "sample_b"));
        assert!(LabRepository::list_results(&pool, "ws_lab", "br_lab")
            .await
            .unwrap()
            .iter()
            .all(|r| r.id != "result_b"));
        assert!(LabRepository::list_results(&pool, "ws_lab", "br_b")
            .await
            .unwrap()
            .iter()
            .any(|r| r.id == "result_b"));

        LabRepository::update_order_status(
            &pool,
            "ws_lab",
            "br_lab",
            "order_b",
            "pending",
            "report_ready",
            "later",
        )
        .await
        .unwrap();
        let status: String =
            sqlx::query_scalar("SELECT status FROM lab_order WHERE id = 'order_b'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(status, "pending");
        LabRepository::update_sample_status(
            &pool,
            "ws_lab",
            "br_lab",
            "sample_b",
            "collected",
            "used",
            "later",
        )
        .await
        .unwrap();
        let sample_status: String =
            sqlx::query_scalar("SELECT status FROM lab_sample WHERE id = 'sample_b'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(sample_status, "collected");

        let ctx = crate::auth::AuthContext {
            user_id: "user_lab_test".into(),
            workspace_id: "ws_lab".into(),
            branch_id: "br_lab".into(),
        };
        let err = crate::services::lab_service::LabService::create_order(
            &pool,
            &ctx,
            crate::models::lab::CreateLabOrderRequest {
                customer_id: "cust_b".into(),
                test_catalog_id: "test_cat_01".into(),
            },
        )
        .await
        .unwrap_err();
        assert!(err.contains("outside the authorized"));
        let err = crate::services::lab_service::LabService::collect_sample(
            &pool,
            &ctx,
            crate::models::lab::CollectLabSampleRequest {
                lab_order_id: "order_b".into(),
                sample_label: "x".into(),
            },
        )
        .await
        .unwrap_err();
        assert!(err.contains("outside the authorized"));
    }

    #[tokio::test]
    async fn lab_status_updates_enforce_transitions_scope_and_not_found() {
        let pool = init_db_pool_with_url("sqlite::memory:").await.unwrap();
        seed_lab_prerequisites(&pool).await;
        let ctx = crate::auth::AuthContext {
            user_id: "user_lab_test".into(),
            workspace_id: "ws_lab".into(),
            branch_id: "br_lab".into(),
        };

        crate::services::lab_service::LabService::update_order_status(
            &pool,
            &ctx,
            "ord_lab_01",
            "sample_collected",
        )
        .await
        .unwrap();
        let invalid = crate::services::lab_service::LabService::update_order_status(
            &pool,
            &ctx,
            "ord_lab_01",
            "pending",
        )
        .await
        .unwrap_err();
        assert!(matches!(
            invalid,
            crate::services::lab_service::LabStatusError::InvalidTransition { .. }
        ));
        let status: String =
            sqlx::query_scalar("SELECT status FROM lab_order WHERE id = 'ord_lab_01'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(status, "sample_collected");

        let missing = crate::services::lab_service::LabService::update_order_status(
            &pool,
            &ctx,
            "missing",
            "cancelled",
        )
        .await
        .unwrap_err();
        assert!(matches!(
            missing,
            crate::services::lab_service::LabStatusError::NotFound
        ));
        LabRepository::create_order(
            &pool,
            &LabOrder {
                id: "order_b".into(),
                workspace_id: "ws_lab".into(),
                branch_id: "br_b".into(),
                customer_id: "cust_lab_01".into(),
                sale_id: None,
                ordered_by_user_id: "user_lab_test".into(),
                status: "pending".into(),
                test_catalog_id: "test_cat_01".into(),
                created_at: "now".into(),
                updated_at: "now".into(),
            },
        )
        .await
        .unwrap();
        let foreign = crate::services::lab_service::LabService::update_order_status(
            &pool,
            &ctx,
            "order_b",
            "cancelled",
        )
        .await
        .unwrap_err();
        assert!(matches!(
            foreign,
            crate::services::lab_service::LabStatusError::NotFound
        ));

        LabRepository::create_sample(
            &pool,
            &LabSample {
                id: "status_sample".into(),
                workspace_id: "ws_lab".into(),
                branch_id: "br_lab".into(),
                created_at: "now".into(),
                updated_at: "now".into(),
                lab_order_id: "ord_lab_01".into(),
                collected_by_user_id: "user_lab_test".into(),
                collected_at: "now".into(),
                sample_label: "blood".into(),
                status: "collected".into(),
            },
        )
        .await
        .unwrap();
        crate::services::lab_service::LabService::update_sample_status(
            &pool,
            &ctx,
            "status_sample",
            "used",
        )
        .await
        .unwrap();
        let invalid_sample = crate::services::lab_service::LabService::update_sample_status(
            &pool,
            &ctx,
            "status_sample",
            "declined",
        )
        .await
        .unwrap_err();
        assert!(matches!(
            invalid_sample,
            crate::services::lab_service::LabStatusError::InvalidTransition { .. }
        ));
        let sample_status: String =
            sqlx::query_scalar("SELECT status FROM lab_sample WHERE id = 'status_sample'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(sample_status, "used");
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

        let samples = LabRepository::list_samples(&pool, "ws_lab", "br_lab")
            .await
            .expect("Failed to list samples");

        assert_eq!(samples.len(), 1);
        assert_eq!(samples[0].id, "sample_001");
        assert_eq!(samples[0].sample_label, "BLOOD-SAMPLE-A1");
        assert_eq!(samples[0].status, "collected");

        // Test updating status
        LabRepository::update_sample_status(
            &pool,
            "ws_lab",
            "br_lab",
            "sample_001",
            "collected",
            "used",
            "2026-01-01T11:00:00Z",
        )
        .await
        .expect("Failed to update sample status");

        let updated_samples = LabRepository::list_samples(&pool, "ws_lab", "br_lab")
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

        let catalog = LabRepository::list_catalog(&pool, "ws_lab", "br_lab")
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

        let results = LabRepository::list_results(&pool, "ws_lab", "br_lab")
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
        let samples = LabRepository::list_samples(&pool, "ws_lab", "br_lab")
            .await
            .expect("Failed to list samples post-migration");

        assert_eq!(samples.len(), 1);
        assert_eq!(samples[0].id, "legacy_sample_99");
        assert_eq!(samples[0].sample_label, "LEGACY-LABEL-99");
        assert_eq!(samples[0].status, "collected");
    }
}
