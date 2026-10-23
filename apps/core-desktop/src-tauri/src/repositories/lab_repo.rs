use crate::models::inventory::{InventoryItem, Medicine, MedicineWithInventory};
use crate::models::lab::{
    LabOrder, LabQcData, LabQcEquipment, LabQcRecord, LabResult, LabSample, SampleEvent, TestCatalogEntry,
    LabReport, LabReportItem, LabReportForward, LabWorkflowRunDb, LabWorkflowRunStepDb, LabStageAttachmentDb,
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

    pub async fn get_sample(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        workspace_id: &str,
        branch_id: &str,
        id: &str,
    ) -> Result<Option<LabSample>, sqlx::Error> {
        sqlx::query_as::<_, LabSample>(
            "SELECT * FROM lab_sample WHERE workspace_id = ? AND branch_id = ? AND id = ?"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(id)
        .fetch_optional(executor)
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
                collected_at, sample_label, status, expires_at, expiry_source, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        .bind(&sample.expires_at)
        .bind(&sample.expiry_source)
        .bind(&sample.created_at)
        .bind(&sample.updated_at)
        .execute(executor)
        .await?;

        Ok(())
    }

    pub async fn update_sample_expiry(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        workspace_id: &str,
        branch_id: &str,
        id: &str,
        expires_at: Option<&str>,
        expiry_source: Option<&str>,
        updated_at: &str,
    ) -> Result<u64, sqlx::Error> {
        sqlx::query(
            "UPDATE lab_sample SET expires_at = ?, expiry_source = ?, updated_at = ? WHERE workspace_id = ? AND branch_id = ? AND id = ?"
        )
        .bind(expires_at)
        .bind(expiry_source)
        .bind(updated_at)
        .bind(workspace_id)
        .bind(branch_id)
        .bind(id)
        .execute(executor)
        .await
        .map(|res| res.rows_affected())
    }

    pub async fn create_sample_event(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        event: &SampleEvent,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO sample_event (
                id, workspace_id, branch_id, sample_id, event_type,
                actor_user_id, payload_json, occurred_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&event.id)
        .bind(&event.workspace_id)
        .bind(&event.branch_id)
        .bind(&event.sample_id)
        .bind(&event.event_type)
        .bind(&event.actor_user_id)
        .bind(&event.payload_json)
        .bind(&event.occurred_at)
        .bind(&event.created_at)
        .bind(&event.updated_at)
        .execute(executor)
        .await?;
        Ok(())
    }

    pub async fn list_sample_events(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
        sample_id: &str,
    ) -> Result<Vec<SampleEvent>, sqlx::Error> {
        sqlx::query_as::<_, SampleEvent>(
            "SELECT * FROM sample_event WHERE workspace_id = ? AND branch_id = ? AND sample_id = ? ORDER BY occurred_at ASC"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(sample_id)
        .fetch_all(pool)
        .await
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
        sqlx::query("INSERT INTO test_catalog_entry (id, workspace_id, branch_id, name, category, reference_range, price, stability_hours, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&entry.id).bind(&entry.workspace_id).bind(&entry.branch_id).bind(&entry.name).bind(&entry.category)
            .bind(&entry.reference_range).bind(entry.price).bind(entry.stability_hours).bind(&entry.created_at).bind(&entry.updated_at).execute(executor).await?;
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

    // --- Lab Reports Repository Methods ---

    pub async fn list_reports(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
    ) -> Result<Vec<LabReport>, sqlx::Error> {
        sqlx::query_as::<_, LabReport>(
            "SELECT * FROM lab_report WHERE workspace_id = ? AND branch_id = ? ORDER BY created_at DESC"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .fetch_all(pool)
        .await
    }

    pub async fn get_report(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        workspace_id: &str,
        branch_id: &str,
        id: &str,
    ) -> Result<Option<LabReport>, sqlx::Error> {
        sqlx::query_as::<_, LabReport>(
            "SELECT * FROM lab_report WHERE workspace_id = ? AND branch_id = ? AND id = ?"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(id)
        .fetch_optional(executor)
        .await
    }

    pub async fn create_report(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        report: &LabReport,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO lab_report (
                id, workspace_id, branch_id, patient_id, order_id, version,
                supersedes_report_id, status, summary_note, prepared_by,
                finalized_by, finalized_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&report.id)
        .bind(&report.workspace_id)
        .bind(&report.branch_id)
        .bind(&report.patient_id)
        .bind(&report.order_id)
        .bind(report.version)
        .bind(&report.supersedes_report_id)
        .bind(&report.status)
        .bind(&report.summary_note)
        .bind(&report.prepared_by)
        .bind(&report.finalized_by)
        .bind(&report.finalized_at)
        .bind(&report.created_at)
        .bind(&report.updated_at)
        .execute(executor)
        .await?;
        Ok(())
    }

    pub async fn finalize_report_db(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        workspace_id: &str,
        branch_id: &str,
        id: &str,
        finalized_by: &str,
        finalized_at: &str,
        summary_note: Option<&str>,
    ) -> Result<u64, sqlx::Error> {
        sqlx::query(
            "UPDATE lab_report SET status = 'finalized', finalized_by = ?, finalized_at = ?, summary_note = COALESCE(?, summary_note), updated_at = ? WHERE workspace_id = ? AND branch_id = ? AND id = ? AND status = 'draft'"
        )
        .bind(finalized_by)
        .bind(finalized_at)
        .bind(summary_note)
        .bind(finalized_at)
        .bind(workspace_id)
        .bind(branch_id)
        .bind(id)
        .execute(executor)
        .await
        .map(|res| res.rows_affected())
    }

    pub async fn create_report_item(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        item: &LabReportItem,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO lab_report_item (
                id, workspace_id, branch_id, report_id, result_id, snapshot_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&item.id)
        .bind(&item.workspace_id)
        .bind(&item.branch_id)
        .bind(&item.report_id)
        .bind(&item.result_id)
        .bind(&item.snapshot_json)
        .bind(&item.created_at)
        .bind(&item.updated_at)
        .execute(executor)
        .await?;
        Ok(())
    }

    pub async fn list_report_items(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        workspace_id: &str,
        branch_id: &str,
        report_id: &str,
    ) -> Result<Vec<LabReportItem>, sqlx::Error> {
        sqlx::query_as::<_, LabReportItem>(
            "SELECT * FROM lab_report_item WHERE workspace_id = ? AND branch_id = ? AND report_id = ?"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(report_id)
        .fetch_all(executor)
        .await
    }

    pub async fn create_report_forward(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        forward: &LabReportForward,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO lab_report_forward (
                id, workspace_id, branch_id, report_id, from_user_id, to_user_id,
                note, forwarded_at, read_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&forward.id)
        .bind(&forward.workspace_id)
        .bind(&forward.branch_id)
        .bind(&forward.report_id)
        .bind(&forward.from_user_id)
        .bind(&forward.to_user_id)
        .bind(&forward.note)
        .bind(&forward.forwarded_at)
        .bind(&forward.read_at)
        .bind(&forward.created_at)
        .bind(&forward.updated_at)
        .execute(executor)
        .await?;
        Ok(())
    }

    pub async fn list_report_forwards_to_user(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
        to_user_id: &str,
    ) -> Result<Vec<LabReportForward>, sqlx::Error> {
        sqlx::query_as::<_, LabReportForward>(
            "SELECT * FROM lab_report_forward WHERE workspace_id = ? AND branch_id = ? AND to_user_id = ? ORDER BY forwarded_at DESC"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(to_user_id)
        .fetch_all(pool)
        .await
    }

    pub async fn create_workflow_run(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        run: &LabWorkflowRunDb,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO lab_workflow_run (
                id, workspace_id, branch_id, order_id, template_id, template_version, state, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&run.id)
        .bind(&run.workspace_id)
        .bind(&run.branch_id)
        .bind(&run.order_id)
        .bind(&run.template_id)
        .bind(run.template_version)
        .bind(&run.state)
        .bind(&run.created_at)
        .bind(&run.updated_at)
        .execute(executor)
        .await?;
        Ok(())
    }

    pub async fn create_workflow_run_step(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        step: &LabWorkflowRunStepDb,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO lab_workflow_run_step (
                id, workspace_id, branch_id, run_id, node_id, status, completed_by, completed_at, block_reason, notes, measurements_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&step.id)
        .bind(&step.workspace_id)
        .bind(&step.branch_id)
        .bind(&step.run_id)
        .bind(&step.node_id)
        .bind(&step.status)
        .bind(&step.completed_by)
        .bind(&step.completed_at)
        .bind(&step.block_reason)
        .bind(&step.notes)
        .bind(&step.measurements_json)
        .bind(&step.created_at)
        .bind(&step.updated_at)
        .execute(executor)
        .await?;
        Ok(())
    }

    pub async fn get_workflow_run(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
        run_id: &str,
    ) -> Result<Option<LabWorkflowRunDb>, sqlx::Error> {
        sqlx::query_as::<_, LabWorkflowRunDb>(
            "SELECT * FROM lab_workflow_run WHERE workspace_id = ? AND branch_id = ? AND id = ?"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(run_id)
        .fetch_optional(pool)
        .await
    }

    pub async fn get_workflow_run_by_order(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
        order_id: &str,
    ) -> Result<Option<LabWorkflowRunDb>, sqlx::Error> {
        sqlx::query_as::<_, LabWorkflowRunDb>(
            "SELECT * FROM lab_workflow_run WHERE workspace_id = ? AND branch_id = ? AND order_id = ?"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(order_id)
        .fetch_optional(pool)
        .await
    }

    pub async fn list_workflow_run_steps(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
        run_id: &str,
    ) -> Result<Vec<LabWorkflowRunStepDb>, sqlx::Error> {
        sqlx::query_as::<_, LabWorkflowRunStepDb>(
            "SELECT * FROM lab_workflow_run_step WHERE workspace_id = ? AND branch_id = ? AND run_id = ?"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(run_id)
        .fetch_all(pool)
        .await
    }

    pub async fn update_workflow_run_step(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        workspace_id: &str,
        branch_id: &str,
        run_id: &str,
        node_id: &str,
        status: &str,
        completed_by: Option<&str>,
        completed_at: Option<&str>,
        notes: Option<&str>,
        measurements_json: Option<&str>,
        updated_at: &str,
    ) -> Result<u64, sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE lab_workflow_run_step
            SET status = ?, completed_by = ?, completed_at = ?, notes = ?, measurements_json = ?, updated_at = ?
            WHERE workspace_id = ? AND branch_id = ? AND run_id = ? AND node_id = ?
            "#,
        )
        .bind(status)
        .bind(completed_by)
        .bind(completed_at)
        .bind(notes)
        .bind(measurements_json)
        .bind(updated_at)
        .bind(workspace_id)
        .bind(branch_id)
        .bind(run_id)
        .bind(node_id)
        .execute(executor)
        .await
        .map(|res| res.rows_affected())
    }

    pub async fn update_workflow_run_state(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        workspace_id: &str,
        branch_id: &str,
        run_id: &str,
        state: &str,
        updated_at: &str,
    ) -> Result<u64, sqlx::Error> {
        sqlx::query(
            "UPDATE lab_workflow_run SET state = ?, updated_at = ? WHERE workspace_id = ? AND branch_id = ? AND id = ?"
        )
        .bind(state)
        .bind(updated_at)
        .bind(workspace_id)
        .bind(branch_id)
        .bind(run_id)
        .execute(executor)
        .await
        .map(|res| res.rows_affected())
    }

    pub async fn create_stage_attachment(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        attachment: &LabStageAttachmentDb,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO lab_stage_attachment (
                id, workspace_id, branch_id, run_id, node_id, sample_id,
                original_filename, storage_path, mime_type, file_size,
                uploaded_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&attachment.id)
        .bind(&attachment.workspace_id)
        .bind(&attachment.branch_id)
        .bind(&attachment.run_id)
        .bind(&attachment.node_id)
        .bind(&attachment.sample_id)
        .bind(&attachment.original_filename)
        .bind(&attachment.storage_path)
        .bind(&attachment.mime_type)
        .bind(attachment.file_size)
        .bind(&attachment.uploaded_by)
        .bind(&attachment.created_at)
        .bind(&attachment.updated_at)
        .execute(executor)
        .await?;
        Ok(())
    }

    pub async fn list_stage_attachments(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
        run_id: &str,
        node_id: &str,
    ) -> Result<Vec<LabStageAttachmentDb>, sqlx::Error> {
        sqlx::query_as::<_, LabStageAttachmentDb>(
            "SELECT * FROM lab_stage_attachment WHERE workspace_id = ? AND branch_id = ? AND run_id = ? AND node_id = ? ORDER BY created_at DESC"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(run_id)
        .bind(node_id)
        .fetch_all(pool)
        .await
    }

    pub async fn list_all_stage_attachments_for_run(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
        run_id: &str,
    ) -> Result<Vec<LabStageAttachmentDb>, sqlx::Error> {
        sqlx::query_as::<_, LabStageAttachmentDb>(
            "SELECT * FROM lab_stage_attachment WHERE workspace_id = ? AND branch_id = ? AND run_id = ? ORDER BY created_at DESC"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(run_id)
        .fetch_all(pool)
        .await
    }

    pub async fn get_stage_attachment(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
        attachment_id: &str,
    ) -> Result<Option<LabStageAttachmentDb>, sqlx::Error> {
        sqlx::query_as::<_, LabStageAttachmentDb>(
            "SELECT * FROM lab_stage_attachment WHERE workspace_id = ? AND branch_id = ? AND id = ?"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(attachment_id)
        .fetch_optional(pool)
        .await
    }

    pub async fn delete_stage_attachment(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        workspace_id: &str,
        branch_id: &str,
        attachment_id: &str,
    ) -> Result<u64, sqlx::Error> {
        sqlx::query(
            "DELETE FROM lab_stage_attachment WHERE workspace_id = ? AND branch_id = ? AND id = ?"
        )
        .bind(workspace_id)
        .bind(branch_id)
        .bind(attachment_id)
        .execute(executor)
        .await
        .map(|res| res.rows_affected())
    }
}

