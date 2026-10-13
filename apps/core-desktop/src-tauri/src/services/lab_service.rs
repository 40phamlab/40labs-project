use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::auth::AuthContext;
use crate::models::audit::AuditLogEntry;
use crate::models::lab::{
    CollectLabSampleRequest, CreateLabOrderRequest, CreateLabQcEquipmentRequest,
    CreateLabQcRecordRequest, CreateTestCatalogRequest, LabOrder, LabQcEquipment, LabQcRecord,
    LabSample, RecordLabResultRequest, TestCatalogEntry,
};
use crate::repositories::audit_repo::audit;
use crate::repositories::lab_repo::LabRepository;

pub struct LabService;

#[derive(Debug, thiserror::Error)]
pub enum LabStatusError {
    #[error("Lab record not found in the authorized workspace and branch")]
    NotFound,
    #[error("Invalid laboratory status transition from '{from}' to '{to}'")]
    InvalidTransition { from: String, to: String },
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
}

// Preserve the established workflow states: an order may be reopened from
// unsolved, progress through collection and reporting, or be cancelled before
// completion. Existing result_entered records may finish as report_ready.
pub fn valid_order_transition(from: &str, to: &str) -> bool {
    matches!(
        (from, to),
        ("unsolved", "pending")
            | ("unsolved", "cancelled")
            | ("pending", "sample_collected")
            | ("pending", "cancelled")
            | ("sample_collected", "report_ready")
            | ("sample_collected", "cancelled")
            | ("result_entered", "report_ready")
            | ("result_entered", "cancelled")
    )
}

// Sample outcome values are terminal; the UI has no workflow for reopening them.
pub fn valid_sample_transition(from: &str, to: &str) -> bool {
    from == "collected" && matches!(to, "used" | "insufficient" | "declined" | "removed")
}

impl LabService {
    pub async fn update_order_status(
        pool: &SqlitePool,
        ctx: &AuthContext,
        id: &str,
        status: &str,
    ) -> Result<(), LabStatusError> {
        let mut tx = pool.begin().await?;
        let current =
            LabRepository::get_order_status(&mut *tx, &ctx.workspace_id, &ctx.branch_id, id)
                .await?
                .ok_or(LabStatusError::NotFound)?;
        if !valid_order_transition(&current, status) {
            return Err(LabStatusError::InvalidTransition {
                from: current,
                to: status.into(),
            });
        }
        let rows = LabRepository::update_order_status(
            &mut *tx,
            &ctx.workspace_id,
            &ctx.branch_id,
            id,
            &current,
            status,
            &Utc::now().to_rfc3339(),
        )
        .await?;
        if rows != 1 {
            return Err(LabStatusError::NotFound);
        }
        tx.commit().await?;
        Ok(())
    }

