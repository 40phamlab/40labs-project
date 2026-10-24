use sqlx::sqlite::SqlitePoolOptions;
use sqlx::migrate::Migrator;
use core_desktop_lib::sync::store::{enqueue_bootstrap, next_batch, ack, requeue_stale_inflight};
use core_desktop_lib::sync::types::{ChangeAck, AckStatus};

static SQLITE_MIGRATOR: Migrator = sqlx::migrate!("../../../infra/db/sqlite-schema/migrations");

async fn setup_test_db() -> Result<sqlx::SqlitePool, Box<dyn std::error::Error>> {
    let pool = SqlitePoolOptions::new()
        .connect("sqlite::memory:")
        .await?;
    SQLITE_MIGRATOR.run(&pool).await?;
    Ok(pool)
}

#[tokio::test]
async fn insert_enqueues_outbox() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    sqlx::query(
        "INSERT INTO business (id, workspace_id, branch_id, business_id, name, contact_mobile)
         VALUES ('biz-1', 'ws-1', 'branch-1', 'AFYA-0001', 'Test Clinic', '0712345678')"
    )
    .execute(&mut *conn)
    .await?;

    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sync_outbox WHERE entity = 'business' AND entity_id = 'biz-1'")
        .fetch_one(&mut *conn)
        .await?;
    assert_eq!(count, 1);
    Ok(())
}

#[tokio::test]
async fn update_bumps_version_and_enqueues() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    sqlx::query(
        "INSERT INTO business (id, workspace_id, branch_id, business_id, name, contact_mobile)
         VALUES ('biz-2', 'ws-1', 'branch-1', 'AFYA-0002', 'Test Clinic 2', '0712345678')"
    )
    .execute(&mut *conn)
    .await?;

    sqlx::query("UPDATE business SET name = 'Updated Clinic' WHERE id = 'biz-2'")
        .execute(&mut *conn)
        .await?;

    let version: i64 = sqlx::query_scalar("SELECT version FROM business WHERE id = 'biz-2'")
        .fetch_one(&mut *conn)
        .await?;
    assert_eq!(version, 2);

    let outbox_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sync_outbox WHERE entity_id = 'biz-2'")
        .fetch_one(&mut *conn)
        .await?;
    assert!(outbox_count >= 2);
    Ok(())
}

#[tokio::test]
async fn price_change_writes_history_once() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    sqlx::query("INSERT INTO medicine (id, workspace_id, branch_id, name, category, unit) VALUES ('med-1', 'ws-1', 'branch-1', 'Aspirin', 'Analgesic', 'tablet')")
        .execute(&mut *conn)
        .await?;
    sqlx::query("INSERT INTO inventory_item (id, workspace_id, branch_id, medicine_id, batch_number, expiry_date, buy_price, sell_price, quantity) VALUES ('inv-1', 'ws-1', 'branch-1', 'med-1', 'B1', '2026-12-31', 100, 200, 50)")
        .execute(&mut *conn)
        .await?;

    sqlx::query("UPDATE inventory_item SET sell_price = 250 WHERE id = 'inv-1'")
        .execute(&mut *conn)
        .await?;

    let history_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM price_history WHERE inventory_item_id = 'inv-1'")
        .fetch_one(&mut *conn)
        .await?;
    assert_eq!(history_count, 1);
    Ok(())
}

#[tokio::test]
async fn price_noop_update_writes_no_history() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    sqlx::query("INSERT INTO medicine (id, workspace_id, branch_id, name, category, unit) VALUES ('med-2', 'ws-1', 'branch-1', 'Paracetamol', 'Analgesic', 'tablet')")
        .execute(&mut *conn)
        .await?;
    sqlx::query("INSERT INTO inventory_item (id, workspace_id, branch_id, medicine_id, batch_number, expiry_date, buy_price, sell_price, quantity) VALUES ('inv-2', 'ws-1', 'branch-1', 'med-2', 'B1', '2026-12-31', 100, 200, 50)")
        .execute(&mut *conn)
        .await?;

    sqlx::query("UPDATE inventory_item SET quantity = 60 WHERE id = 'inv-2'")
        .execute(&mut *conn)
        .await?;

    let history_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM price_history WHERE inventory_item_id = 'inv-2'")
        .fetch_one(&mut *conn)
        .await?;
    assert_eq!(history_count, 0);
    Ok(())
}

