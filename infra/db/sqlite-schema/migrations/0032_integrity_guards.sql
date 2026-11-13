-- Database-level tenant ownership guards for local synchronized/business records.

-- Existing ownership values are preserved. Ownership changes must use an explicit migration/transfer workflow.

CREATE TRIGGER trg_branch_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON branch
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'branch workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_owner_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON owner
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'owner workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_app_user_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON app_user
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'app_user workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_paired_device_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON paired_device
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'paired_device workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_staff_notifications_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON staff_notifications
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'staff_notifications workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_customer_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON customer
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'customer workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_medicine_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON medicine
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'medicine workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_inventory_item_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON inventory_item
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'inventory_item workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_stock_adjustment_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON stock_adjustment
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'stock_adjustment workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_sale_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON sale
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'sale workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_fiscal_receipt_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON fiscal_receipt
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'fiscal_receipt workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_test_catalog_entry_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON test_catalog_entry
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'test_catalog_entry workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_lab_sample_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON lab_sample
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'lab_sample workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_lab_result_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON lab_result
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'lab_result workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_supplier_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON supplier
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'supplier workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_purchase_order_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON purchase_order
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'purchase_order workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_audit_log_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON audit_log
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'audit_log workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_lab_order_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON lab_order
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'lab_order workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_supplier_follows_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON supplier_follows
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'supplier_follows workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_notifications_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON notifications
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'notifications workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_schedules_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON schedules
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'schedules workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_notification_messages_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON notification_messages
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'notification_messages workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_recovery_code_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON recovery_code
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'recovery_code workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_bound_device_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON bound_device
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'bound_device workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_permission_grant_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON permission_grant
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'permission_grant workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_user_credential_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON user_credential
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'user_credential workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_integrations_config_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON integrations_config
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'integrations_config workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_lab_qc_equipment_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON lab_qc_equipment
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'lab_qc_equipment workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_lab_qc_record_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON lab_qc_record
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'lab_qc_record workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_message_attachments_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON message_attachments
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'message_attachments workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_business_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON business
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'business workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_partner_facility_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON partner_facility
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'partner_facility workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_thread_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON thread
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'thread workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_threads_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON threads
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'threads workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_dispensing_instruction_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON dispensing_instruction
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'dispensing_instruction workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_schedule_attachments_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON schedule_attachments
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'schedule_attachments workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_sample_event_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON sample_event
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'sample_event workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_lab_report_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON lab_report
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'lab_report workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_lab_report_item_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON lab_report_item
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'lab_report_item workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_lab_report_forward_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON lab_report_forward
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'lab_report_forward workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_followed_suppliers_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON followed_suppliers
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'followed_suppliers workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_supplier_carts_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON supplier_carts
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'supplier_carts workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_supplier_cart_lines_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON supplier_cart_lines
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'supplier_cart_lines workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_purchase_orders_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON purchase_orders
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'purchase_orders workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_purchase_order_lines_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON purchase_order_lines
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'purchase_order_lines workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_outbox_orders_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON outbox_orders
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'outbox_orders workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_supplier_cache_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON supplier_cache
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'supplier_cache workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_catalog_cache_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON catalog_cache
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'catalog_cache workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_lab_workflow_run_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON lab_workflow_run
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'lab_workflow_run workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_lab_workflow_run_step_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON lab_workflow_run_step
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'lab_workflow_run_step workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_lab_stage_attachment_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON lab_stage_attachment
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'lab_stage_attachment workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_price_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON price
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'price workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_price_history_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON price_history
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'price_history workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_daily_summary_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON daily_summary
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'daily_summary workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_sync_outbox_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON sync_outbox
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'sync_outbox workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_user_totp_scope_immutable
BEFORE UPDATE OF workspace_id, branch_id ON user_totp
WHEN OLD.workspace_id <> NEW.workspace_id OR OLD.branch_id <> NEW.branch_id
BEGIN
  SELECT RAISE(ABORT, 'user_totp workspace/branch ownership is immutable');
