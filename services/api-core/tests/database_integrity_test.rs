use sqlx::{
    migrate::MigrateDatabase, migrate::Migrator, postgres::PgPoolOptions, PgPool, Postgres,
};
use std::{borrow::Cow, fs, path::PathBuf};

async fn isolated_pool() -> PgPool {
    let url = std::env::var("API_CORE_TEST_DATABASE_URL")
        .expect("API_CORE_TEST_DATABASE_URL must point to a disposable test database");
    let pool = PgPoolOptions::new()
        .max_connections(4)
        .connect(&url)
        .await
        .expect("connect isolated PostgreSQL test database");
    api_core::migrations::run(&pool)
        .await
        .expect("fresh/upgrade migrations should complete");
    api_core::migrations::run(&pool)
        .await
        .expect("migration runner should be idempotent");
    pool
}

#[tokio::test]
async fn postgres_migration_ledger_and_tenant_integrity_constraints() {
    let pool = isolated_pool().await;
    let applied: Vec<i64> = sqlx::query_scalar(
        "SELECT version FROM _sqlx_migrations WHERE version IN (0, 8) AND success ORDER BY version",
    )
    .fetch_all(&pool)
    .await
    .unwrap();
    assert_eq!(applied, vec![0, 8]);

    let suffix = uuid::Uuid::new_v4().to_string();
    let item_id = format!("item-{suffix}");
    sqlx::query(
        "INSERT INTO cloud_inventory_items
         (id,workspace_id,branch_id,medicine_id,batch_number,expiry_date,buy_price,sell_price,quantity,low_stock_threshold,cold_chain_required,is_deactivated,version,source_device_id)
         VALUES ($1,'ws-db-test','branch-a','med-1','batch-1','2030-01-01',100,150,5,1,FALSE,FALSE,1,'device-1')",
    )
    .bind(&item_id)
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query(
        "INSERT INTO cloud_prices (id,workspace_id,branch_id,inventory_item_id,selling_price,cost_price,version,source_device_id)
         VALUES ($1,'ws-db-test','branch-a',$2,150,100,1,'device-1')",
    )
    .bind(format!("price-{suffix}"))
    .bind(&item_id)
    .execute(&pool)
    .await
    .unwrap();

    let history_id = format!("history-{suffix}");
    sqlx::query(
        "INSERT INTO cloud_price_history (id,workspace_id,branch_id,inventory_item_id,selling_price,cost_price,version,source_device_id)
         VALUES ($1,'ws-db-test','branch-a',$2,150,100,1,'device-1')",
    )
    .bind(&history_id)
    .bind(&item_id)
    .execute(&pool)
    .await
    .unwrap();
    assert!(
        sqlx::query("UPDATE cloud_price_history SET selling_price=200 WHERE id=$1")
            .bind(&history_id)
            .execute(&pool)
            .await
            .is_err()
    );
    assert!(sqlx::query("DELETE FROM cloud_price_history WHERE id=$1")
        .bind(&history_id)
        .execute(&pool)
        .await
        .is_err());

    let cross_tenant = sqlx::query(
        "INSERT INTO cloud_prices (id,workspace_id,branch_id,inventory_item_id,selling_price,cost_price,version,source_device_id)
         VALUES ($1,'ws-other','branch-a',$2,150,100,1,'device-2')",
    )
    .bind(format!("bad-price-{suffix}"))
    .bind(&item_id)
    .execute(&pool)
    .await;
    assert!(
        cross_tenant.is_err(),
        "cross-workspace price reference must fail"
    );
    let cross_branch = sqlx::query(
        "INSERT INTO cloud_prices (id,workspace_id,branch_id,inventory_item_id,selling_price,cost_price,version,source_device_id)
         VALUES ($1,'ws-db-test','branch-b',$2,150,100,1,'device-2')",
    )
    .bind(format!("bad-branch-price-{suffix}"))
    .bind(&item_id)
    .execute(&pool)
    .await;
    assert!(
        cross_branch.is_err(),
        "cross-branch price reference must fail"
    );
    let rejected_count: i64 =
        sqlx::query_scalar("SELECT count(*) FROM cloud_prices WHERE id IN ($1,$2)")
            .bind(format!("bad-price-{suffix}"))
            .bind(format!("bad-branch-price-{suffix}"))
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(rejected_count, 0, "rejected writes must leave no rows");

    let reassignment =
        sqlx::query("UPDATE cloud_inventory_items SET branch_id='branch-b' WHERE id=$1")
            .bind(&item_id)
            .execute(&pool)
            .await;
    assert!(
        reassignment.is_err(),
        "inventory branch reassignment must fail"
    );

    let mut tx = pool.begin().await.unwrap();
    sqlx::query(
        "INSERT INTO cloud_inventory_items
         (id,workspace_id,branch_id,medicine_id,batch_number,expiry_date,buy_price,sell_price,quantity,low_stock_threshold,cold_chain_required,is_deactivated,version,source_device_id)
         VALUES ($1,'ws-db-test','branch-a','med-2','batch-2','2030-01-01',100,150,5,1,FALSE,FALSE,1,'device-1')",
    )
    .bind(format!("rolled-back-{suffix}"))
    .execute(&mut *tx)
    .await
    .unwrap();
    tx.rollback().await.unwrap();
    let rolled_back: bool =
        sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM cloud_inventory_items WHERE id=$1)")
            .bind(format!("rolled-back-{suffix}"))
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(!rolled_back, "rolled back transaction must leave no row");

    pool.close().await;
}