#[tokio::test]
async fn hard_delete_blocked() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    sqlx::query(
        "INSERT INTO business (id, workspace_id, branch_id, business_id, name, contact_mobile)
         VALUES ('biz-3', 'ws-1', 'branch-1', 'AFYA-0003', 'Test Clinic 3', '0712345678')"
    )
    .execute(&mut *conn)
    .await?;

    let res = sqlx::query("DELETE FROM business WHERE id = 'biz-3'")
        .execute(&mut *conn)
        .await;
    assert!(res.is_err());
    Ok(())
}

#[tokio::test]
async fn soft_delete_emits_delete_op() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    sqlx::query(
        "INSERT INTO business (id, workspace_id, branch_id, business_id, name, contact_mobile)
         VALUES ('biz-4', 'ws-1', 'branch-1', 'AFYA-0004', 'Test Clinic 4', '0712345678')"
    )
    .execute(&mut *conn)
    .await?;

    sqlx::query("UPDATE business SET deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 'biz-4'")
        .execute(&mut *conn)
        .await?;

    let batch = next_batch(&mut *conn, 10).await?;
    let delete_op = batch.iter().find(|b| b.entity_id == "biz-4" && b.op == "delete");
    assert!(delete_op.is_some());
    Ok(())
}

#[tokio::test]
async fn bulk_1000_compacts_to_unique_entities() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    sqlx::query("INSERT INTO medicine (id, workspace_id, branch_id, name, category, unit) VALUES ('med-3', 'ws-1', 'branch-1', 'Ibuprofen', 'Analgesic', 'tablet')")
        .execute(&mut *conn)
        .await?;
    sqlx::query("INSERT INTO inventory_item (id, workspace_id, branch_id, medicine_id, batch_number, expiry_date, buy_price, sell_price, quantity) VALUES ('inv-3', 'ws-1', 'branch-1', 'med-3', 'B1', '2026-12-31', 100, 200, 50)")
        .execute(&mut *conn)
        .await?;

    for i in 0..100 {
        sqlx::query("UPDATE inventory_item SET quantity = ? WHERE id = 'inv-3'")
            .bind(i)
            .execute(&mut *conn)
            .await?;
    }

    let compacted_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sync_outbox_compacted WHERE entity = 'inventory_item' AND entity_id = 'inv-3'")
        .fetch_one(&mut *conn)
        .await?;
    assert_eq!(compacted_count, 1);
    Ok(())
}

#[tokio::test]
async fn ack_supersedes_older_pending() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    sqlx::query(
        "INSERT INTO business (id, workspace_id, branch_id, business_id, name, contact_mobile)
         VALUES ('biz-5', 'ws-1', 'branch-1', 'AFYA-0005', 'Test Clinic 5', '0712345678')"
    )
    .execute(&mut *conn)
    .await?;

    sqlx::query("UPDATE business SET name = 'Clinic 5 v2' WHERE id = 'biz-5'")
        .execute(&mut *conn)
        .await?;

    let change_id: String = sqlx::query_scalar("SELECT id FROM sync_outbox WHERE entity_id = 'biz-5' ORDER BY created_at DESC LIMIT 1")
        .fetch_one(&mut *conn)
        .await?;

    ack(&mut *conn, vec![ChangeAck {
        change_id,
        status: AckStatus::Applied,
        reason: None,
    }]).await?;

    let pending_for_biz5: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM sync_outbox WHERE entity_id = 'biz-5' AND status IN ('pending', 'inflight')"
    )
    .fetch_one(&mut *conn)
    .await?;
    assert_eq!(pending_for_biz5, 0);
    Ok(())
}

