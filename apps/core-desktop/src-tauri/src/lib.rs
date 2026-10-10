pub mod commands;
pub mod db;
pub mod models;
pub mod repositories;
pub mod services;
pub mod auth;
pub mod security;
pub mod activation;
pub mod debug;

use db::{init_db_pool, AppState};
use services::lan::LanServerState;
use auth::{AuthState, RealClock};
use security::keystore::Keystore;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    debug::init();

    let runtime = tokio::runtime::Runtime::new().expect("Failed to create tokio runtime");

    let pool = match runtime.block_on(async { init_db_pool().await }) {
        Ok(p) => p,
        Err(err) => {
            tracing::error!("[40Labs Startup Error] Failed to initialize SQLite database pool: {}. Falling back to in-memory pool to prevent process abort.", err);
            runtime.block_on(async {
                sqlx::sqlite::SqlitePoolOptions::new()
                    .max_connections(1)
                    .connect("sqlite::memory:")
                    .await
                    .expect("Fatal fallback database failure")
            })
        }
    };

    let keystore = Arc::new(Keystore::init().expect("Failed to initialize security keystore"));
    let auth_state = Arc::new(AuthState::new(Arc::new(RealClock)));

    let api_base_url = std::env::var("API_BASE_URL").ok();
    let pubkey_hex = std::env::var("ACTIVATION_PUBKEY").ok();
    let (otp_client, activation_client) = activation::client::ActivationClientFactory::create_clients(api_base_url, pubkey_hex);

    let port = 4040;
    let lan_state = Arc::new(LanServerState::new(pool.clone(), port));
    let lan_state_clone = Arc::clone(&lan_state);
    let lan_state_for_server = Arc::clone(&lan_state);

    runtime.spawn(async move {
        services::lan::start_lan_server(lan_state_for_server, port).await;
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            pool,
            lan_state: lan_state_clone,
            auth_state,
            keystore,
            otp_client,
            activation_client,
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
            // Lab
            commands::lab_cmd::get_lab_orders,
            commands::lab_cmd::create_lab_order,
            commands::lab_cmd::update_lab_order_status,
            commands::lab_cmd::get_lab_samples,
            commands::lab_cmd::collect_lab_sample,
            commands::lab_cmd::update_lab_sample_status,
            // Audit
            commands::audit_cmd::get_audit_logs,
            // Notifications & Messages
            commands::notification_cmd::get_notifications,
            commands::notification_cmd::get_notification_messages,
            commands::notification_cmd::send_notification_message,
            commands::notification_cmd::mark_notification_read,
            commands::notification_cmd::archive_notification,
            commands::notification_cmd::save_attachment,
            commands::notification_cmd::export_attachment,
            // Devices & Pairing
            commands::devices_cmd::get_paired_devices,
            commands::devices_cmd::initiate_pairing_session,
            commands::devices_cmd::update_device_permissions,
            commands::devices_cmd::block_device,
            commands::devices_cmd::unblock_device,
            commands::devices_cmd::remove_device,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