    pub async fn update_sample_status(
        pool: &SqlitePool,
        ctx: &AuthContext,
        id: &str,
        status: &str,
    ) -> Result<(), LabStatusError> {
        let mut tx = pool.begin().await?;
        let current =
            LabRepository::get_sample_status(&mut *tx, &ctx.workspace_id, &ctx.branch_id, id)
                .await?
                .ok_or(LabStatusError::NotFound)?;
        if !valid_sample_transition(&current, status) {
            return Err(LabStatusError::InvalidTransition {
                from: current,
                to: status.into(),
            });
        }
        let rows = LabRepository::update_sample_status(
            &mut *tx,
            &ctx.workspace_id,
            &ctx.branch_id,
            id,
            &current,
            status,
            &Utc::now().to_rfc3339(),
        )
        .await?;
        if rows != 1 {
            return Err(LabStatusError::NotFound);
        }
        tx.commit().await?;
        Ok(())
    }
    pub async fn create_catalog_entry(
        pool: &SqlitePool,
        ctx: &AuthContext,
        req: CreateTestCatalogRequest,
    ) -> Result<TestCatalogEntry, String> {
        let name = req.name.trim();
        let category = req.category.trim();
        if name.is_empty() || category.is_empty() || req.price < 0 {
            return Err("Test name, category, and a non-negative price are required".into());
        }
        let now = Utc::now().to_rfc3339();
        let entry = TestCatalogEntry {
            id: format!("test_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            name: name.into(),
            category: category.into(),
            reference_range: req
                .reference_range
                .map(|v| v.trim().to_string())
                .filter(|v| !v.is_empty()),
            price: req.price,
            created_at: now.clone(),
            updated_at: now,
        };
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
        LabRepository::create_catalog_entry(&mut *tx, &entry)
            .await
            .map_err(|e| e.to_string())?;
        append_lab_audit(
            &mut tx,
            ctx,
            "lab_catalog_create",
            "TestCatalogEntry",
            &entry.id,
            serde_json::json!({"name": entry.name, "price": entry.price}),
            &entry.created_at,
        )
        .await?;
        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(entry)
    }

    pub async fn create_qc_equipment(
        pool: &SqlitePool,
        ctx: &AuthContext,
        req: CreateLabQcEquipmentRequest,
    ) -> Result<LabQcEquipment, String> {
        let name = req.name.trim();
        if name.is_empty() {
            return Err("Equipment name is required".into());
        }
        let now = Utc::now().to_rfc3339();
        let equipment = LabQcEquipment {
            id: format!("labequipment_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            name: name.into(),
            manufacturer: req.manufacturer,
            model: req.model,
            asset_tag: req.asset_tag,
            status: "operational".into(),
            last_calibrated_at: None,
            created_at: now.clone(),
            updated_at: now,
        };
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
        LabRepository::create_qc_equipment(&mut *tx, &equipment)
            .await
            .map_err(|e| e.to_string())?;
        append_lab_audit(
            &mut tx,
            ctx,
            "lab_qc_equipment_create",
            "LabQcEquipment",
            &equipment.id,
            serde_json::json!({"name": equipment.name}),
            &equipment.created_at,
        )
        .await?;
        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(equipment)
    }

    pub async fn record_qc(
        pool: &SqlitePool,
        ctx: &AuthContext,
        req: CreateLabQcRecordRequest,
    ) -> Result<LabQcRecord, String> {
        let control_name = req.control_name.trim();
        let observed_value = req.observed_value.trim();
        let expected_range = req.expected_range.trim();
        let outcome = req.outcome.trim().to_lowercase();
        if control_name.is_empty()
            || observed_value.is_empty()
            || expected_range.is_empty()
            || !["pass", "fail"].contains(&outcome.as_str())
        {
            return Err(
                "QC control, observed value, expected range, and pass/fail outcome are required"
                    .into(),
            );
        }
        let equipment_exists: i64 = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM lab_qc_equipment WHERE id = ? AND workspace_id = ? AND branch_id = ?)")
            .bind(&req.equipment_id).bind(&ctx.workspace_id).bind(&ctx.branch_id).fetch_one(pool).await.map_err(|e| e.to_string())?;
        if equipment_exists == 0 {
            return Err("Equipment is outside the authorized workspace and branch".into());
        }
        let now = Utc::now().to_rfc3339();
        let record = LabQcRecord {
            id: format!("labqc_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            equipment_id: req.equipment_id,
            control_name: control_name.into(),
            lot_number: req.lot_number,
            observed_value: observed_value.into(),
            expected_range: expected_range.into(),
            outcome,
            performed_by_user_id: ctx.user_id.clone(),
            performed_at: now.clone(),
            created_at: now.clone(),
            updated_at: now,
        };
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
        LabRepository::create_qc_record(&mut *tx, &record)
            .await
            .map_err(|e| e.to_string())?;
        append_lab_audit(
            &mut tx,
            ctx,
            "lab_qc_record_create",
            "LabQcRecord",
            &record.id,
            serde_json::json!({"outcome": record.outcome, "control_name": record.control_name}),
            &record.created_at,
        )
        .await?;
        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(record)
    }

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

        let customer_exists: i64 = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM customer WHERE id = ? AND workspace_id = ? AND branch_id = ?)")
            .bind(&order.customer_id).bind(&ctx.workspace_id).bind(&ctx.branch_id)
            .fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;
        let catalog_exists: i64 = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM test_catalog_entry WHERE id = ? AND workspace_id = ? AND branch_id = ?)")
            .bind(&order.test_catalog_id).bind(&ctx.workspace_id).bind(&ctx.branch_id)
            .fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;
        if customer_exists == 0 || catalog_exists == 0 {
            return Err(
                "Customer or test catalog entry is outside the authorized workspace and branch"
                    .to_string(),
            );
        }

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "lab_order_create".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "LabOrder".to_string(),
            target_entity_id: order_id,
            metadata: Some(
                serde_json::json!({ "test_catalog_id": &order.test_catalog_id }).to_string(),
            ),
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

