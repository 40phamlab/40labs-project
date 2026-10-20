pub mod activation;
pub mod auth;
pub mod commands;
pub mod db;
pub mod debug;
pub mod models;
pub mod repositories;
pub mod security;
pub mod services;

use auth::{AuthState, RealClock};
use db::{init_db_pool_for_app, AppState};
use security::keystore::Keystore;
use services::lan::LanServerState;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    debug::init();

    let keystore = Arc::new(Keystore::init().expect("Failed to initialize security keystore"));
    let auth_state = Arc::new(AuthState::new(Arc::new(RealClock)));

    let api_base_url = std::env::var("API_BASE_URL").ok();
    let pubkey_hex = std::env::var("ACTIVATION_PUBKEY").ok();
    let (otp_client, activation_client) =
        activation::client::ActivationClientFactory::create_clients(api_base_url, pubkey_hex);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(move |app| {
            let pool = tauri::async_runtime::block_on(init_db_pool_for_app(app.handle())).map_err(|err| {
                tracing::error!("Failed to initialize persistent SQLite database: {err}");
                err
            })?;
            let port = 4040;
            let app_data_dir = app.path().app_data_dir()?;
            let lan_state = Arc::new(
                LanServerState::new(pool.clone(), port, &app_data_dir)
                    .map_err(std::io::Error::other)?,
            );
            let lan_state_for_server = Arc::clone(&lan_state);
            tauri::async_runtime::spawn(async move {
                services::lan::start_lan_server(lan_state_for_server, port).await;
            });
            app.manage(AppState {
                pool,
                lan_state,
                auth_state,
                keystore,
                otp_client,
                activation_client,
            });
            if let Err(e) = services::documents::ensure_layout(app.handle()) {
                tracing::warn!("Failed to initialize Documents layout on startup: {}. Will lazy-create on first write.", e);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system_cmd::system_health_check,
            commands::system_cmd::frontend_log,
            // Auth
            commands::auth_cmd::auth_status,
            commands::auth_cmd::auth_login,
            commands::auth_cmd::auth_logout,
            commands::auth_cmd::auth_lock,
            commands::auth_cmd::auth_unlock_pin,
            commands::auth_cmd::auth_set_pin,
            commands::auth_cmd::auth_step_up,
            commands::auth_cmd::auth_list_approvers,
            commands::auth_cmd::auth_change_password,
            commands::auth_cmd::auth_change_pin,
            commands::auth_cmd::auth_reset_own_pin,
            // Users
            commands::user_cmd::user_list,
            commands::user_cmd::user_create,
            commands::user_cmd::user_update,
            commands::user_cmd::user_set_active,
            commands::user_cmd::user_reset_credentials,
            // Business & Integrations
            commands::business_cmd::get_business,
            commands::business_cmd::update_business,
            commands::business_cmd::upload_business_logo,
            commands::integrations_cmd::get_integrations_config,
            commands::integrations_cmd::update_integrations_config,
            // Recovery & Registration & Onboarding
            commands::auth_cmd::recovery_regenerate,
            commands::auth_cmd::recovery_generate_initial,
            commands::auth_cmd::onboarding_advance,
            commands::auth_cmd::business_set_idle_lock,
            commands::registration_cmd::recovery_redeem,
            commands::registration_cmd::registration_commit,
            commands::registration_cmd::otp_request,
            commands::registration_cmd::otp_verify,
            // Inventory
            commands::inventory_cmd::get_inventory_list,
            commands::inventory_cmd::get_inventory_item,
            commands::inventory_cmd::create_stock_item,
            commands::inventory_cmd::record_stock_action,
            // Customers
            commands::customer_cmd::get_customers_list,
            commands::customer_cmd::get_customer,
            commands::customer_cmd::create_customer,
            commands::customer_cmd::update_customer,
            // Sales
            commands::sales_cmd::get_sales_list,
            commands::sales_cmd::create_sale,
            commands::sales_cmd::get_fiscal_receipts,
            // Purchases
            commands::purchases_cmd::get_purchase_orders,
            commands::purchases_cmd::get_suppliers,
            commands::purchases_cmd::create_purchase_order,
            commands::purchases_cmd::approve_purchase_order,
            // Lab
            commands::lab_cmd::get_lab_orders,
            commands::lab_cmd::create_lab_order,
            commands::lab_cmd::update_lab_order_status,
            commands::lab_cmd::get_lab_samples,
            commands::lab_cmd::collect_lab_sample,
            commands::lab_cmd::update_lab_sample_status,
            commands::lab_cmd::get_lab_results,
            commands::lab_cmd::get_test_catalog,
            commands::lab_cmd::create_test_catalog_entry,
            commands::lab_cmd::get_lab_stock,
            commands::lab_cmd::get_lab_qc_data,
            commands::lab_cmd::create_lab_qc_equipment,
            commands::lab_cmd::create_lab_qc_record,
            commands::lab_cmd::enter_lab_result,
            // Audit
            commands::audit_cmd::get_audit_logs,
            // Notifications & Messages
            commands::notification_cmd::get_notifications,
            commands::notification_cmd::create_notification,
            commands::notification_cmd::get_notification_messages,
            commands::notification_cmd::send_notification_message,
            commands::notification_cmd::mark_notification_read,
            commands::notification_cmd::archive_notification,
            commands::notification_cmd::save_attachment,
            commands::notification_cmd::export_attachment,
            commands::notification_cmd::resolve_attachment_path,
            commands::notification_cmd::save_bytes_to_documents,
            commands::notification_cmd::export_attachment_to_path,
            commands::notification_cmd::get_threads,
            commands::notification_cmd::get_thread_messages,
            commands::notification_cmd::find_or_create_thread,
            commands::notification_cmd::append_thread_message,
            commands::notification_cmd::mark_thread_read,
            commands::notification_cmd::archive_thread,
            // Devices & Pairing
            commands::devices_cmd::get_paired_devices,
            commands::devices_cmd::initiate_pairing_session,
            commands::devices_cmd::update_device_permissions,
            commands::devices_cmd::block_device,
            commands::devices_cmd::unblock_device,
            commands::devices_cmd::remove_device,
            // Partner Facilities
            commands::partner_facility_cmd::partner_facility_list,
            commands::partner_facility_cmd::partner_facility_create,
            commands::partner_facility_cmd::partner_facility_update_status,
            commands::partner_facility_cmd::partner_facility_delete,
            // File Explorer
            commands::explorer_cmd::explorer_get_default_dir,
            commands::explorer_cmd::explorer_read_dir,
            commands::explorer_cmd::explorer_read_file_text,
            commands::explorer_cmd::explorer_create_dir,
            commands::explorer_cmd::explorer_rename_path,
            commands::explorer_cmd::explorer_copy_file,
            commands::explorer_cmd::explorer_delete_path,
            commands::explorer_cmd::explorer_reveal_in_file_manager,
            // Disaster Recovery
            commands::backup_cmd::export_disaster_recovery_pack,
            commands::backup_cmd::preview_disaster_recovery_pack,
            commands::backup_cmd::restore_disaster_recovery_pack,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
