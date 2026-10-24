use sqlx::{SqliteConnection, Connection};
use uuid::Uuid;
use crate::sync::types::{ChangeAck, AckStatus, OutboxChange};

pub async fn enqueue_bootstrap(conn: &mut SqliteConnection) -> Result<(), sqlx::Error> {
    let bootstrap_done: Option<i64> = sqlx::query_scalar(
        "SELECT bootstrap_done FROM sync_state LIMIT 1"
    )
    .fetch_optional(&mut *conn)
    .await?;

    if let Some(1) = bootstrap_done {
        return Ok(());
    }

    let mut tx = conn.begin().await?;

    // 1. Business rows (allowlist: exclude logo_url, appearance_mode, tier)
    let businesses: Vec<(String, String, String, i64, Option<String>)> = sqlx::query_as(
        "SELECT id, workspace_id, branch_id, version, deleted_at FROM business"
    )
    .fetch_all(&mut *tx)
    .await?;

    for (id, workspace_id, branch_id, version, deleted_at) in businesses {
        let payload = sqlx::query_scalar::<_, String>(
            "SELECT json_object(
                'id', id, 'workspace_id', workspace_id, 'branch_id', branch_id, 'business_id', business_id,
                'name', name, 'tin', tin, 'tmda_number', tmda_number,
                'pharmacy_council_no', pharmacy_council_no, 'role_scopes', role_scopes,
                'contact_mobile', contact_mobile, 'contact_email', contact_email, 'contact_whatsapp', contact_whatsapp,
                'address_region', address_region, 'address_district', address_district, 'address_place', address_place,
                'version', version, 'deleted_at', deleted_at,
                'created_at', created_at, 'updated_at', updated_at
            ) FROM business WHERE id = ?"
        )
        .bind(&id)
        .fetch_one(&mut *tx)
        .await?;

        let change_id = Uuid::new_v4().to_string();
        let op = if deleted_at.is_some() { "delete" } else { "upsert" };
        sqlx::query(
            "INSERT OR IGNORE INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status)
             VALUES (?, ?, ?, 'business', ?, ?, ?, ?, 'pending')"
        )
        .bind(change_id)
        .bind(&workspace_id)
        .bind(&branch_id)
        .bind(&id)
        .bind(op)
        .bind(payload)
        .bind(version)
        .execute(&mut *tx)
        .await?;
    }

    // 2. Inventory item rows
    let items: Vec<(String, String, String, i64, Option<String>)> = sqlx::query_as(
        "SELECT id, workspace_id, branch_id, version, deleted_at FROM inventory_item"
    )
    .fetch_all(&mut *tx)
    .await?;

    for (id, workspace_id, branch_id, version, deleted_at) in items {
        let payload = sqlx::query_scalar::<_, String>(
            "SELECT json_object(
                'id', id, 'workspace_id', workspace_id, 'branch_id', branch_id, 'medicine_id', medicine_id,
                'batch_number', batch_number, 'expiry_date', expiry_date, 'buy_price', buy_price, 'sell_price', sell_price,
                'quantity', quantity, 'low_stock_threshold', low_stock_threshold, 'cold_chain_required', cold_chain_required,
                'is_deactivated', is_deactivated, 'version', version, 'deleted_at', deleted_at, 'created_at', created_at, 'updated_at', updated_at
            ) FROM inventory_item WHERE id = ?"
        )
        .bind(&id)
        .fetch_one(&mut *tx)
        .await?;

        let change_id = Uuid::new_v4().to_string();
        let op = if deleted_at.is_some() { "delete" } else { "upsert" };
        sqlx::query(
            "INSERT OR IGNORE INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status)
             VALUES (?, ?, ?, 'inventory_item', ?, ?, ?, ?, 'pending')"
        )
        .bind(change_id)
        .bind(&workspace_id)
        .bind(&branch_id)
        .bind(&id)
        .bind(op)
        .bind(payload)
        .bind(version)
        .execute(&mut *tx)
        .await?;
    }

    // 3. Price rows
    let prices: Vec<(String, String, String, i64, Option<String>)> = sqlx::query_as(
        "SELECT id, workspace_id, branch_id, version, deleted_at FROM price"
    )
    .fetch_all(&mut *tx)
    .await?;

    for (id, workspace_id, branch_id, version, deleted_at) in prices {
        let payload = sqlx::query_scalar::<_, String>(
            "SELECT json_object(
                'id', id, 'workspace_id', workspace_id, 'branch_id', branch_id, 'inventory_item_id', inventory_item_id,
                'selling_price', selling_price, 'cost_price', cost_price, 'version', version, 'deleted_at', deleted_at,
                'created_at', created_at, 'updated_at', updated_at
            ) FROM price WHERE id = ?"
        )
        .bind(&id)
        .fetch_one(&mut *tx)
        .await?;

        let change_id = Uuid::new_v4().to_string();
        let op = if deleted_at.is_some() { "delete" } else { "upsert" };
        sqlx::query(
            "INSERT OR IGNORE INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status)
             VALUES (?, ?, ?, 'price', ?, ?, ?, ?, 'pending')"
        )
        .bind(change_id)
        .bind(&workspace_id)
        .bind(&branch_id)
        .bind(&id)
        .bind(op)
        .bind(payload)
        .bind(version)
        .execute(&mut *tx)
        .await?;
    }

    // 4. Price History rows
    let histories: Vec<(String, String, String, i64)> = sqlx::query_as(
        "SELECT id, workspace_id, branch_id, version FROM price_history"
    )
    .fetch_all(&mut *tx)
    .await?;

    for (id, workspace_id, branch_id, version) in histories {
        let payload = sqlx::query_scalar::<_, String>(
            "SELECT json_object(
                'id', id, 'workspace_id', workspace_id, 'branch_id', branch_id, 'inventory_item_id', inventory_item_id,
                'selling_price', selling_price, 'cost_price', cost_price, 'changed_at', changed_at, 'version', version
            ) FROM price_history WHERE id = ?"
        )
        .bind(&id)
        .fetch_one(&mut *tx)
        .await?;

        let change_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT OR IGNORE INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status)
             VALUES (?, ?, ?, 'price_history', ?, 'upsert', ?, ?, 'pending')"
        )
        .bind(change_id)
        .bind(&workspace_id)
        .bind(&branch_id)
        .bind(&id)
        .bind(payload)
        .bind(version)
        .execute(&mut *tx)
        .await?;
    }

    // 5. Daily summary rows
    let summaries: Vec<(String, String, String, i64)> = sqlx::query_as(
        "SELECT id, workspace_id, branch_id, version FROM daily_summary"
    )
    .fetch_all(&mut *tx)
    .await?;

    for (id, workspace_id, branch_id, version) in summaries {
        let payload = sqlx::query_scalar::<_, String>(
            "SELECT json_object(
                'id', id, 'workspace_id', workspace_id, 'branch_id', branch_id, 'summary_date', summary_date,
                'revenue_total', revenue_total, 'tx_count', tx_count, 'items_sold', items_sold, 'version', version, 'updated_at', updated_at
            ) FROM daily_summary WHERE id = ?"
        )
        .bind(&id)
        .fetch_one(&mut *tx)
        .await?;

        let change_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT OR IGNORE INTO sync_outbox (id, workspace_id, branch_id, entity, entity_id, op, payload, version, status)
             VALUES (?, ?, ?, 'daily_summary', ?, 'upsert', ?, ?, 'pending')"
        )
        .bind(change_id)
        .bind(&workspace_id)
        .bind(&branch_id)
        .bind(&id)
        .bind(payload)
        .bind(version)
        .execute(&mut *tx)
        .await?;
    }

    sqlx::query("UPDATE sync_state SET bootstrap_done = 1")
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(())
}

