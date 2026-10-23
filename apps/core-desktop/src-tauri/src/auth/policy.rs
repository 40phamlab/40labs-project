use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CommandPolicy {
    Public,
    SessionOnly,
    Permission(&'static str),
}

pub fn get_command_policy_map() -> HashMap<&'static str, CommandPolicy> {
    let mut map = HashMap::new();
    map.insert("system_health_check", CommandPolicy::Public);
    map.insert("frontend_log", CommandPolicy::Public);
    map.insert("auth_status", CommandPolicy::Public);
    map.insert("auth_login", CommandPolicy::Public);
    map.insert("auth_logout", CommandPolicy::SessionOnly);
    map.insert("auth_lock", CommandPolicy::SessionOnly);
    map.insert("auth_unlock_pin", CommandPolicy::SessionOnly);
    map.insert("auth_set_pin", CommandPolicy::SessionOnly);
    map.insert("auth_step_up", CommandPolicy::SessionOnly);
    map.insert("auth_list_approvers", CommandPolicy::SessionOnly);
    map.insert("auth_change_password", CommandPolicy::SessionOnly);
    map.insert("auth_change_pin", CommandPolicy::SessionOnly);
    map.insert("auth_reset_own_pin", CommandPolicy::SessionOnly);

    map.insert("user_list", CommandPolicy::Permission("users.manage"));
    map.insert("user_create", CommandPolicy::Permission("users.manage"));
    map.insert("user_update", CommandPolicy::Permission("users.manage"));
    map.insert("user_set_active", CommandPolicy::Permission("users.manage"));
    map.insert(
        "user_reset_credentials",
        CommandPolicy::Permission("users.manage"),
    );

    map.insert("recovery_redeem", CommandPolicy::Public);
    map.insert(
        "recovery_regenerate",
        CommandPolicy::Permission("users.manage"),
    );
    map.insert(
        "recovery_generate_initial",
        CommandPolicy::Permission("users.manage"),
    );

    map.insert("registration_commit", CommandPolicy::Public);
    map.insert("otp_request", CommandPolicy::Public);
    map.insert("otp_verify", CommandPolicy::Public);

    map.insert("onboarding_advance", CommandPolicy::SessionOnly);
    map.insert(
        "business_set_idle_lock",
        CommandPolicy::Permission("settings.manage:idle"),
    );

    map.insert(
        "get_inventory_list",
        CommandPolicy::Permission("inventory.view"),
    );
    map.insert(
        "get_inventory_item",
        CommandPolicy::Permission("inventory.view"),
    );
    map.insert(
        "create_stock_item",
        CommandPolicy::Permission("inventory.create"),
    );
    map.insert(
        "record_stock_action",
        CommandPolicy::Permission("inventory.create"),
    );

    map.insert(
        "get_customers_list",
        CommandPolicy::Permission("customers.view"),
    );
    map.insert("get_customer", CommandPolicy::Permission("customers.view"));
    map.insert(
        "create_customer",
        CommandPolicy::Permission("customers.edit"),
    );
    map.insert(
        "update_customer",
        CommandPolicy::Permission("customers.edit"),
    );

    map.insert("get_sales_list", CommandPolicy::SessionOnly);
    map.insert("create_sale", CommandPolicy::Permission("sales.create"));
    map.insert("get_fiscal_receipts", CommandPolicy::SessionOnly);

    map.insert("get_purchase_orders", CommandPolicy::SessionOnly);
    map.insert("get_suppliers", CommandPolicy::SessionOnly);
    map.insert("create_purchase_order", CommandPolicy::SessionOnly);
    map.insert(
        "approve_purchase_order",
        CommandPolicy::Permission("purchases.approve"),
    );

    map.insert("get_lab_orders", CommandPolicy::SessionOnly);
    map.insert("create_lab_order", CommandPolicy::Permission("lab.order"));
    map.insert(
        "update_lab_order_status",
        CommandPolicy::Permission("lab.order"),
    );
    map.insert("get_lab_samples", CommandPolicy::SessionOnly);
    map.insert("collect_lab_sample", CommandPolicy::Permission("lab.order"));
    map.insert(
        "update_lab_sample_status",
        CommandPolicy::Permission("lab.result.enter"),
    );
    map.insert("update_sample_expiry", CommandPolicy::Permission("lab.order"));
    map.insert("get_sample_events", CommandPolicy::SessionOnly);
    map.insert("expiry_override", CommandPolicy::Permission("lab.result.enter"));

    map.insert(
        "get_audit_logs",
        CommandPolicy::Permission("reports.compliance"),
    );

    map.insert("get_notifications", CommandPolicy::SessionOnly);
    map.insert("get_notification_messages", CommandPolicy::SessionOnly);
    map.insert("send_notification_message", CommandPolicy::SessionOnly);
    map.insert("create_notification", CommandPolicy::SessionOnly);
    map.insert("mark_notification_read", CommandPolicy::SessionOnly);
    map.insert("archive_notification", CommandPolicy::SessionOnly);
    map.insert("save_attachment", CommandPolicy::SessionOnly);
    map.insert("export_attachment", CommandPolicy::SessionOnly);
    map.insert("resolve_attachment_path", CommandPolicy::SessionOnly);
    map.insert("save_bytes_to_documents", CommandPolicy::SessionOnly);
    map.insert("export_attachment_to_path", CommandPolicy::SessionOnly);

    map.insert("get_business", CommandPolicy::SessionOnly);
    map.insert("upload_business_logo", CommandPolicy::SessionOnly);
    map.insert(
        "update_business",
        CommandPolicy::Permission("settings.manage"),
    );
    map.insert("get_integrations_config", CommandPolicy::SessionOnly);
    map.insert(
        "update_integrations_config",
        CommandPolicy::Permission("settings.manage"),
    );

    map.insert("get_lab_results", CommandPolicy::SessionOnly);
    map.insert("get_test_catalog", CommandPolicy::SessionOnly);
    map.insert("get_lab_stock", CommandPolicy::SessionOnly);
    map.insert("get_lab_qc_data", CommandPolicy::SessionOnly);
    map.insert("create_test_catalog_entry", CommandPolicy::Permission("lab.order"));
    map.insert("create_lab_qc_equipment", CommandPolicy::Permission("lab.order"));
    map.insert("create_lab_qc_record", CommandPolicy::Permission("lab.result.enter"));
    map.insert(
        "enter_lab_result",
        CommandPolicy::Permission("lab.result.enter"),
    );
    map.insert("get_lab_reports", CommandPolicy::SessionOnly);
    map.insert("create_lab_report", CommandPolicy::Permission("lab.order"));
    map.insert("finalize_lab_report", CommandPolicy::Permission("lab.result.enter"));
    map.insert("amend_lab_report", CommandPolicy::Permission("lab.result.enter"));
    map.insert("forward_lab_report", CommandPolicy::SessionOnly);
    map.insert("get_forwarded_reports_to_me", CommandPolicy::SessionOnly);

    map.insert(
        "get_paired_devices",
        CommandPolicy::Permission("devices.manage"),
    );
    map.insert(
        "initiate_pairing_session",
        CommandPolicy::Permission("devices.manage"),
    );
    map.insert(
        "update_device_permissions",
        CommandPolicy::Permission("devices.manage"),
    );
    map.insert("block_device", CommandPolicy::Permission("devices.manage"));
    map.insert(
        "unblock_device",
        CommandPolicy::Permission("devices.manage"),
    );
    map.insert("remove_device", CommandPolicy::Permission("devices.manage"));

    map.insert("partner_facility_list", CommandPolicy::SessionOnly);
    map.insert("partner_facility_create", CommandPolicy::Permission("settings.manage"));
    map.insert("partner_facility_update_status", CommandPolicy::Permission("settings.manage"));
    map.insert("partner_facility_delete", CommandPolicy::Permission("settings.manage"));

    map.insert("explorer_get_default_dir", CommandPolicy::SessionOnly);
    map.insert("explorer_read_dir", CommandPolicy::SessionOnly);
    map.insert("explorer_read_file_text", CommandPolicy::SessionOnly);
    map.insert("explorer_create_dir", CommandPolicy::SessionOnly);
    map.insert("explorer_rename_path", CommandPolicy::SessionOnly);
    map.insert("explorer_copy_file", CommandPolicy::SessionOnly);
    map.insert("explorer_delete_path", CommandPolicy::SessionOnly);
    map.insert("explorer_reveal_in_file_manager", CommandPolicy::SessionOnly);

    map.insert("export_disaster_recovery_pack", CommandPolicy::SessionOnly);
    map.insert("preview_disaster_recovery_pack", CommandPolicy::SessionOnly);
    map.insert("restore_disaster_recovery_pack", CommandPolicy::SessionOnly);

    map.insert("get_workflow_templates", CommandPolicy::SessionOnly);
    map.insert("save_workflow_draft", CommandPolicy::Permission("lab.order"));
    map.insert("publish_workflow_template", CommandPolicy::Permission("lab.result.enter"));
    map.insert("export_workflow_template", CommandPolicy::SessionOnly);
    map.insert("import_workflow_template", CommandPolicy::Permission("lab.order"));

    map
}
