use sqlx::PgConnection;
use serde::Deserialize;
use crate::error::ApiError;
use crate::auth::device::DeviceClaims;
use crate::sync::validate::ChangeItem;

#[derive(serde::Serialize, Debug)]
pub struct ChangeAckResponse {
    pub change_id: String,
    pub status: String, // 'applied' | 'stale' | 'rejected'
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
struct BusinessPayload {
    id: String,
    workspace_id: String,
    branch_id: String,
    business_id: String,
    name: String,
    tin: Option<String>,
    tmda_number: Option<String>,
    pharmacy_council_no: Option<String>,
    role_scopes: Option<String>,
    contact_mobile: Option<String>,
    contact_email: Option<String>,
    contact_whatsapp: Option<String>,
    address_region: Option<String>,
    address_district: Option<String>,
    address_place: Option<String>,
    version: i64,
    updated_at: Option<String>,
    deleted_at: Option<String>,
}

#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
struct InventoryItemPayload {
    id: String,
    workspace_id: String,
    branch_id: String,
    medicine_id: String,
    batch_number: String,
    expiry_date: String,
    buy_price: i64,
    sell_price: i64,
    quantity: i32,
    low_stock_threshold: i32,
    cold_chain_required: bool,
    is_deactivated: bool,
    version: i64,
    deleted_at: Option<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
struct PricePayload {
    id: String,
    workspace_id: String,
    branch_id: String,
    inventory_item_id: String,
    selling_price: i64,
    cost_price: i64,
    version: i64,
    deleted_at: Option<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
struct PriceHistoryPayload {
    id: String,
    workspace_id: String,
    branch_id: String,
    inventory_item_id: String,
    selling_price: i64,
    cost_price: i64,
    changed_at: String,
    version: i64,
}

#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
struct DailySummaryPayload {
    id: String,
    workspace_id: String,
    branch_id: String,
    summary_date: String,
    revenue_total: i64,
    tx_count: i32,
    items_sold: i32,
    version: i64,
    updated_at: String,
}

pub async fn apply_change(
    conn: &mut PgConnection,
    claims: &DeviceClaims,
    change: &ChangeItem,
) -> Result<ChangeAckResponse, ApiError> {
    // 1. Check idempotency via sync_changes
    let inserted = sqlx::query(
        r#"
        INSERT INTO sync_changes (change_id, workspace_id, branch_id, device_id, entity, entity_id, version)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (change_id) DO NOTHING
        "#,
    )
    .bind(&change.change_id)
    .bind(&claims.workspace_id)
    .bind("")
    .bind(&claims.device_id)
    .bind(&change.entity)
    .bind(&change.entity_id)
    .bind(change.version)
    .execute(&mut *conn)
    .await?;

    if inserted.rows_affected() == 0 {
        return Ok(ChangeAckResponse {
            change_id: change.change_id.clone(),
            status: "applied".into(),
            reason: None,
        });
    }

    // 2. Extract workspace_id from payload and validate against token workspace_id
    let payload_ws_id = match change.entity.as_str() {
        "business" => serde_json::from_value::<BusinessPayload>(change.payload.clone()).map(|p| p.workspace_id),
        "inventory_item" => serde_json::from_value::<InventoryItemPayload>(change.payload.clone()).map(|p| p.workspace_id),
        "price" => serde_json::from_value::<PricePayload>(change.payload.clone()).map(|p| p.workspace_id),
        "price_history" => serde_json::from_value::<PriceHistoryPayload>(change.payload.clone()).map(|p| p.workspace_id),
        "daily_summary" => serde_json::from_value::<DailySummaryPayload>(change.payload.clone()).map(|p| p.workspace_id),
        _ => Err(serde::de::Error::custom("Unknown entity type")),
    };

    let payload_ws_id = match payload_ws_id {
        Ok(ws) => ws,
        Err(e) => {
            tracing::warn!(change_id = %change.change_id, error = %e, "change_payload_deserialization_failed");
            return Ok(ChangeAckResponse {
                change_id: change.change_id.clone(),
                status: "rejected".into(),
                reason: Some(format!("Invalid payload structure: {}", e)),
            });
        }
    };

    if payload_ws_id != claims.workspace_id {
        tracing::warn!(change_id = %change.change_id, token_ws = %claims.workspace_id, payload_ws = %payload_ws_id, "workspace_mismatch_rejected");
        return Ok(ChangeAckResponse {
            change_id: change.change_id.clone(),
            status: "rejected".into(),
            reason: Some("workspace_mismatch".into()),
        });
    }

    // 3. Apply change per entity
    match change.entity.as_str() {
        "business" => apply_business(conn, &change.payload, change.version).await,
        "inventory_item" => apply_inventory_item(conn, &change.payload, change.version).await,
        "price" => apply_price(conn, &change.payload, change.version).await,
        "price_history" => apply_price_history(conn, &change.payload, change.version).await,
        "daily_summary" => apply_daily_summary(conn, &change.payload, change.version).await,
        _ => Ok(ChangeAckResponse {
            change_id: change.change_id.clone(),
            status: "rejected".into(),
            reason: Some(format!("Unsupported entity: {}", change.entity)),
        }),
    }
}

async fn apply_business(conn: &mut PgConnection, val: &serde_json::Value, version: i64) -> Result<ChangeAckResponse, ApiError> {
    let p: BusinessPayload = serde_json::from_value(val.clone())
        .map_err(|e| ApiError::BadRequest(format!("Invalid business payload: {}", e)))?;

    let current_version: Option<i64> = sqlx::query_scalar(
        "SELECT version FROM business_registry WHERE workspace_id = $1 AND business_id = $2"
    )
    .bind(&p.workspace_id)
    .bind(&p.business_id)
    .fetch_optional(&mut *conn)
    .await?;

    if let Some(curr) = current_version {
        if version <= curr {
            return Ok(ChangeAckResponse { change_id: "".into(), status: "stale".into(), reason: Some("Stale version".into()) });
        }
    }

    let res = sqlx::query(
        r#"
        UPDATE business_registry
        SET name = $1, tin = $2, tmda_number = $3, pharmacy_council_no = $4,
            role_scopes = $5, contact_mobile = $6, contact_email = $7, contact_whatsapp = $8,
            address_region = $9, address_district = $10, address_place = $11,
            version = $12, updated_at = NOW(), deleted_at = $13
        WHERE workspace_id = $14 AND business_id = $15 AND (version IS NULL OR version < $12)
        "#,
    )
    .bind(&p.name)
    .bind(&p.tin)
    .bind(&p.tmda_number)
    .bind(&p.pharmacy_council_no)
    .bind(&p.role_scopes)
    .bind(&p.contact_mobile)
    .bind(&p.contact_email)
    .bind(&p.contact_whatsapp)
    .bind(&p.address_region)
    .bind(&p.address_district)
    .bind(&p.address_place)
    .bind(version)
    .bind(p.deleted_at)
    .bind(&p.workspace_id)
    .bind(&p.business_id)
    .execute(&mut *conn)
    .await?;

    let status = if res.rows_affected() > 0 { "applied" } else { "stale" };
    Ok(ChangeAckResponse { change_id: "".into(), status: status.into(), reason: None })
}

async fn apply_inventory_item(conn: &mut PgConnection, val: &serde_json::Value, version: i64) -> Result<ChangeAckResponse, ApiError> {
    let p: InventoryItemPayload = serde_json::from_value(val.clone())
        .map_err(|e| ApiError::BadRequest(format!("Invalid inventory item payload: {}", e)))?;

    let current_version: Option<i64> = sqlx::query_scalar(
        "SELECT version FROM cloud_inventory_items WHERE id = $1"
    )
    .bind(&p.id)
    .fetch_optional(&mut *conn)
    .await?;

    if let Some(curr) = current_version {
        if version <= curr {
            return Ok(ChangeAckResponse { change_id: "".into(), status: "stale".into(), reason: Some("Stale version".into()) });
        }
    }

    sqlx::query(
        r#"
        INSERT INTO cloud_inventory_items (
            id, workspace_id, branch_id, medicine_id, batch_number, expiry_date,
            buy_price, sell_price, quantity, low_stock_threshold, cold_chain_required,
            is_deactivated, version, deleted_at, source_device_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'sync')
        ON CONFLICT (id) DO UPDATE SET
            workspace_id = EXCLUDED.workspace_id,
            branch_id = EXCLUDED.branch_id,
            medicine_id = EXCLUDED.medicine_id,
            batch_number = EXCLUDED.batch_number,
            expiry_date = EXCLUDED.expiry_date,
            buy_price = EXCLUDED.buy_price,
            sell_price = EXCLUDED.sell_price,
            quantity = EXCLUDED.quantity,
            low_stock_threshold = EXCLUDED.low_stock_threshold,
            cold_chain_required = EXCLUDED.cold_chain_required,
            is_deactivated = EXCLUDED.is_deactivated,
            version = EXCLUDED.version,
            deleted_at = EXCLUDED.deleted_at,
            synced_at = NOW()
        WHERE cloud_inventory_items.version < EXCLUDED.version
        "#,
    )
    .bind(&p.id)
    .bind(&p.workspace_id)
    .bind(&p.branch_id)
    .bind(&p.medicine_id)
    .bind(&p.batch_number)
    .bind(&p.expiry_date)
    .bind(p.buy_price)
    .bind(p.sell_price)
    .bind(p.quantity)
    .bind(p.low_stock_threshold)
    .bind(p.cold_chain_required)
    .bind(p.is_deactivated)
    .bind(version)
    .bind(p.deleted_at)
    .execute(&mut *conn)
    .await?;

    Ok(ChangeAckResponse { change_id: "".into(), status: "applied".into(), reason: None })
}

async fn apply_price(conn: &mut PgConnection, val: &serde_json::Value, version: i64) -> Result<ChangeAckResponse, ApiError> {
    let p: PricePayload = serde_json::from_value(val.clone())
        .map_err(|e| ApiError::BadRequest(format!("Invalid price payload: {}", e)))?;

    let current_version: Option<i64> = sqlx::query_scalar(
        "SELECT version FROM cloud_prices WHERE id = $1"
    )
    .bind(&p.id)
    .fetch_optional(&mut *conn)
    .await?;

    if let Some(curr) = current_version {
        if version <= curr {
            return Ok(ChangeAckResponse { change_id: "".into(), status: "stale".into(), reason: Some("Stale version".into()) });
        }
    }

    sqlx::query(
        r#"
        INSERT INTO cloud_prices (
            id, workspace_id, branch_id, inventory_item_id, selling_price, cost_price,
            version, deleted_at, source_device_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sync')
        ON CONFLICT (id) DO UPDATE SET
            workspace_id = EXCLUDED.workspace_id,
            branch_id = EXCLUDED.branch_id,
            inventory_item_id = EXCLUDED.inventory_item_id,
            selling_price = EXCLUDED.selling_price,
            cost_price = EXCLUDED.cost_price,
            version = EXCLUDED.version,
            deleted_at = EXCLUDED.deleted_at,
            synced_at = NOW()
        WHERE cloud_prices.version < EXCLUDED.version
        "#,
    )
    .bind(&p.id)
    .bind(&p.workspace_id)
    .bind(&p.branch_id)
    .bind(&p.inventory_item_id)
    .bind(p.selling_price)
    .bind(p.cost_price)
    .bind(version)
    .bind(p.deleted_at)
    .execute(&mut *conn)
    .await?;

    Ok(ChangeAckResponse { change_id: "".into(), status: "applied".into(), reason: None })
}

async fn apply_price_history(conn: &mut PgConnection, val: &serde_json::Value, version: i64) -> Result<ChangeAckResponse, ApiError> {
    let p: PriceHistoryPayload = serde_json::from_value(val.clone())
        .map_err(|e| ApiError::BadRequest(format!("Invalid price history payload: {}", e)))?;

    sqlx::query(
        r#"
        INSERT INTO cloud_price_history (
            id, workspace_id, branch_id, inventory_item_id, selling_price, cost_price,
            changed_at, version, source_device_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sync')
        ON CONFLICT (id) DO NOTHING
        "#,
    )
    .bind(&p.id)
    .bind(&p.workspace_id)
    .bind(&p.branch_id)
    .bind(&p.inventory_item_id)
    .bind(p.selling_price)
    .bind(p.cost_price)
    .bind(p.changed_at)
    .bind(version)
    .execute(&mut *conn)
    .await?;

    Ok(ChangeAckResponse { change_id: "".into(), status: "applied".into(), reason: None })
}

async fn apply_daily_summary(conn: &mut PgConnection, val: &serde_json::Value, version: i64) -> Result<ChangeAckResponse, ApiError> {
    let p: DailySummaryPayload = serde_json::from_value(val.clone())
        .map_err(|e| ApiError::BadRequest(format!("Invalid daily summary payload: {}", e)))?;

    sqlx::query(
        r#"
        INSERT INTO cloud_daily_summaries (
            id, workspace_id, branch_id, summary_date, revenue_total, tx_count, items_sold,
            version, source_device_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sync')
        ON CONFLICT (workspace_id, branch_id, summary_date) DO UPDATE SET
            revenue_total = EXCLUDED.revenue_total,
            tx_count = EXCLUDED.tx_count,
            items_sold = EXCLUDED.items_sold,
            version = EXCLUDED.version,
            synced_at = NOW()
        WHERE cloud_daily_summaries.version <= EXCLUDED.version
        "#,
    )
    .bind(&p.id)
    .bind(&p.workspace_id)
    .bind(&p.branch_id)
    .bind(&p.summary_date)
    .bind(p.revenue_total)
    .bind(p.tx_count)
    .bind(p.items_sold)
    .bind(version)
    .execute(&mut *conn)
    .await?;

    Ok(ChangeAckResponse { change_id: "".into(), status: "applied".into(), reason: None })
}
