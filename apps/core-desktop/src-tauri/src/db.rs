use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqlitePoolOptions};
use tauri::Manager;
use std::env;
use std::fs;
use std::path::PathBuf;
use std::str::FromStr;

use crate::auth::AuthState;
use crate::security::keystore::Keystore;
use crate::services::lan::LanServerState;
use sqlx::migrate::Migrator;
use std::sync::Arc;

static SQLITE_MIGRATOR: Migrator = sqlx::migrate!("../../../infra/db/sqlite-schema/migrations");

/// Some existing dev databases received the registration columns before the
/// corresponding SQLx migration was recorded. Record that migration only when
/// every column it adds is already present, avoiding a destructive reset.
async fn reconcile_registration_migration(pool: &SqlitePool) -> Result<bool, sqlx::Error> {
    let migration_table_exists: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = '_sqlx_migrations'",
    )
    .fetch_one(pool)
    .await?;
    if migration_table_exists.0 == 0 {
        return Ok(false);
    }

    let migration_exists: Option<(i64,)> =
        sqlx::query_as("SELECT version FROM _sqlx_migrations WHERE version = 10")
            .fetch_optional(pool)
            .await?;
    if migration_exists.is_some() {
        return Ok(false);
    }

    let prior_migration_exists: Option<(i64,)> =
        sqlx::query_as("SELECT version FROM _sqlx_migrations WHERE version = 9 AND success = 1")
            .fetch_optional(pool)
            .await?;
    if prior_migration_exists.is_none() {
        return Ok(false);
    }

    let columns: Vec<(String,)> = sqlx::query_as("SELECT name FROM pragma_table_info('business')")
        .fetch_all(pool)
        .await?;
    let columns: std::collections::HashSet<String> =
        columns.into_iter().map(|(name,)| name).collect();
    let required_columns = [
        "owner_id",
        "onboarding_state",
        "business_type",
        "country",
        "address_ward",
        "address_street",
        "address_area",
        "latitude",
        "longitude",
        "lipa_namba",
        "payment_number",
        "declared_branch_count",
        "terms_version",
        "terms_locale",
        "terms_text_sha256",
        "terms_accepted_at",
        "terms_accepted_by_user_id",
        "scale",
        "idle_lock_minutes",
    ];
    if !required_columns
        .iter()
        .all(|column| columns.contains(*column))
    {
        return Ok(false);
    }

    let migration = SQLITE_MIGRATOR
        .iter()
        .find(|migration| migration.version == 10)
        .expect("registration fields migration 0010 must exist");
    sqlx::query(
        "INSERT INTO _sqlx_migrations (version, description, success, checksum, execution_time) VALUES (?, ?, 1, ?, 0)",
    )
    .bind(migration.version)
    .bind(migration.description.as_ref())
    .bind(migration.checksum.as_ref())
    .execute(pool)
    .await?;

    tracing::warn!("Recorded migration 0010 because all registration fields already exist in the local database");
    Ok(true)
}

pub struct AppState {
    pub pool: SqlitePool,
    pub lan_state: Arc<LanServerState>,
    pub auth_state: Arc<AuthState>,
    pub keystore: Arc<Keystore>,
    pub otp_client: Arc<dyn crate::activation::OtpClient>,
    pub activation_client: Arc<dyn crate::activation::ActivationClient>,
}

/// Optional development override retained for local workflows.
pub fn resolve_db_url() -> Result<String, Box<dyn std::error::Error>> {
    if let Ok(url) = env::var("DATABASE_URL") {
        if !url.trim().is_empty() {
            return Ok(url);
        }
    }

    if !cfg!(debug_assertions) {
        return Err("Release database path requires the Tauri application data resolver".into());
    }
    let db_path = resolve_dev_database_path()?;

    if let Some(parent) = db_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }

    Ok(format!("sqlite:{}?mode=rwc", db_path.display()))
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
    Err("Release database path must be resolved through Tauri's app_data_dir".into())
}

pub async fn init_db_pool() -> Result<SqlitePool, Box<dyn std::error::Error>> {
    if cfg!(debug_assertions) {
        let path = resolve_dev_database_path()?;
        return init_db_pool_with_path(&path).await;
    }
    Err("Release database initialization requires a Tauri AppHandle".into())
}

pub async fn init_db_pool_for_app(app: &tauri::AppHandle) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let path = if cfg!(debug_assertions) {
        resolve_dev_database_path()?
    } else {
        app.path().app_data_dir()?.join("40labs.db")
    };
    init_db_pool_with_path(&path).await
}

