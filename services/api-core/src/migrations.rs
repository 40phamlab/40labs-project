use sqlx::{migrate::Migrator, PgPool};

static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

/// Older installations ran the sync foundation SQL before SQLx's numbered
/// migrations. Adopt that already-present schema into version 0000's ledger
/// before the migrator sees versions 0001..N. New databases execute 0000 as a
/// normal SQLx migration. This preserves data and checksum validation.
async fn record_legacy_foundation(pool: &PgPool) -> Result<(), sqlx::Error> {
    let foundation_exists: bool = sqlx::query_scalar(
        "SELECT to_regclass('public.cloud_inventory_items') IS NOT NULL
            AND to_regclass('public.cloud_prices') IS NOT NULL
            AND to_regclass('public.cloud_price_history') IS NOT NULL
            AND to_regclass('public.cloud_daily_summaries') IS NOT NULL
            AND to_regclass('public.sync_changes') IS NOT NULL
            AND to_regclass('public.sync_devices') IS NOT NULL",
    )
    .fetch_one(pool)
    .await?;

    if !foundation_exists {
        return Ok(());
    }

    let Some(migration) = MIGRATOR.iter().find(|migration| migration.version == 0) else {
        return Err(sqlx::Error::Protocol(
            "version 0000 sync foundation migration is missing".into(),
        ));
    };

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS _sqlx_migrations (
            version BIGINT PRIMARY KEY,
            description TEXT NOT NULL,
            installed_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            success BOOLEAN NOT NULL,
            checksum BYTEA NOT NULL,
            execution_time BIGINT NOT NULL
        )",
    )
    .execute(pool)
    .await?;

    // SQLx uses the same schema/table/columns on PostgreSQL. ON CONFLICT makes
    // the adoption safe if concurrent API instances start together.
    sqlx::query(
        "INSERT INTO _sqlx_migrations (version, description, success, checksum, execution_time)
         VALUES ($1, $2, TRUE, $3, 0) ON CONFLICT (version) DO NOTHING",
    )
    .bind(migration.version)
    .bind(migration.description.as_ref())
    .bind(migration.checksum.as_ref())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn run(pool: &PgPool) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    record_legacy_foundation(pool).await?;
    MIGRATOR.run(pool).await?;
    Ok(())
}