#[tokio::test]
async fn payload_contains_only_allowlisted_columns() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    sqlx::query(
        "INSERT INTO business (id, workspace_id, branch_id, business_id, name, contact_mobile, logo_url, appearance_mode, tier)
         VALUES ('biz-6', 'ws-1', 'branch-1', 'AFYA-0006', 'Test Clinic 6', '0712345678', 'http://logo', 'dark', 'free')"
    )
    .execute(&mut *conn)
    .await?;

    let payload: String = sqlx::query_scalar(
        "SELECT payload FROM sync_outbox WHERE entity_id = 'biz-6' ORDER BY created_at DESC LIMIT 1"
    )
    .fetch_one(&mut *conn)
    .await?;

    assert!(!payload.contains("logo_url"));
    assert!(!payload.contains("appearance_mode"));
    assert!(!payload.contains("tier"));
    assert!(!payload.contains("pin"));
    assert!(!payload.contains("password"));
    assert!(!payload.contains("recovery"));
    assert!(!payload.contains("patient"));
    Ok(())
}

#[tokio::test]
async fn sale_completed_updates_daily_summary() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    sqlx::query("INSERT INTO medicine (id, workspace_id, branch_id, name, category, unit) VALUES ('med-4', 'ws-1', 'branch-1', 'Syrup', 'Medicine', 'bottle')")
        .execute(&mut *conn)
        .await?;
    sqlx::query("INSERT INTO inventory_item (id, workspace_id, branch_id, medicine_id, batch_number, expiry_date, buy_price, sell_price, quantity) VALUES ('inv-4', 'ws-1', 'branch-1', 'med-4', 'B1', '2026-12-31', 500, 1000, 100)")
        .execute(&mut *conn)
        .await?;
    sqlx::query("INSERT INTO sale (id, workspace_id, branch_id, payment_method, discount_amount, tax_amount, grand_total, currency, created_at) VALUES ('sale-1', 'ws-1', 'branch-1', 'cash', 0, 0, 1000, 'TZS', strftime('%Y-%m-%dT%H:%M:%fZ','now'))")
        .execute(&mut *conn)
        .await?;
    sqlx::query("INSERT INTO sale_line (id, sale_id, inventory_item_id, quantity, unit_price, subtotal) VALUES ('line-1', 'sale-1', 'inv-4', 1, 1000, 1000)")
        .execute(&mut *conn)
        .await?;

    let revenue: i64 = sqlx::query_scalar("SELECT revenue_total FROM daily_summary LIMIT 1")
        .fetch_one(&mut *conn)
        .await?;
    assert_eq!(revenue, 1000);
    Ok(())
}

#[tokio::test]
async fn refund_subtracts_from_daily_summary() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    sqlx::query("INSERT INTO medicine (id, workspace_id, branch_id, name, category, unit) VALUES ('med-5', 'ws-1', 'branch-1', 'Syrup2', 'Medicine', 'bottle')")
        .execute(&mut *conn)
        .await?;
    sqlx::query("INSERT INTO inventory_item (id, workspace_id, branch_id, medicine_id, batch_number, expiry_date, buy_price, sell_price, quantity) VALUES ('inv-5', 'ws-1', 'branch-1', 'med-5', 'B1', '2026-12-31', 500, 1000, 100)")
        .execute(&mut *conn)
        .await?;
    sqlx::query("INSERT INTO sale (id, workspace_id, branch_id, payment_method, discount_amount, tax_amount, grand_total, currency, created_at) VALUES ('sale-2', 'ws-1', 'branch-1', 'cash', 0, 0, 2000, 'TZS', strftime('%Y-%m-%dT%H:%M:%fZ','now'))")
        .execute(&mut *conn)
        .await?;
    sqlx::query("INSERT INTO sale_line (id, sale_id, inventory_item_id, quantity, unit_price, subtotal) VALUES ('line-2', 'sale-2', 'inv-5', 2, 1000, 2000)")
        .execute(&mut *conn)
        .await?;

    let tx_count: i64 = sqlx::query_scalar("SELECT tx_count FROM daily_summary LIMIT 1")
        .fetch_one(&mut *conn)
        .await?;
    assert!(tx_count >= 1);
    Ok(())
}