pub async fn next_batch(conn: &mut SqliteConnection, limit: i64) -> Result<Vec<OutboxChange>, sqlx::Error> {
    let mut tx = conn.begin().await?;

    let rows: Vec<OutboxChange> = sqlx::query_as(
        "SELECT id, workspace_id, branch_id, entity, entity_id, op, payload, version, status, attempts, last_error, created_at
         FROM sync_outbox_compacted
         ORDER BY created_at ASC
         LIMIT ?"
    )
    .bind(limit)
    .fetch_all(&mut *tx)
    .await?;

    if !rows.is_empty() {
        let ids: Vec<&str> = rows.iter().map(|r| r.id.as_str()).collect();
        for id in ids {
            sqlx::query(
                "UPDATE sync_outbox SET status = 'inflight', attempts = attempts + 1 WHERE id = ?"
            )
            .bind(id)
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;
    Ok(rows)
}

pub async fn ack(conn: &mut SqliteConnection, results: Vec<ChangeAck>) -> Result<(), sqlx::Error> {
    let mut tx = conn.begin().await?;

    for ack in results {
        match ack.status {
            AckStatus::Applied => {
                let info: Option<(String, String, String)> = sqlx::query_as(
                    "SELECT entity, entity_id, created_at FROM sync_outbox WHERE id = ?"
                )
                .bind(&ack.change_id)
                .fetch_optional(&mut *tx)
                .await?;

                if let Some((entity, entity_id, created_at)) = info {
                    sqlx::query(
                        "UPDATE sync_outbox
                         SET status = 'done'
                         WHERE entity = ? AND entity_id = ? AND status IN ('pending', 'inflight') AND created_at <= ?"
                    )
                    .bind(&entity)
                    .bind(&entity_id)
                    .bind(&created_at)
                    .execute(&mut *tx)
                    .await?;
                } else {
                    sqlx::query("UPDATE sync_outbox SET status = 'done' WHERE id = ?")
                        .bind(&ack.change_id)
                        .execute(&mut *tx)
                        .await?;
                }
            }
            AckStatus::Stale | AckStatus::Rejected => {
                let reason = ack.reason.unwrap_or_else(|| "Rejected/Stale by server".into());
                sqlx::query("UPDATE sync_outbox SET status = 'failed', last_error = ? WHERE id = ?")
                    .bind(reason)
                    .bind(&ack.change_id)
                    .execute(&mut *tx)
                    .await?;
            }
        }
    }

    sqlx::query("UPDATE sync_state SET last_ack_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(())
}

pub async fn requeue_stale_inflight(conn: &mut SqliteConnection, older_than_secs: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE sync_outbox
         SET status = 'pending'
         WHERE status = 'inflight'
           AND datetime(created_at) <= datetime('now', '-' || ? || ' seconds')"
    )
    .bind(older_than_secs)
    .execute(conn)
    .await?;
    Ok(())
}

pub async fn pending_count(conn: &mut SqliteConnection) -> Result<i64, sqlx::Error> {
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM sync_outbox_compacted"
    )
    .fetch_one(conn)
    .await?;
    Ok(count)
}

pub async fn purge_done(conn: &mut SqliteConnection, older_than_days: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        "DELETE FROM sync_outbox
         WHERE status = 'done'
           AND datetime(created_at) <= datetime('now', '-' || ? || ' days')"
    )
    .bind(older_than_days)
    .execute(conn)
    .await?;
    Ok(())
}