        let current = LabRepository::get_order_status(
            &mut *tx,
            &ctx.workspace_id,
            &ctx.branch_id,
            &req.lab_order_id,
        )
        .await
        .map_err(|e| e.to_string())?
            .ok_or_else(|| "Lab order is outside the authorized workspace and branch".to_string())?;
        if !valid_order_transition(&current, "sample_collected") {
            return Err(format!(
                "Cannot collect a sample while order status is '{current}'"
            ));
        }

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

        let affected = LabRepository::update_order_status(
            &mut *tx,
            &ctx.workspace_id,
            &ctx.branch_id,
            &req.lab_order_id,
            &current,
            "sample_collected",
            &now,
        )
        .await
        .map_err(|e| format!("Failed to update order status: {}", e))?;
        if affected != 1 {
            return Err(
                "Lab order changed while collecting the sample; refresh and try again".into(),
            );
        }

        tx.commit().await.map_err(|e| e.to_string())?;

        Ok(sample)
    }

    pub async fn record_result(
        pool: &SqlitePool,
        ctx: &AuthContext,
        req: RecordLabResultRequest,
    ) -> Result<(), String> {
        let now = Utc::now().to_rfc3339();
        let target_status = req.status.unwrap_or_else(|| "report_ready".to_string());
        if target_status != "report_ready" {
            return Err("Recording a lab result can only move an order to report_ready".into());
        }

        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let current = LabRepository::get_order_status(
            &mut *tx,
            &ctx.workspace_id,
            &ctx.branch_id,
            &req.lab_order_id,
        )
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Lab order not found in the authorized workspace and branch".to_string())?;
        if !valid_order_transition(&current, &target_status) {
            return Err(format!(
                "Invalid laboratory status transition from '{current}' to '{target_status}'"
            ));
        }

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "lab_result_enter".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "LabOrder".to_string(),
            target_entity_id: req.lab_order_id.clone(),
            metadata: Some(
                serde_json::json!({ "status": &target_status, "result_notes": &req.result_notes })
                    .to_string(),
            ),
            created_at: now.clone(),
        };
        audit::append(&mut *tx, &audit_entry)
            .await
            .map_err(|e| format!("Audit error: {}", e))?;

        let affected = LabRepository::update_order_status(
            &mut *tx,
            &ctx.workspace_id,
            &ctx.branch_id,
            &req.lab_order_id,
            &current,
            &target_status,
            &now,
        )
        .await
        .map_err(|e| format!("Failed to record lab result: {}", e))?;
        if affected != 1 {
            return Err(
                "Lab order changed while recording the result; refresh and try again".into(),
            );
        }

        tx.commit().await.map_err(|e| e.to_string())?;

        Ok(())
    }
}

async fn append_lab_audit(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    ctx: &AuthContext,
    action: &str,
    entity_type: &str,
    entity_id: &str,
    metadata: serde_json::Value,
    created_at: &str,
) -> Result<(), String> {
    let entry = AuditLogEntry {
        id: format!("audit_{}", Uuid::new_v4().simple()),
        workspace_id: ctx.workspace_id.clone(),
        branch_id: ctx.branch_id.clone(),
        action: action.to_string(),
        performed_by_user_id: Some(ctx.user_id.clone()),
        target_entity_type: entity_type.to_string(),
        target_entity_id: entity_id.to_string(),
        metadata: Some(metadata.to_string()),
        created_at: created_at.to_string(),
    };
    audit::append(&mut **tx, &entry)
        .await
        .map_err(|e| e.to_string())
}