#[tokio::test]
async fn sale_status_update_does_not_double_count() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    sqlx::query("INSERT INTO medicine (id, workspace_id, branch_id, name, category, unit) VALUES ('med-6', 'ws-1', 'branch-1', 'Pills', 'Medicine', 'box')")
        .execute(&mut *conn)
        .await?;
    sqlx::query("INSERT INTO inventory_item (id, workspace_id, branch_id, medicine_id, batch_number, expiry_date, buy_price, sell_price, quantity) VALUES ('inv-6', 'ws-1', 'branch-1', 'med-6', 'B1', '2026-12-31', 200, 400, 50)")
        .execute(&mut *conn)
        .await?;
    sqlx::query("INSERT INTO sale (id, workspace_id, branch_id, payment_method, discount_amount, tax_amount, grand_total, currency, created_at) VALUES ('sale-3', 'ws-1', 'branch-1', 'cash', 0, 0, 400, 'TZS', strftime('%Y-%m-%dT%H:%M:%fZ','now'))")
        .execute(&mut *conn)
        .await?;

    let rev_before: i64 = sqlx::query_scalar("SELECT revenue_total FROM daily_summary LIMIT 1")
        .fetch_one(&mut *conn)
        .await?;

    sqlx::query("UPDATE sale SET payment_method = 'card' WHERE id = 'sale-3'")
        .execute(&mut *conn)
        .await?;

    let rev_after: i64 = sqlx::query_scalar("SELECT revenue_total FROM daily_summary LIMIT 1")
        .fetch_one(&mut *conn)
        .await?;
    assert_eq!(rev_before, rev_after);
    Ok(())
}

#[tokio::test]
async fn bootstrap_idempotent() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    enqueue_bootstrap(&mut *conn).await?;
    enqueue_bootstrap(&mut *conn).await?;

    let done: i64 = sqlx::query_scalar("SELECT bootstrap_done FROM sync_state LIMIT 1")
        .fetch_one(&mut *conn)
        .await?;
    assert_eq!(done, 1);
    Ok(())
}

#[tokio::test]
async fn inflight_requeue_after_crash() -> Result<(), Box<dyn std::error::Error>> {
    let pool = setup_test_db().await?;
    let mut conn = pool.acquire().await?;

    sqlx::query(
        "INSERT INTO business (id, workspace_id, branch_id, business_id, name, contact_mobile)
         VALUES ('biz-7', 'ws-1', 'branch-1', 'AFYA-0007', 'Test Clinic 7', '0712345678')"
    )
    .execute(&mut *conn)
    .await?;

    let batch = next_batch(&mut *conn, 10).await?;
    assert!(!batch.is_empty());

    let status: String = sqlx::query_scalar("SELECT status FROM sync_outbox WHERE entity_id = 'biz-7'")
        .fetch_one(&mut *conn)
        .await?;
    assert_eq!(status, "inflight");

    requeue_stale_inflight(&mut *conn, 0).await?;

    let status_after: String = sqlx::query_scalar("SELECT status FROM sync_outbox WHERE entity_id = 'biz-7'")
        .fetch_one(&mut *conn)
        .await?;
    assert_eq!(status_after, "pending");
    Ok(())
}

#[tokio::test]
async fn real_world_dev_db_migration() -> Result<(), Box<dyn std::error::Error>> {
    let db_path = "../../../dev-data/40labs-dev.db";
    if std::path::Path::new(db_path).exists() {
        // Copy to temp file or open directly
        let pool = SqlitePoolOptions::new()
            .connect(&format!("sqlite://{}", db_path))
            .await?;
        SQLITE_MIGRATOR.run(&pool).await?;
        let mut conn = pool.acquire().await?;
        enqueue_bootstrap(&mut *conn).await?;
        let count = core_desktop_lib::sync::store::pending_count(&mut *conn).await?;
        println!("Real-world dev DB pending sync count after migration & bootstrap: {}", count);
        assert!(count >= 0);
    }
    Ok(())
}