#[tokio::test]
async fn legacy_postgres_bootstrap_is_adopted_without_data_loss() {
    let mut database_url = url::Url::parse(
        &std::env::var("API_CORE_TEST_DATABASE_URL")
            .expect("API_CORE_TEST_DATABASE_URL must point to a disposable test database"),
    )
    .unwrap();
    let database_name = format!("40labs_legacy_{}", uuid::Uuid::new_v4().simple());
    database_url.set_path(&database_name);
    let database_url = database_url.to_string();
    Postgres::create_database(&database_url)
        .await
        .expect("create isolated legacy-upgrade database");

    async {
        let pool = PgPoolOptions::new()
            .max_connections(4)
            .connect(&database_url)
            .await
            .unwrap();
        sqlx::raw_sql(include_str!("../../../infra/db/postgres/0001_sync_foundation.sql"))
            .execute(&pool)
            .await
            .unwrap();
        sqlx::query(
            "INSERT INTO business_registry (business_id,workspace_id,branch_id,phone_hash,terms_version,terms_locale,terms_text_sha256,terms_accepted_at,created_at)
             VALUES ('legacy-business','legacy-workspace','legacy-branch','legacy-phone-hash','v1','en','sha256','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')",
        )
        .execute(&pool)
        .await
        .unwrap();

        let all = Migrator::new(PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("migrations"))
            .await
            .unwrap();
        let old_migrator = Migrator {
            migrations: Cow::Owned(
                all.iter()
                    .filter(|migration| (1..=7).contains(&migration.version))
                    .cloned()
                    .collect(),
            ),
            ..Migrator::DEFAULT
        };
        old_migrator.run(&pool).await.unwrap();
        api_core::migrations::run(&pool)
            .await
            .expect("adopt legacy baseline then apply new forward migrations");

        let ledger: Vec<i64> = sqlx::query_scalar(
            "SELECT version FROM _sqlx_migrations WHERE success ORDER BY version",
        )
        .fetch_all(&pool)
        .await
        .unwrap();
        assert_eq!(ledger, (0..=9).collect::<Vec<i64>>());
        let preserved: String = sqlx::query_scalar(
            "SELECT workspace_id FROM business_registry WHERE business_id='legacy-business'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(preserved, "legacy-workspace");
        pool.close().await;
    }
    .await;

    Postgres::drop_database(&database_url)
        .await
        .expect("drop only the uniquely named isolated legacy test database");
}

#[tokio::test]
async fn failed_postgres_migration_rolls_back_ddl_and_tracking_row() {
    use sqlx::migrate::Migrator;

    let pool = isolated_pool().await;
    let dir = std::env::temp_dir().join(format!(
        "40labs pg migration failure {}",
        uuid::Uuid::new_v4()
    ));
    fs::create_dir_all(&dir).unwrap();
    fs::write(
        dir.join("9999_forced_failure.sql"),
        "CREATE TABLE migration_should_rollback (id TEXT PRIMARY KEY); INSERT INTO missing_migration_table VALUES ('x');",
    )
    .unwrap();
    let mut failing = Migrator::new(PathBuf::from(&dir)).await.unwrap();
    failing.set_ignore_missing(true);
    assert!(failing.run(&pool).await.is_err());
    let table_exists: bool =
        sqlx::query_scalar("SELECT to_regclass('public.migration_should_rollback') IS NOT NULL")
            .fetch_one(&pool)
            .await
            .unwrap();
    let migration_recorded: bool =
        sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM _sqlx_migrations WHERE version=9999)")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(!table_exists, "transactional migration DDL must roll back");
    assert!(
        !migration_recorded,
        "failed migration must not be marked applied"
    );
    pool.close().await;
    fs::remove_dir_all(dir).unwrap();
}
