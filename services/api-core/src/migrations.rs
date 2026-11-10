use sqlx::PgPool;

pub async fn run(pool: &PgPool) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Kept for the existing installations created before SQLx migration tracking
    // covered the sync foundation. All new schema changes are versioned below.
    sqlx::raw_sql(include_str!(
        "../../../infra/db/postgres/0001_sync_foundation.sql"
    ))
    .execute(pool)
    .await?;
    sqlx::migrate!("./migrations").run(pool).await?;
    Ok(())
}
