pub mod audit_cmd;
pub mod customer_cmd;
pub mod inventory_cmd;
pub mod lab_cmd;
pub mod sales_cmd;
pub mod system_cmd;
pub mod notification_cmd;
pub mod devices_cmd;
pub mod auth_cmd;
pub mod user_cmd;
pub mod registration_cmd;

#[cfg(test)]
mod tests {
    #[test]
    fn test_command_policy_completeness() {
        let registered_commands = vec![
            "system_health_check",
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
            "get_lab_orders",
            "create_lab_order",
            "update_lab_order_status",
            "get_lab_samples",
            "collect_lab_sample",
            "update_lab_sample_status",
            "get_audit_logs",
            "get_notifications",
            "get_notification_messages",
            "send_notification_message",
            "mark_notification_read",
            "archive_notification",
            "save_attachment",
            "export_attachment",
            "get_paired_devices",
            "initiate_pairing_session",
            "update_device_permissions",
            "block_device",
            "unblock_device",
            "remove_device",
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
