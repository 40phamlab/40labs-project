use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqlitePoolOptions};
use std::env;
use std::fs;
use std::path::PathBuf;
use std::str::FromStr;

pub struct AppState {
    pub pool: SqlitePool,
}

/// Centralized resolution of database path and connection URL.
///
/// Strategy:
/// 1. If `DATABASE_URL` is set in the environment, use it directly.
/// 2. In Development (`cfg!(debug_assertions)`):
///    Locates the project repository root and places the database in `<repo_root>/dev-data/40labs-dev.db`.
///    This guarantees the SQLite file, WAL, and SHM files live outside any directories watched
///    by Tauri's development file watcher (e.g. `src-tauri/`), preventing infinite rebuild loops.
/// 3. In Production (`!cfg!(debug_assertions)`):
///    Places the database inside the system's standard user data directory for `com.40labs.core-desktop`.
pub fn resolve_db_url() -> String {
    if let Ok(url) = env::var("DATABASE_URL") {
        if !url.trim().is_empty() {
            println!("[40Labs DB] Using DATABASE_URL environment override: {}", url);
            return url;
        }
    }

    let db_path = resolve_db_file_path();

    // Ensure containing directory exists
    if let Some(parent) = db_path.parent() {
        if !parent.exists() {
            if let Err(err) = fs::create_dir_all(parent) {
                eprintln!(
                    "[40Labs DB] Warning: Failed to create database directory {:?}: {}",
                    parent, err
                );
            }
        }
    }

    let db_path_str = db_path.to_string_lossy();
    println!("[40Labs DB] Resolved database path: {}", db_path_str);

    format!("sqlite:{}?mode=rwc", db_path_str)
}

/// Resolves absolute PathBuf for the SQLite database file.
pub fn resolve_db_file_path() -> PathBuf {
    if cfg!(debug_assertions) {
        resolve_dev_database_path()
    } else {
        resolve_prod_database_path()
    }
}

fn resolve_dev_database_path() -> PathBuf {
    let start_dir = env::var("CARGO_MANIFEST_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

    let mut current = start_dir.as_path();
    while let Some(parent) = current.parent() {
        if current.join("pnpm-workspace.yaml").exists()
            || current.join("turbo.json").exists()
            || current.join(".git").exists()
        {
            return current.join("dev-data").join("40labs-dev.db");
        }
        current = parent;
    }

    // Fallback: 2 levels up from CARGO_MANIFEST_DIR (apps/core-desktop/src-tauri -> repo root)
    start_dir
        .parent()
        .and_then(|p| p.parent())
        .and_then(|p| p.parent())
        .unwrap_or(&start_dir)
        .join("dev-data")
        .join("40labs-dev.db")
}

fn resolve_prod_database_path() -> PathBuf {
    // OS Application Data Directory
    let base_dir = std::env::var_os("APPDATA")
        .map(PathBuf::from)
        .or_else(|| {
            std::env::var_os("XDG_DATA_HOME")
                .map(PathBuf::from)
                .or_else(|| {
                    std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".local").join("share"))
                })
        })
        .unwrap_or_else(|| env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

    base_dir.join("com.40labs.core-desktop").join("40labs.db")
}

pub async fn init_db_pool() -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let db_url = resolve_db_url();

    println!("[40Labs DB] Initializing SQLx connection pool at: {}", db_url);

    let connect_options = SqliteConnectOptions::from_str(&db_url)?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .foreign_keys(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(connect_options)
        .await?;

    // Run core schema initialization if tables do not exist
    init_schema(&pool).await?;

    Ok(pool)
}

async fn init_schema(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS app_user (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            branch_id TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            pin_hash TEXT NOT NULL,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS customer (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            branch_id TEXT NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            outstanding_balance INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            amob_patient_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS medicine (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            branch_id TEXT NOT NULL,
            name TEXT NOT NULL,
            generic_name TEXT,
            category TEXT NOT NULL,
            unit TEXT NOT NULL,
            is_controlled_substance INTEGER NOT NULL DEFAULT 0,
            requires_prescription INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS inventory_item (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            branch_id TEXT NOT NULL,
            medicine_id TEXT NOT NULL REFERENCES medicine(id),
            batch_number TEXT NOT NULL,
            expiry_date TEXT NOT NULL,
            buy_price INTEGER NOT NULL,
            sell_price INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            low_stock_threshold INTEGER NOT NULL DEFAULT 5,
            cold_chain_required INTEGER NOT NULL DEFAULT 0,
            is_deactivated INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS stock_adjustment (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            branch_id TEXT NOT NULL,
            inventory_item_id TEXT NOT NULL REFERENCES inventory_item(id),
            adjusted_by_user_id TEXT NOT NULL,
            delta INTEGER NOT NULL,
            reason TEXT NOT NULL,
            audit_log_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sale (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            branch_id TEXT NOT NULL,
            customer_id TEXT REFERENCES customer(id),
            payment_method TEXT NOT NULL,
            discount_amount INTEGER NOT NULL DEFAULT 0,
            discount_authorized_by_user_id TEXT,
            tax_amount INTEGER NOT NULL DEFAULT 0,
            grand_total INTEGER NOT NULL,
            currency TEXT NOT NULL DEFAULT 'TZS',
            synced_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sale_line (
            id TEXT PRIMARY KEY,
            sale_id TEXT NOT NULL REFERENCES sale(id),
            inventory_item_id TEXT NOT NULL REFERENCES inventory_item(id),
            medicine_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price INTEGER NOT NULL,
            subtotal INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lab_order (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            branch_id TEXT NOT NULL,
            customer_id TEXT NOT NULL REFERENCES customer(id),
            sale_id TEXT,
            ordered_by_user_id TEXT NOT NULL,
            status TEXT NOT NULL,
            test_catalog_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lab_sample (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            branch_id TEXT NOT NULL,
            lab_order_id TEXT NOT NULL REFERENCES lab_order(id),
            collected_by_user_id TEXT NOT NULL,
            collected_at TEXT NOT NULL,
            sample_label TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            branch_id TEXT NOT NULL,
            action TEXT NOT NULL,
            performed_by_user_id TEXT NOT NULL,
            target_entity_type TEXT NOT NULL,
            target_entity_id TEXT NOT NULL,
            metadata TEXT,
            created_at TEXT NOT NULL
        );
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_dev_db_path() {
        let path = resolve_db_file_path();
        let path_str = path.to_string_lossy();
        assert!(
            path_str.contains("dev-data"),
            "Expected path to contain 'dev-data', got: {}",
            path_str
        );
        assert!(
            path_str.contains("40labs-dev.db"),
            "Expected path to contain '40labs-dev.db', got: {}",
            path_str
        );
        assert!(
            !path_str.contains("src-tauri"),
            "Expected path NOT to contain 'src-tauri', got: {}",
            path_str
        );
    }

    #[tokio::test]
    async fn test_init_db_pool() {
        let pool = init_db_pool().await.expect("Failed to initialize pool");
        let row: (i64,) = sqlx::query_as("SELECT 1")
            .fetch_one(&pool)
            .await
            .expect("Failed query");
        assert_eq!(row.0, 1);
    }
}