async fn init_db_pool_with_path(path: &std::path::Path) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Unable to prepare database directory ({}): {e}", e.kind()))?;
    }
    tracing::debug!("Opening SQLite database (path redacted)");
    let options = SqliteConnectOptions::new()
        .filename(path)
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .foreign_keys(true);
    init_db_pool_with_options(options).await
}

pub async fn init_db_pool_with_url(db_url: &str) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let connect_options = SqliteConnectOptions::from_str(db_url)?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .foreign_keys(true);

    init_db_pool_with_options(connect_options).await
}

async fn init_db_pool_with_options(connect_options: SqliteConnectOptions) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(connect_options)
        .await?;

    let migrate_res: Result<(), Box<dyn std::error::Error>> = async {
        reconcile_registration_migration(&pool).await?;
        SQLITE_MIGRATOR.run(&pool).await?;
        Ok(())
    }
    .await;

    if let Err(err) = migrate_res {
        let err_str = err.to_string();
        if err_str.contains("mismatch")
            || err_str.contains("migration")
            || err_str.contains("VersionMismatch")
        {
            tracing::error!("SQLite migration version/checksum mismatch; database contents were left untouched");
            if cfg!(debug_assertions) {
                tracing::error!("Development migration mismatch: inspect migration history and schema; database was not reset");
            } else {
                tracing::error!("Release migration mismatch: refusing to start; database was not reset");
            }
        }
        return Err(err);
    }

    Ok(pool)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn reconciles_registration_migration_when_columns_are_already_present() {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        sqlx::query("CREATE TABLE _sqlx_migrations (version BIGINT PRIMARY KEY, description TEXT NOT NULL, installed_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, success BOOLEAN NOT NULL, checksum BLOB NOT NULL, execution_time BIGINT NOT NULL)")
            .execute(&pool)
            .await
            .unwrap();
        sqlx::query("INSERT INTO _sqlx_migrations (version, description, success, checksum, execution_time) VALUES (9, 'auth pin nullable', 1, X'01', 0)")
            .execute(&pool)
            .await
            .unwrap();

        let column_sql = [
            "owner_id TEXT",
            "onboarding_state TEXT",
            "business_type TEXT",
            "country TEXT",
            "address_ward TEXT",
            "address_street TEXT",
            "address_area TEXT",
            "latitude REAL",
            "longitude REAL",
            "lipa_namba TEXT",
            "payment_number TEXT",
            "declared_branch_count INTEGER",
            "terms_version TEXT",
            "terms_locale TEXT",
            "terms_text_sha256 TEXT",
            "terms_accepted_at TEXT",
            "terms_accepted_by_user_id TEXT",
            "scale TEXT",
            "idle_lock_minutes INTEGER",
        ];
        sqlx::query(&format!(
            "CREATE TABLE business ({})",
            column_sql.join(", ")
        ))
        .execute(&pool)
        .await
        .unwrap();

        assert!(reconcile_registration_migration(&pool).await.unwrap());
        let recorded: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM _sqlx_migrations WHERE version = 10 AND success = 1",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(recorded.0, 1);
    }

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
    async fn opens_path_with_spaces_and_reserved_characters_and_reuses_existing_database() {
        let dir = std::env::temp_dir().join(format!("40labs db #?% {}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&dir).unwrap();
        let path = dir.join("data #?%.db");
        let pool = init_db_pool_with_path(&path).await.unwrap();
        sqlx::query("CREATE TABLE path_test (value TEXT NOT NULL)")
            .execute(&pool).await.unwrap();
        sqlx::query("INSERT INTO path_test VALUES ('preserved')")
            .execute(&pool).await.unwrap();
        pool.close().await;

        let reopened = init_db_pool_with_path(&path).await.unwrap();
        let value: (String,) = sqlx::query_as("SELECT value FROM path_test")
            .fetch_one(&reopened).await.unwrap();
        assert_eq!(value.0, "preserved");
        reopened.close().await;
        fs::remove_dir_all(dir).unwrap();
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

        let update_res =
            sqlx::query("UPDATE audit_log SET metadata = '{\"tampered\": true}' WHERE id = ?")
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

    #[tokio::test]
    async fn test_invalid_db_url_fails_explicitly() {
        let invalid_res =
            init_db_pool_with_url("sqlite:///non_existent_dir_xyz/invalid.db?mode=ro").await;
        assert!(
            invalid_res.is_err(),
            "Expected initialization with invalid database URL to return an error explicitly"
        );
    }
}