END;

CREATE TRIGGER trg_branch_business_id_scope_insert
BEFORE INSERT ON branch
WHEN NEW.business_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM business p WHERE p.business_id = NEW.business_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'branch.business_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_branch_business_id_scope_update
BEFORE UPDATE ON branch
WHEN NEW.business_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM business p WHERE p.business_id = NEW.business_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'branch.business_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_app_user_owner_id_scope_insert
BEFORE INSERT ON app_user
WHEN NEW.owner_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM owner p WHERE p.id = NEW.owner_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'app_user.owner_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_app_user_owner_id_scope_update
BEFORE UPDATE ON app_user
WHEN NEW.owner_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM owner p WHERE p.id = NEW.owner_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'app_user.owner_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_paired_device_user_id_scope_insert
BEFORE INSERT ON paired_device
WHEN NEW.user_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM app_user p WHERE p.id = NEW.user_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'paired_device.user_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_paired_device_user_id_scope_update
BEFORE UPDATE ON paired_device
WHEN NEW.user_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM app_user p WHERE p.id = NEW.user_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'paired_device.user_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_inventory_item_medicine_id_scope_insert
BEFORE INSERT ON inventory_item
WHEN NEW.medicine_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM medicine p WHERE p.id = NEW.medicine_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'inventory_item.medicine_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_inventory_item_medicine_id_scope_update
BEFORE UPDATE ON inventory_item
WHEN NEW.medicine_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM medicine p WHERE p.id = NEW.medicine_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'inventory_item.medicine_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_sale_customer_id_scope_insert
BEFORE INSERT ON sale
WHEN NEW.customer_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM customer p WHERE p.id = NEW.customer_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'sale.customer_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_sale_customer_id_scope_update
BEFORE UPDATE ON sale
WHEN NEW.customer_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM customer p WHERE p.id = NEW.customer_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'sale.customer_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_order_customer_id_scope_insert
BEFORE INSERT ON lab_order
WHEN NEW.customer_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM customer p WHERE p.id = NEW.customer_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_order.customer_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_order_customer_id_scope_update
BEFORE UPDATE ON lab_order
WHEN NEW.customer_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM customer p WHERE p.id = NEW.customer_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_order.customer_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_order_sale_id_scope_insert
BEFORE INSERT ON lab_order
WHEN NEW.sale_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM sale p WHERE p.id = NEW.sale_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_order.sale_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_order_sale_id_scope_update
BEFORE UPDATE ON lab_order
WHEN NEW.sale_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM sale p WHERE p.id = NEW.sale_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_order.sale_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_order_ordered_by_user_id_scope_insert
BEFORE INSERT ON lab_order
WHEN NEW.ordered_by_user_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM app_user p WHERE p.id = NEW.ordered_by_user_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_order.ordered_by_user_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_order_ordered_by_user_id_scope_update
BEFORE UPDATE ON lab_order
WHEN NEW.ordered_by_user_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM app_user p WHERE p.id = NEW.ordered_by_user_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_order.ordered_by_user_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_order_test_catalog_id_scope_insert
BEFORE INSERT ON lab_order
WHEN NEW.test_catalog_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM test_catalog_entry p WHERE p.id = NEW.test_catalog_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_order.test_catalog_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_order_test_catalog_id_scope_update
BEFORE UPDATE ON lab_order
WHEN NEW.test_catalog_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM test_catalog_entry p WHERE p.id = NEW.test_catalog_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_order.test_catalog_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_sample_lab_order_id_scope_insert
BEFORE INSERT ON lab_sample
WHEN NEW.lab_order_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_order p WHERE p.id = NEW.lab_order_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_sample.lab_order_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_sample_lab_order_id_scope_update
BEFORE UPDATE ON lab_sample
WHEN NEW.lab_order_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_order p WHERE p.id = NEW.lab_order_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_sample.lab_order_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_sample_collected_by_user_id_scope_insert
BEFORE INSERT ON lab_sample
WHEN NEW.collected_by_user_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM app_user p WHERE p.id = NEW.collected_by_user_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_sample.collected_by_user_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_sample_collected_by_user_id_scope_update
BEFORE UPDATE ON lab_sample
WHEN NEW.collected_by_user_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM app_user p WHERE p.id = NEW.collected_by_user_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_sample.collected_by_user_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_result_lab_order_id_scope_insert
BEFORE INSERT ON lab_result
WHEN NEW.lab_order_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_order p WHERE p.id = NEW.lab_order_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_result.lab_order_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_result_lab_order_id_scope_update
BEFORE UPDATE ON lab_result
WHEN NEW.lab_order_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_order p WHERE p.id = NEW.lab_order_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_result.lab_order_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_result_entered_by_user_id_scope_insert
BEFORE INSERT ON lab_result
WHEN NEW.entered_by_user_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM app_user p WHERE p.id = NEW.entered_by_user_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_result.entered_by_user_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_result_entered_by_user_id_scope_update
BEFORE UPDATE ON lab_result
WHEN NEW.entered_by_user_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM app_user p WHERE p.id = NEW.entered_by_user_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_result.entered_by_user_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_report_order_id_scope_insert
BEFORE INSERT ON lab_report
WHEN NEW.order_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_order p WHERE p.id = NEW.order_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_report.order_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_report_order_id_scope_update
BEFORE UPDATE ON lab_report
WHEN NEW.order_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_order p WHERE p.id = NEW.order_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_report.order_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_report_patient_id_scope_insert
BEFORE INSERT ON lab_report
WHEN NEW.patient_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM customer p WHERE p.id = NEW.patient_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_report.patient_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_report_patient_id_scope_update
BEFORE UPDATE ON lab_report
WHEN NEW.patient_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM customer p WHERE p.id = NEW.patient_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_report.patient_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_qc_record_equipment_id_scope_insert
BEFORE INSERT ON lab_qc_record
WHEN NEW.equipment_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_qc_equipment p WHERE p.id = NEW.equipment_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_qc_record.equipment_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_qc_record_equipment_id_scope_update
BEFORE UPDATE ON lab_qc_record
WHEN NEW.equipment_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_qc_equipment p WHERE p.id = NEW.equipment_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_qc_record.equipment_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_qc_record_performed_by_user_id_scope_insert
BEFORE INSERT ON lab_qc_record
WHEN NEW.performed_by_user_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM app_user p WHERE p.id = NEW.performed_by_user_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_qc_record.performed_by_user_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_qc_record_performed_by_user_id_scope_update
BEFORE UPDATE ON lab_qc_record
WHEN NEW.performed_by_user_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM app_user p WHERE p.id = NEW.performed_by_user_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_qc_record.performed_by_user_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_stage_attachment_run_id_scope_insert
BEFORE INSERT ON lab_stage_attachment
WHEN NEW.run_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_workflow_run p WHERE p.id = NEW.run_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_stage_attachment.run_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_stage_attachment_run_id_scope_update
BEFORE UPDATE ON lab_stage_attachment
WHEN NEW.run_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_workflow_run p WHERE p.id = NEW.run_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_stage_attachment.run_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_workflow_run_step_run_id_scope_insert
BEFORE INSERT ON lab_workflow_run_step
WHEN NEW.run_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_workflow_run p WHERE p.id = NEW.run_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_workflow_run_step.run_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_lab_workflow_run_step_run_id_scope_update
BEFORE UPDATE ON lab_workflow_run_step
WHEN NEW.run_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_workflow_run p WHERE p.id = NEW.run_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'lab_workflow_run_step.run_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_sample_event_sample_id_scope_insert
BEFORE INSERT ON sample_event
WHEN NEW.sample_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_sample p WHERE p.id = NEW.sample_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'sample_event.sample_id must reference a record in the same workspace and branch');
END;

CREATE TRIGGER trg_sample_event_sample_id_scope_update
BEFORE UPDATE ON sample_event
WHEN NEW.sample_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM lab_sample p WHERE p.id = NEW.sample_id
    AND p.workspace_id = NEW.workspace_id AND p.branch_id = NEW.branch_id
)
BEGIN
  SELECT RAISE(ABORT, 'sample_event.sample_id must reference a record in the same workspace and branch');
END;
