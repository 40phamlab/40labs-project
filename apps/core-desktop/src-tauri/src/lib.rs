pub mod commands;
pub mod db;
pub mod models;
pub mod repositories;
pub mod services;

use db::{init_db_pool, AppState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize tokio runtime for async pool setup
    let runtime = tokio::runtime::Runtime::new().expect("Failed to create tokio runtime");

    let pool = runtime.block_on(async {
        init_db_pool()
            .await
            .expect("Failed to initialize SQLite database pool")
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState { pool })
        .invoke_handler(tauri::generate_handler![
            commands::system_cmd::system_health_check,
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
            commands::audit_cmd::record_audit_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
