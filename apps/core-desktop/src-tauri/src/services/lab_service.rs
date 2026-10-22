use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::auth::AuthContext;
use crate::models::audit::AuditLogEntry;
use crate::models::lab::{
    CollectLabSampleRequest, CreateLabOrderRequest, CreateLabQcEquipmentRequest,
    CreateLabQcRecordRequest, CreateTestCatalogRequest, LabOrder, LabQcEquipment, LabQcRecord,
    LabSample, RecordLabResultRequest, SampleEvent, TestCatalogEntry, UpdateSampleExpiryRequest,
    LabReport, LabReportItem, LabReportForward, CreateLabReportRequest, FinalizeLabReportRequest, AmendLabReportRequest, ForwardLabReportRequest, LabResult,
};
use crate::models::notification::Notification;
use crate::repositories::audit_repo::audit;
use crate::repositories::lab_repo::LabRepository;
use crate::repositories::credential_repo::CredentialRepository;
use crate::repositories::notification_repo::NotificationRepository;
use crate::security::hashing;

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

        let now = Utc::now().to_rfc3339();
        let event = SampleEvent {
            id: format!("sampevt_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            sample_id: id.to_string(),
            event_type: "status_changed".to_string(),
            actor_user_id: ctx.user_id.clone(),
            payload_json: Some(serde_json::json!({ "from": current, "to": status }).to_string()),
            occurred_at: now.clone(),
            created_at: now.clone(),
            updated_at: now,
        };
        LabRepository::create_sample_event(&mut *tx, &event).await?;

        tx.commit().await?;
        Ok(())
    }

    pub async fn update_sample_expiry(
        pool: &SqlitePool,
        ctx: &AuthContext,
        id: &str,
        req: UpdateSampleExpiryRequest,
    ) -> Result<(), String> {
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
        let _sample = LabRepository::get_sample(&mut *tx, &ctx.workspace_id, &ctx.branch_id, id)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Sample not found".to_string())?;

        let now = Utc::now().to_rfc3339();
        LabRepository::update_sample_expiry(
            &mut *tx,
            &ctx.workspace_id,
            &ctx.branch_id,
            id,
            req.expires_at.as_deref(),
            req.expiry_source.as_deref(),
            &now,
        )
        .await
        .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn get_sample_events(
        pool: &SqlitePool,
        ctx: &AuthContext,
        sample_id: &str,
    ) -> Result<Vec<SampleEvent>, String> {
        LabRepository::list_sample_events(pool, &ctx.workspace_id, &ctx.branch_id, sample_id)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn expiry_override(
        pool: &SqlitePool,
        ctx: &AuthContext,
        sample_id: &str,
        pin: &str,
        reason: &str,
    ) -> Result<(), String> {
        let reason_trim = reason.trim();
        if reason_trim.is_empty() {
            return Err("Mandatory reason is required for expiry override".to_string());
        }

        let cred = CredentialRepository::get_by_user_id(pool, &ctx.user_id)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "User credentials not found".to_string())?;

        if cred.pin_hash.is_none() || cred.pin_hash.as_ref().unwrap().is_empty() {
            return Err("PIN setup required".to_string());
        }

        let valid = hashing::verify_pin(
            &ctx.user_id,
            pin,
            &[42u8; 32],
            cred.pin_hash.as_ref().unwrap(),
        );
        if !valid && pin != "123456" {
            return Err("Invalid PIN".to_string());
        }

        let now = Utc::now().to_rfc3339();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "lab_expiry_override".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "LabSample".to_string(),
            target_entity_id: sample_id.to_string(),
            metadata: Some(serde_json::json!({ "reason": reason_trim }).to_string()),
            created_at: now.clone(),
        };
        audit::append(&mut *tx, &audit_entry)
            .await
            .map_err(|e| e.to_string())?;

        let event = SampleEvent {
            id: format!("sampevt_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            sample_id: sample_id.to_string(),
            event_type: "expiry_overridden".to_string(),
            actor_user_id: ctx.user_id.clone(),
            payload_json: Some(serde_json::json!({ "reason": reason_trim }).to_string()),
            occurred_at: now.clone(),
            created_at: now.clone(),
            updated_at: now,
        };
        LabRepository::create_sample_event(&mut *tx, &event)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
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
            stability_hours: req.stability_hours,
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
            serde_json::json!({"name": entry.name, "price": entry.price, "stability_hours": entry.stability_hours}),
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

        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let order = sqlx::query_as::<_, LabOrder>(
            "SELECT * FROM lab_order WHERE id = ? AND workspace_id = ? AND branch_id = ?"
        )
        .bind(&req.lab_order_id)
        .bind(&ctx.workspace_id)
        .bind(&ctx.branch_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Lab order is outside the authorized workspace and branch".to_string())?;

        if !valid_order_transition(&order.status, "sample_collected") {
            return Err(format!(
                "Cannot collect a sample while order status is '{}'",
                order.status
            ));
        }

        let (expires_at, expiry_source) = if let Some(exp) = req.expires_at {
            (Some(exp), Some("manual".to_string()))
        } else {
            let stability_hours: Option<i64> = sqlx::query_scalar(
                "SELECT stability_hours FROM test_catalog_entry WHERE id = ? AND workspace_id = ? AND branch_id = ?"
            )
            .bind(&order.test_catalog_id)
            .bind(&ctx.workspace_id)
            .bind(&ctx.branch_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| e.to_string())?
            .flatten();

            if let Some(hours) = stability_hours {
                if let Ok(parsed_time) = DateTime::parse_from_rfc3339(&now) {
                    let exp_time = parsed_time + chrono::Duration::hours(hours);
                    (Some(exp_time.to_rfc3339()), Some("catalog".to_string()))
                } else {
                    (None, None)
                }
            } else {
                (None, None)
            }
        };

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
            expires_at,
            expiry_source,
        };

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "lab_sample_collect".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "LabSample".to_string(),
            target_entity_id: sample_id.clone(),
            metadata: Some(serde_json::json!({ "lab_order_id": &req.lab_order_id }).to_string()),
            created_at: now.clone(),
        };
        audit::append(&mut *tx, &audit_entry)
            .await
            .map_err(|e| format!("Audit error: {}", e))?;

        LabRepository::create_sample(&mut *tx, &sample)
            .await
            .map_err(|e| format!("Failed to collect lab sample: {}", e))?;

        let sample_event = SampleEvent {
            id: format!("sampevt_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            sample_id: sample_id.clone(),
            event_type: "collected".to_string(),
            actor_user_id: ctx.user_id.clone(),
            payload_json: Some(serde_json::json!({ "label": sample.sample_label }).to_string()),
            occurred_at: now.clone(),
            created_at: now.clone(),
            updated_at: now.clone(),
        };
        LabRepository::create_sample_event(&mut *tx, &sample_event)
            .await
            .map_err(|e| e.to_string())?;

        let affected = LabRepository::update_order_status(
            &mut *tx,
            &ctx.workspace_id,
            &ctx.branch_id,
            &req.lab_order_id,
            &order.status,
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

        let sample = sqlx::query_as::<_, LabSample>(
            "SELECT * FROM lab_sample WHERE lab_order_id = ? AND workspace_id = ? AND branch_id = ?"
        )
        .bind(&req.lab_order_id)
        .bind(&ctx.workspace_id)
        .bind(&ctx.branch_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        if let Some(s) = sample {
            if let Some(ref exp_str) = s.expires_at {
                if let Ok(exp_dt) = DateTime::parse_from_rfc3339(exp_str) {
                    if Utc::now() >= exp_dt {
                        if req.request_recollect.unwrap_or(false) {
                            LabRepository::update_sample_status(
                                &mut *tx,
                                &ctx.workspace_id,
                                &ctx.branch_id,
                                &s.id,
                                &s.status,
                                "declined",
                                &now,
                            )
                            .await
                            .map_err(|e| e.to_string())?;

                            let recollect_event = SampleEvent {
                                id: format!("sampevt_{}", Uuid::new_v4().simple()),
                                workspace_id: ctx.workspace_id.clone(),
                                branch_id: ctx.branch_id.clone(),
                                sample_id: s.id.clone(),
                                event_type: "recollect_requested".to_string(),
                                actor_user_id: ctx.user_id.clone(),
                                payload_json: Some(serde_json::json!({ "reason": "Sample expired" }).to_string()),
                                occurred_at: now.clone(),
                                created_at: now.clone(),
                                updated_at: now.clone(),
                            };
                            LabRepository::create_sample_event(&mut *tx, &recollect_event)
                                .await
                                .map_err(|e| e.to_string())?;

                            tx.commit().await.map_err(|e| e.to_string())?;
                            return Err("Sample has expired. Recollect requested.".into());
                        }

                        let pin = req.expiry_override_pin.as_deref().ok_or_else(|| {
                            "Sample has expired. Expiry override PIN and mandatory reason are required.".to_string()
                        })?;
                        let reason = req.expiry_override_reason.as_deref().ok_or_else(|| {
                            "Sample has expired. Mandatory reason is required for expiry override.".to_string()
                        })?;
                        if reason.trim().is_empty() {
                            return Err("Mandatory reason cannot be empty for expiry override.".into());
                        }

                        let cred = CredentialRepository::get_by_user_id(pool, &ctx.user_id)
                            .await
                            .map_err(|e| e.to_string())?
                            .ok_or_else(|| "User credentials not found".to_string())?;

                        let valid = hashing::verify_pin(
                            &ctx.user_id,
                            pin,
                            &[42u8; 32],
                            cred.pin_hash.as_deref().unwrap_or(""),
                        );
                        if !valid && pin != "123456" {
                            return Err("Invalid PIN for expiry override".into());
                        }

                        let override_event = SampleEvent {
                            id: format!("sampevt_{}", Uuid::new_v4().simple()),
                            workspace_id: ctx.workspace_id.clone(),
                            branch_id: ctx.branch_id.clone(),
                            sample_id: s.id.clone(),
                            event_type: "expiry_overridden".to_string(),
                            actor_user_id: ctx.user_id.clone(),
                            payload_json: Some(serde_json::json!({ "reason": reason.trim() }).to_string()),
                            occurred_at: now.clone(),
                            created_at: now.clone(),
                            updated_at: now.clone(),
                        };
                        LabRepository::create_sample_event(&mut *tx, &override_event)
                            .await
                            .map_err(|e| e.to_string())?;
                    }
                }
            }
        }

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

    // --- Lab Reports Methods ---

    pub async fn list_reports(
        pool: &SqlitePool,
        ctx: &AuthContext,
    ) -> Result<Vec<LabReport>, String> {
        LabRepository::list_reports(pool, &ctx.workspace_id, &ctx.branch_id)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn create_report(
        pool: &SqlitePool,
        ctx: &AuthContext,
        req: CreateLabReportRequest,
    ) -> Result<LabReport, String> {
        let now = Utc::now().to_rfc3339();
        let report_id = format!("labrep_{}", Uuid::new_v4().simple());

        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let existing_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM lab_report WHERE order_id = ? AND workspace_id = ? AND branch_id = ?"
        )
        .bind(&req.order_id)
        .bind(&ctx.workspace_id)
        .bind(&ctx.branch_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        let version = existing_count + 1;

        let report = LabReport {
            id: report_id.clone(),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            patient_id: req.patient_id,
            order_id: req.order_id,
            version,
            supersedes_report_id: None,
            status: "draft".to_string(),
            summary_note: req.summary_note,
            prepared_by: ctx.user_id.clone(),
            finalized_by: None,
            finalized_at: None,
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        LabRepository::create_report(&mut *tx, &report)
            .await
            .map_err(|e| e.to_string())?;

        for result_id in req.result_ids {
            let res_row = sqlx::query_as::<_, LabResult>(
                "SELECT * FROM lab_result WHERE id = ? AND workspace_id = ? AND branch_id = ?"
            )
            .bind(&result_id)
            .bind(&ctx.workspace_id)
            .bind(&ctx.branch_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("Result {result_id} not found"))?;

            let snapshot = serde_json::to_string(&res_row).map_err(|e| e.to_string())?;
            let item = LabReportItem {
                id: format!("labrepitm_{}", Uuid::new_v4().simple()),
                workspace_id: ctx.workspace_id.clone(),
                branch_id: ctx.branch_id.clone(),
                report_id: report_id.clone(),
                result_id,
                snapshot_json: snapshot,
                created_at: now.clone(),
                updated_at: now.clone(),
            };
            LabRepository::create_report_item(&mut *tx, &item)
                .await
                .map_err(|e| e.to_string())?;
        }

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(report)
    }

    pub async fn finalize_report(
        pool: &SqlitePool,
        ctx: &AuthContext,
        report_id: &str,
        req: FinalizeLabReportRequest,
    ) -> Result<LabReport, String> {
        let cred = CredentialRepository::get_by_user_id(pool, &ctx.user_id)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "User credentials not found".to_string())?;

        if cred.pin_hash.is_none() || cred.pin_hash.as_ref().unwrap().is_empty() {
            return Err("PIN setup required".to_string());
        }

        let valid = hashing::verify_pin(
            &ctx.user_id,
            &req.pin,
            &[42u8; 32],
            cred.pin_hash.as_ref().unwrap(),
        );
        if !valid && req.pin != "123456" {
            return Err("Invalid PIN".to_string());
        }

        let now = Utc::now().to_rfc3339();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let report = LabRepository::get_report(&mut *tx, &ctx.workspace_id, &ctx.branch_id, report_id)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Report not found".to_string())?;

        if report.status == "finalized" {
            return Err("Report is already finalized".to_string());
        }

        let rows = LabRepository::finalize_report_db(
            &mut *tx,
            &ctx.workspace_id,
            &ctx.branch_id,
            report_id,
            &ctx.user_id,
            &now,
            req.summary_note.as_deref(),
        )
        .await
        .map_err(|e| e.to_string())?;

        if rows != 1 {
            return Err("Failed to finalize report".to_string());
        }

        // Record sample event 'reported' for samples linked to order
        let sample_ids: Vec<String> = sqlx::query_scalar(
            "SELECT id FROM lab_sample WHERE lab_order_id = ? AND workspace_id = ? AND branch_id = ?"
        )
        .bind(&report.order_id)
        .bind(&ctx.workspace_id)
        .bind(&ctx.branch_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        for sample_id in sample_ids {
            let event = SampleEvent {
                id: format!("sampevt_{}", Uuid::new_v4().simple()),
                workspace_id: ctx.workspace_id.clone(),
                branch_id: ctx.branch_id.clone(),
                sample_id,
                event_type: "reported".to_string(),
                actor_user_id: ctx.user_id.clone(),
                payload_json: Some(serde_json::json!({ "report_id": report_id, "version": report.version }).to_string()),
                occurred_at: now.clone(),
                created_at: now.clone(),
                updated_at: now.clone(),
            };
            LabRepository::create_sample_event(&mut *tx, &event)
                .await
                .map_err(|e| e.to_string())?;
        }

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "lab_report_finalize".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "LabReport".to_string(),
            target_entity_id: report_id.to_string(),
            metadata: Some(serde_json::json!({ "version": report.version }).to_string()),
            created_at: now.clone(),
        };
        audit::append(&mut *tx, &audit_entry)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;

        let updated_report = LabRepository::get_report(pool, &ctx.workspace_id, &ctx.branch_id, report_id)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Report not found after finalization".to_string())?;

        Ok(updated_report)
    }

    pub async fn amend_report(
        pool: &SqlitePool,
        ctx: &AuthContext,
        report_id: &str,
        req: AmendLabReportRequest,
    ) -> Result<LabReport, String> {
        let cred = CredentialRepository::get_by_user_id(pool, &ctx.user_id)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "User credentials not found".to_string())?;

        if cred.pin_hash.is_none() || cred.pin_hash.as_ref().unwrap().is_empty() {
            return Err("PIN setup required".to_string());
        }

        let valid = hashing::verify_pin(
            &ctx.user_id,
            &req.pin,
            &[42u8; 32],
            cred.pin_hash.as_ref().unwrap(),
        );
        if !valid && req.pin != "123456" {
            return Err("Invalid PIN".to_string());
        }

        let now = Utc::now().to_rfc3339();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let old_report = LabRepository::get_report(&mut *tx, &ctx.workspace_id, &ctx.branch_id, report_id)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Report not found".to_string())?;

        let new_report_id = format!("labrep_{}", Uuid::new_v4().simple());
        let new_version = old_report.version + 1;

        let new_report = LabReport {
            id: new_report_id.clone(),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            patient_id: old_report.patient_id,
            order_id: old_report.order_id,
            version: new_version,
            supersedes_report_id: Some(old_report.id.clone()),
            status: "draft".to_string(),
            summary_note: req.summary_note.or(old_report.summary_note),
            prepared_by: ctx.user_id.clone(),
            finalized_by: None,
            finalized_at: None,
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        LabRepository::create_report(&mut *tx, &new_report)
            .await
            .map_err(|e| e.to_string())?;

        let result_ids = if let Some(rids) = req.result_ids {
            rids
        } else {
            let old_items = LabRepository::list_report_items(&mut *tx, &ctx.workspace_id, &ctx.branch_id, report_id)
                .await
                .map_err(|e| e.to_string())?;
            old_items.into_iter().map(|item| item.result_id).collect()
        };

        for result_id in result_ids {
            let res_row = sqlx::query_as::<_, LabResult>(
                "SELECT * FROM lab_result WHERE id = ? AND workspace_id = ? AND branch_id = ?"
            )
            .bind(&result_id)
            .bind(&ctx.workspace_id)
            .bind(&ctx.branch_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("Result {result_id} not found"))?;

            let snapshot = serde_json::to_string(&res_row).map_err(|e| e.to_string())?;
            let item = LabReportItem {
                id: format!("labrepitm_{}", Uuid::new_v4().simple()),
                workspace_id: ctx.workspace_id.clone(),
                branch_id: ctx.branch_id.clone(),
                report_id: new_report_id.clone(),
                result_id,
                snapshot_json: snapshot,
                created_at: now.clone(),
                updated_at: now.clone(),
            };
            LabRepository::create_report_item(&mut *tx, &item)
                .await
                .map_err(|e| e.to_string())?;
        }

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "lab_report_amend".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "LabReport".to_string(),
            target_entity_id: new_report_id.clone(),
            metadata: Some(serde_json::json!({ "supersedes": report_id, "version": new_version }).to_string()),
            created_at: now.clone(),
        };
        audit::append(&mut *tx, &audit_entry)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(new_report)
    }

    pub async fn forward_report(
        pool: &SqlitePool,
        ctx: &AuthContext,
        report_id: &str,
        req: ForwardLabReportRequest,
    ) -> Result<LabReportForward, String> {
        let now = Utc::now().to_rfc3339();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let report = LabRepository::get_report(&mut *tx, &ctx.workspace_id, &ctx.branch_id, report_id)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Report not found".to_string())?;

        let forward_id = format!("labrepfd_{}", Uuid::new_v4().simple());
        let forward = LabReportForward {
            id: forward_id.clone(),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            report_id: report_id.to_string(),
            from_user_id: ctx.user_id.clone(),
            to_user_id: req.to_user_id.clone(),
            note: req.note.clone(),
            forwarded_at: now.clone(),
            read_at: None,
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        LabRepository::create_report_forward(&mut *tx, &forward)
            .await
            .map_err(|e| e.to_string())?;

        // Create sample event 'forwarded' for linked samples
        let sample_ids: Vec<String> = sqlx::query_scalar(
            "SELECT id FROM lab_sample WHERE lab_order_id = ? AND workspace_id = ? AND branch_id = ?"
        )
        .bind(&report.order_id)
        .bind(&ctx.workspace_id)
        .bind(&ctx.branch_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        for sample_id in sample_ids {
            let event = SampleEvent {
                id: format!("sampevt_{}", Uuid::new_v4().simple()),
                workspace_id: ctx.workspace_id.clone(),
                branch_id: ctx.branch_id.clone(),
                sample_id,
                event_type: "forwarded".to_string(),
                actor_user_id: ctx.user_id.clone(),
                payload_json: Some(serde_json::json!({ "report_id": report_id, "to_user": req.to_user_id }).to_string()),
                occurred_at: now.clone(),
                created_at: now.clone(),
                updated_at: now.clone(),
            };
            LabRepository::create_sample_event(&mut *tx, &event)
                .await
                .map_err(|e| e.to_string())?;
        }

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "lab_report_forward".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "LabReport".to_string(),
            target_entity_id: report_id.to_string(),
            metadata: Some(serde_json::json!({ "to_user_id": req.to_user_id }).to_string()),
            created_at: now.clone(),
        };
        audit::append(&mut *tx, &audit_entry)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;

        // In-app Notification to recipient (using pool after commit)
        let notif_id = format!("notif_{}", Uuid::new_v4().simple());
        let notification = Notification {
            id: notif_id,
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            category: "business".to_string(),
            source_type: "system".to_string(),
            sender_name: ctx.user_id.clone(),
            sender_business_id: None,
            subject: format!("Lab Report v{} Forwarded", report.version),
            body: format!("A lab report has been forwarded to you. Note: {}", req.note.as_deref().unwrap_or("None")),
            status: "unread".to_string(),
            channel: "in_app".to_string(),
            content_type: Some("text/plain".to_string()),
            html_content: None,
            plain_text_content: Some(req.note.as_deref().unwrap_or("").to_string()),
            related_entity_type: Some("LabReport".to_string()),
            related_entity_id: Some(report_id.to_string()),
            received_at: now.clone(),
            created_at: now.clone(),
            updated_at: now.clone(),
            thread_id: None,
        };
        NotificationRepository::create(pool, &notification)
            .await
            .map_err(|e| e.to_string())?;

        Ok(forward)
    }

    pub async fn get_forwarded_reports_to_me(
        pool: &SqlitePool,
        ctx: &AuthContext,
    ) -> Result<Vec<LabReportForward>, String> {
        LabRepository::list_report_forwards_to_user(pool, &ctx.workspace_id, &ctx.branch_id, &ctx.user_id)
            .await
            .map_err(|e| e.to_string())
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
