pub mod audit_cmd;
pub mod auth_cmd;
pub mod backup_cmd;
pub mod business_cmd;
pub mod customer_cmd;
pub mod devices_cmd;
pub mod explorer_cmd;
pub mod integrations_cmd;
pub mod inventory_cmd;
pub mod lab_cmd;
pub mod notification_cmd;
pub mod partner_facility_cmd;
pub mod purchases_cmd;
pub mod registration_cmd;
pub mod sales_cmd;
pub mod system_cmd;
pub mod user_cmd;
pub mod workflow_cmd;

#[cfg(test)]
mod tests {
    #[test]
    fn test_command_policy_completeness() {
        let registered_commands = vec![
            "system_health_check",
            "frontend_log",
            "auth_status",
            "auth_login",
            "auth_logout",
            "auth_lock",
            "auth_unlock_pin",
            "auth_set_pin",
            "auth_step_up",
            "auth_list_approvers",
            "auth_change_password",
            "auth_change_pin",
            "auth_reset_own_pin",
            "user_list",
            "user_create",
            "user_update",
            "user_set_active",
            "user_reset_credentials",
            "recovery_redeem",
            "recovery_regenerate",
            "recovery_generate_initial",
            "registration_commit",
            "otp_request",
            "otp_verify",
            "onboarding_advance",
            "business_set_idle_lock",
            "get_business",
            "upload_business_logo",
            "update_business",
            "get_integrations_config",
            "update_integrations_config",
            "get_inventory_list",
            "get_inventory_item",
            "create_stock_item",
            "record_stock_action",
            "get_customers_list",
            "get_customer",
            "create_customer",
            "update_customer",
            "get_sales_list",
            "create_sale",
            "get_fiscal_receipts",
            "get_purchase_orders",
            "get_suppliers",
            "create_purchase_order",
            "approve_purchase_order",
            "get_lab_orders",
            "create_lab_order",
            "update_lab_order_status",
            "get_lab_samples",
            "collect_lab_sample",
            "update_lab_sample_status",
            "update_sample_expiry",
            "get_sample_events",
            "expiry_override",
            "get_lab_results",
            "get_test_catalog",
            "get_lab_stock",
            "get_lab_qc_data",
            "create_test_catalog_entry",
            "create_lab_qc_equipment",
            "create_lab_qc_record",
            "enter_lab_result",
            "get_lab_reports",
            "create_lab_report",
            "finalize_lab_report",
            "amend_lab_report",
            "forward_lab_report",
            "get_forwarded_reports_to_me",
            "get_audit_logs",
            "get_notifications",
            "create_notification",
            "get_notification_messages",
            "send_notification_message",
            "mark_notification_read",
            "archive_notification",
            "save_attachment",
            "export_attachment",
            "resolve_attachment_path",
            "save_bytes_to_documents",
            "export_attachment_to_path",
            "get_paired_devices",
            "initiate_pairing_session",
            "update_device_permissions",
            "block_device",
            "unblock_device",
            "remove_device",
            "partner_facility_list",
            "partner_facility_create",
            "partner_facility_update_status",
            "partner_facility_delete",
            "explorer_get_default_dir",
            "explorer_read_dir",
            "explorer_read_file_text",
            "explorer_create_dir",
            "explorer_rename_path",
            "explorer_copy_file",
            "explorer_delete_path",
            "explorer_reveal_in_file_manager",
            "export_disaster_recovery_pack",
            "preview_disaster_recovery_pack",
            "restore_disaster_recovery_pack",
            "get_workflow_templates",
            "save_workflow_draft",
            "publish_workflow_template",
            "export_workflow_template",
            "import_workflow_template",
            "start_workflow_execution",
            "complete_workflow_step_execution",
            "get_workflow_execution",
        ];

        let policy_map = crate::auth::policy::get_command_policy_map();

        for cmd in registered_commands {
            assert!(
                policy_map.contains_key(cmd),
                "Command '{}' is registered in generate_handler! but missing from COMMAND_POLICY table!",
                cmd
            );
        }
    }
}
