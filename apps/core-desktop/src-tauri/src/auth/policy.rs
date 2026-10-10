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
    map.insert("user_reset_credentials", CommandPolicy::Permission("users.manage"));

    map.insert("recovery_redeem", CommandPolicy::Public);
    map.insert("recovery_regenerate", CommandPolicy::Permission("users.manage"));
    map.insert("recovery_generate_initial", CommandPolicy::Permission("users.manage"));

    map.insert("registration_commit", CommandPolicy::Public);
    map.insert("otp_request", CommandPolicy::Public);
    map.insert("otp_verify", CommandPolicy::Public);

    map.insert("onboarding_advance", CommandPolicy::SessionOnly);
    map.insert("business_set_idle_lock", CommandPolicy::Permission("settings.manage:idle"));

    map.insert("get_inventory_list", CommandPolicy::Permission("inventory.view"));
    map.insert("get_inventory_item", CommandPolicy::Permission("inventory.view"));
    map.insert("create_stock_item", CommandPolicy::Permission("inventory.create"));
    map.insert("record_stock_action", CommandPolicy::Permission("inventory.create"));

    map.insert("get_customers_list", CommandPolicy::Permission("customers.view"));
    map.insert("get_customer", CommandPolicy::Permission("customers.view"));
    map.insert("create_customer", CommandPolicy::Permission("customers.edit"));
    map.insert("update_customer", CommandPolicy::Permission("customers.edit"));

    map.insert("get_sales_list", CommandPolicy::SessionOnly);
    map.insert("create_sale", CommandPolicy::Permission("sales.create"));
    map.insert("get_fiscal_receipts", CommandPolicy::SessionOnly);

    map.insert("get_lab_orders", CommandPolicy::SessionOnly);
    map.insert("create_lab_order", CommandPolicy::Permission("lab.order"));
    map.insert("update_lab_order_status", CommandPolicy::Permission("lab.order"));
    map.insert("get_lab_samples", CommandPolicy::SessionOnly);
    map.insert("collect_lab_sample", CommandPolicy::Permission("lab.order"));
    map.insert("update_lab_sample_status", CommandPolicy::Permission("lab.result.enter"));

    map.insert("get_audit_logs", CommandPolicy::Permission("reports.compliance"));

    map.insert("get_notifications", CommandPolicy::SessionOnly);
    map.insert("get_notification_messages", CommandPolicy::SessionOnly);
    map.insert("send_notification_message", CommandPolicy::SessionOnly);
    map.insert("mark_notification_read", CommandPolicy::SessionOnly);
    map.insert("archive_notification", CommandPolicy::SessionOnly);
    map.insert("save_attachment", CommandPolicy::SessionOnly);
    map.insert("export_attachment", CommandPolicy::SessionOnly);

    map.insert("get_paired_devices", CommandPolicy::Permission("devices.manage"));
    map.insert("initiate_pairing_session", CommandPolicy::Permission("devices.manage"));
    map.insert("update_device_permissions", CommandPolicy::Permission("devices.manage"));
    map.insert("block_device", CommandPolicy::Permission("devices.manage"));
    map.insert("unblock_device", CommandPolicy::Permission("devices.manage"));
    map.insert("remove_device", CommandPolicy::Permission("devices.manage"));

    map
}
