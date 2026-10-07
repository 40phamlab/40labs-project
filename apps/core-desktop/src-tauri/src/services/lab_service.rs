use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::auth::AuthContext;
use crate::models::audit::AuditLogEntry;
use crate::models::lab::{
    CollectLabSampleRequest, CreateLabOrderRequest, LabOrder, LabSample, RecordLabResultRequest,
};
use crate::repositories::audit_repo::audit;
use crate::repositories::lab_repo::LabRepository;

pub struct LabService;

impl LabService {
    pub async fn create_order(
        pool: &SqlitePool,
        ctx: &AuthContext,
        req: CreateLabOrderRequest,
    ) -> Result<LabOrder, String> {
        let now = Utc::now().to_rfc3339();
        let order_id = format!("labord_{}", Uuid::new_v4().simple());
        let order = LabOrder {
            id: order_id.clone(),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            created_at: now.clone(),
            updated_at: now.clone(),
            customer_id: req.customer_id,
            sale_id: None,
            ordered_by_user_id: ctx.user_id.clone(),
            status: "pending".to_string(),
            test_catalog_id: req.test_catalog_id,
        };

        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "lab_order_create".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "LabOrder".to_string(),
            target_entity_id: order_id,
            metadata: Some(serde_json::json!({ "test_catalog_id": &order.test_catalog_id }).to_string()),
            created_at: now,
        };
        audit::append(&mut *tx, &audit_entry)
            .await
            .map_err(|e| format!("Audit error: {}", e))?;

        LabRepository::create_order(&mut *tx, &order)
            .await
            .map_err(|e| format!("Failed to create lab order: {}", e))?;

        tx.commit().await.map_err(|e| e.to_string())?;

        Ok(order)
    }

    pub async fn collect_sample(
        pool: &SqlitePool,
        ctx: &AuthContext,
        req: CollectLabSampleRequest,
    ) -> Result<LabSample, String> {
        let now = Utc::now().to_rfc3339();
        let sample_id = format!("labsample_{}", Uuid::new_v4().simple());
        let sample = LabSample {
            id: sample_id.clone(),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            created_at: now.clone(),
            updated_at: now.clone(),
            lab_order_id: req.lab_order_id.clone(),
            collected_by_user_id: ctx.user_id.clone(),
            collected_at: now.clone(),
            sample_label: req.sample_label,
            status: "collected".to_string(),
        };

        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "lab_sample_collect".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "LabSample".to_string(),
            target_entity_id: sample_id,
            metadata: Some(serde_json::json!({ "lab_order_id": &req.lab_order_id }).to_string()),
            created_at: now.clone(),
        };
        audit::append(&mut *tx, &audit_entry)
            .await
            .map_err(|e| format!("Audit error: {}", e))?;

        LabRepository::create_sample(&mut *tx, &sample)
            .await
            .map_err(|e| format!("Failed to collect lab sample: {}", e))?;

        LabRepository::update_order_status(&mut *tx, &ctx.workspace_id, &req.lab_order_id, "sample_collected", &now)
            .await
            .map_err(|e| format!("Failed to update order status: {}", e))?;

        tx.commit().await.map_err(|e| e.to_string())?;

        Ok(sample)
    }

    pub async fn record_result(
        pool: &SqlitePool,
        ctx: &AuthContext,
        req: RecordLabResultRequest,
    ) -> Result<(), String> {
        let now = Utc::now().to_rfc3339();
        let target_status = req.status.unwrap_or_else(|| "completed".to_string());

        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "lab_result_enter".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "LabOrder".to_string(),
            target_entity_id: req.lab_order_id.clone(),
            metadata: Some(serde_json::json!({ "status": &target_status, "result_notes": &req.result_notes }).to_string()),
            created_at: now.clone(),
        };
        audit::append(&mut *tx, &audit_entry)
            .await
            .map_err(|e| format!("Audit error: {}", e))?;

        LabRepository::update_order_status(&mut *tx, &ctx.workspace_id, &req.lab_order_id, &target_status, &now)
            .await
            .map_err(|e| format!("Failed to record lab result: {}", e))?;

        tx.commit().await.map_err(|e| e.to_string())?;

        Ok(())
    }
}
