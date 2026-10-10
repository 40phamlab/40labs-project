use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqlitePoolOptions};
use std::env;
use std::fs;
use std::path::PathBuf;
use std::str::FromStr;

use std::sync::Arc;
use crate::services::lan::LanServerState;
use crate::auth::AuthState;
use crate::security::keystore::Keystore;

pub struct AppState {
    pub pool: SqlitePool,
    pub lan_state: Arc<LanServerState>,
    pub auth_state: Arc<AuthState>,
    pub keystore: Arc<Keystore>,
    pub otp_client: Arc<dyn crate::activation::OtpClient>,
    pub activation_client: Arc<dyn crate::activation::ActivationClient>,
}

/// Centralized resolution of database path and connection URL.
pub fn resolve_db_url() -> Result<String, Box<dyn std::error::Error>> {
    if let Ok(url) = env::var("DATABASE_URL") {
        if !url.trim().is_empty() {
            println!("[40Labs DB] Using DATABASE_URL environment override: {}", url);
            return Ok(url);
        }
    }

    let db_path = resolve_db_file_path()?;

    if let Some(parent) = db_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }

    let db_path_str = db_path.to_string_lossy();
    println!("[40Labs DB] Resolved database path: {}", db_path_str);

    Ok(format!("sqlite:{}?mode=rwc", db_path_str))
}

pub fn resolve_db_file_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
    if cfg!(debug_assertions) {
        resolve_dev_database_path()
    } else {
        resolve_prod_database_path()
    }
}

fn resolve_dev_database_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let start_dir = env::var("CARGO_MANIFEST_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

    let mut current = start_dir.as_path();
    while let Some(parent) = current.parent() {
        if current.join("pnpm-workspace.yaml").exists()
            || current.join("turbo.json").exists()
            || current.join(".git").exists()
        {
            return Ok(current.join("dev-data").join("40labs-dev.db"));
        }
        current = parent;
    }

    Ok(start_dir
        .parent()
        .and_then(|p| p.parent())
        .and_then(|p| p.parent())
        .unwrap_or(&start_dir)
        .join("dev-data")
        .join("40labs-dev.db"))
}

fn resolve_prod_database_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
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

    Ok(base_dir.join("com.40labs.core-desktop").join("40labs.db"))
}

pub async fn init_db_pool() -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let db_url = resolve_db_url()?;
    init_db_pool_with_url(&db_url).await
}

pub async fn init_db_pool_with_url(db_url: &str) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    println!("[40Labs DB] Initializing SQLx connection pool at: {}", db_url);

    let connect_options = SqliteConnectOptions::from_str(db_url)?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .foreign_keys(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(connect_options)
        .await?;

    let migrate_res = sqlx::migrate!("../../../infra/db/sqlite-schema/migrations")
        .run(&pool)
        .await;

    if let Err(err) = migrate_res {
        let err_str = err.to_string();
        if err_str.contains("mismatch") || err_str.contains("migration") || err_str.contains("VersionMismatch") {
            eprintln!("[40Labs DB ERROR] Migration checksum or version mismatch detected: {}", err_str);
            if cfg!(debug_assertions) {
                eprintln!("[40Labs DB] [DEBUG] Please run `pnpm db:reset` to clear the dev database and re-run migrations.");
            } else {
                eprintln!("[40Labs DB] [RELEASE] Migration mismatch in production. Refusing to start and never auto-deleting data.");
            }
        }
        return Err(Box::new(err));
    }

    Ok(pool)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_dev_db_path() {
        let path = resolve_db_file_path().unwrap();
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

    #[test]
    fn test_migrations_unique_and_gapless() {
        let migration_dir = resolve_dev_database_path()
            .unwrap()
            .parent()
            .unwrap()
            .parent()
            .unwrap()
            .join("infra")
            .join("db")
            .join("sqlite-schema")
            .join("migrations");

        let entries = fs::read_dir(&migration_dir).expect("Failed to read migrations directory");
        let mut versions = Vec::new();
        for entry in entries {
            if let Ok(e) = entry {
                let name = e.file_name().to_string_lossy().to_string();
                if name.ends_with(".sql") {
                    let parts: Vec<&str> = name.split('_').collect();
                    if let Ok(v) = parts[0].parse::<u32>() {
                        versions.push(v);
                    }
                }
            }
        }
        versions.sort();
        assert!(!versions.is_empty(), "Migrations list cannot be empty");
        for (i, &v) in versions.iter().enumerate() {
            assert_eq!(
                v,
                (i + 1) as u32,
                "Migrations must be unique and gapless starting at 1. Found version {} at index {}",
                v,
                i
            );
        }
    }

    #[tokio::test]
    async fn test_init_db_pool_migrations_and_foreign_keys() {
        let pool = init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to initialize pool");

        let row: (i64,) = sqlx::query_as("SELECT 1")
            .fetch_one(&pool)
            .await
            .expect("Failed query");
        assert_eq!(row.0, 1);

        let fk_violations: Vec<(String, Option<i64>, String, i64)> =
            sqlx::query_as("PRAGMA foreign_key_check")
                .fetch_all(&pool)
                .await
                .expect("Failed foreign_key_check PRAGMA");
        assert!(
            fk_violations.is_empty(),
            "Expected 0 foreign key violations, found: {:?}",
            fk_violations
        );
    }

    #[tokio::test]
    async fn test_audit_log_immutability_triggers() {
        let pool = init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to initialize pool");

        sqlx::query(
            r#"
            INSERT OR IGNORE INTO app_user (id, workspace_id, branch_id, username, first_name, last_name, full_name, role, role_preset, active, created_at, updated_at)
            VALUES ('user_test_audit', 'ws_1', 'br_1', 'audittester', 'Audit', 'Tester', 'Audit Tester', 'staff', 'admin', 1, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')
            "#,
        )
        .execute(&pool)
        .await
        .unwrap();

        let audit_id = format!("audit_test_{}", uuid::Uuid::new_v4());

        sqlx::query(
            r#"
            INSERT INTO audit_log (id, workspace_id, branch_id, action, performed_by_user_id, target_entity_type, target_entity_id, metadata)
            VALUES (?, 'ws_1', 'br_1', 'pin_change', 'user_test_audit', 'app_user', 'user_test_audit', '{}')
            "#,
        )
        .bind(&audit_id)
        .execute(&pool)
        .await
        .expect("Failed inserting audit log row");

        let update_res = sqlx::query("UPDATE audit_log SET metadata = '{\"tampered\": true}' WHERE id = ?")
            .bind(&audit_id)
            .execute(&pool)
            .await;
        assert!(update_res.is_err(), "Expected UPDATE on audit_log to fail");
        let err_msg = update_res.unwrap_err().to_string();
        assert!(
            err_msg.contains("audit_log is append-only"),
            "Expected 'audit_log is append-only' error, got: {}",
            err_msg
        );

        let delete_res = sqlx::query("DELETE FROM audit_log WHERE id = ?")
            .bind(&audit_id)
            .execute(&pool)
            .await;
        assert!(delete_res.is_err(), "Expected DELETE on audit_log to fail");
        let delete_err_msg = delete_res.unwrap_err().to_string();
        assert!(
            delete_err_msg.contains("audit_log is append-only"),
            "Expected 'audit_log is append-only' error, got: {}",
            delete_err_msg
        );
    }
}
