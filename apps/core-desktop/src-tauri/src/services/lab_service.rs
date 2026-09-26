use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::models::lab::{
    CollectLabSampleRequest, CreateLabOrderRequest, LabOrder, LabSample,
};
use crate::models::{DEFAULT_BRANCH_ID, DEFAULT_WORKSPACE_ID};
use crate::repositories::lab_repo::LabRepository;

pub struct LabService;

impl LabService {
    pub async fn create_order(
        pool: &SqlitePool,
        req: CreateLabOrderRequest,
    ) -> Result<LabOrder, String> {
        let now = Utc::now().to_rfc3339();
        let order = LabOrder {
            id: format!("labord_{}", Uuid::new_v4().simple()),
            workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
            branch_id: DEFAULT_BRANCH_ID.to_string(),
            created_at: now.clone(),
            updated_at: now,
            customer_id: req.customer_id,
            sale_id: None,
            ordered_by_user_id: "user_001".to_string(),
            status: "pending".to_string(),
            test_catalog_id: req.test_catalog_id,
        };

        LabRepository::create_order(pool, &order)
            .await
            .map_err(|e| format!("Failed to create lab order: {}", e))?;

        Ok(order)
    }

    pub async fn collect_sample(
        pool: &SqlitePool,
        req: CollectLabSampleRequest,
    ) -> Result<LabSample, String> {
        let now = Utc::now().to_rfc3339();
        let sample = LabSample {
            id: format!("labsample_{}", Uuid::new_v4().simple()),
            workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
            branch_id: DEFAULT_BRANCH_ID.to_string(),
            created_at: now.clone(),
            updated_at: now.clone(),
            lab_order_id: req.lab_order_id.clone(),
            collected_by_user_id: "user_001".to_string(),
            collected_at: now.clone(),
            sample_label: req.sample_label,
            status: "collected".to_string(),
        };

        LabRepository::create_sample(pool, &sample)
            .await
            .map_err(|e| format!("Failed to collect lab sample: {}", e))?;

        LabRepository::update_order_status(pool, &req.lab_order_id, "sample_collected", &now)
            .await
            .map_err(|e| format!("Failed to update order status: {}", e))?;

        Ok(sample)
    }
}
