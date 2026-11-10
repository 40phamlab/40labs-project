use crate::auth::device::DeviceClaims;
use crate::error::ApiError;
use crate::sync::validate::ChangeItem;
use serde::Deserialize;
use sha2::Digest;
use sqlx::PgConnection;

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
    deleted_at: Option<chrono::DateTime<chrono::Utc>>,
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
    deleted_at: Option<chrono::DateTime<chrono::Utc>>,
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
    deleted_at: Option<chrono::DateTime<chrono::Utc>>,
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
    changed_at: chrono::DateTime<chrono::Utc>,
    version: i64,
}

#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
struct DailySummaryPayload {
    id: String,
    workspace_id: String,
    branch_id: String,
    summary_date: chrono::NaiveDate,
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
    let payload_id = change.payload.get("id").and_then(serde_json::Value::as_str);
    let payload_workspace = change
        .payload
        .get("workspace_id")
        .and_then(serde_json::Value::as_str);
    let payload_branch = change
        .payload
        .get("branch_id")
        .and_then(serde_json::Value::as_str);
    if payload_id != Some(change.entity_id.as_str())
        || payload_workspace != Some(claims.workspace_id.as_str())
        || payload_branch != Some(claims.branch_id.as_str())
    {
        return Ok(ChangeAckResponse {
            change_id: change.change_id.clone(),
            status: "rejected".into(),
            reason: Some("entity_id_or_tenant_scope_mismatch".into()),
        });
    }
    if change.entity == "business"
        && change
            .payload
            .get("business_id")
            .and_then(serde_json::Value::as_str)
            != Some(claims.business_id.as_str())
    {
        return Ok(ChangeAckResponse {
            change_id: change.change_id.clone(),
            status: "rejected".into(),
            reason: Some("business_scope_mismatch".into()),
        });
    }
    if !matches!(
        change.entity.as_str(),
        "business" | "inventory_item" | "price" | "price_history" | "daily_summary"
    ) {
        return Ok(ChangeAckResponse {
            change_id: change.change_id.clone(),
            status: "rejected".into(),
            reason: Some("unsupported_entity".into()),
        });
    }
    let payload_hash = hex::encode(sha2::Sha256::digest(
        serde_json::to_vec(&change.payload).map_err(|e| ApiError::BadRequest(e.to_string()))?,
    ));
    let prior=sqlx::query_as::<_,(String,String,String,String,String,i64,String,String,Option<String>)>(
        "SELECT workspace_id,branch_id,device_id,entity,entity_id,version,payload_sha256,status,reason FROM sync_changes WHERE device_id=$1 AND change_id=$2"
    ).bind(&claims.device_id).bind(&change.change_id).fetch_optional(&mut *conn).await?;
    if let Some((workspace, branch, device, entity, entity_id, version, digest, status, reason)) =
        prior
    {
        if workspace != claims.workspace_id
            || branch != claims.branch_id
            || device != claims.device_id
            || entity != change.entity
            || entity_id != change.entity_id
            || version != change.version
            || digest != payload_hash
        {
            return Err(ApiError::Conflict(
                "Change ID was already used with different content or scope".into(),
            ));
        }
        return Ok(ChangeAckResponse {
            change_id: change.change_id.clone(),
            status,
            reason,
        });
    }
    sqlx::query("INSERT INTO sync_changes (change_id,workspace_id,branch_id,device_id,entity,entity_id,version,payload_sha256,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'processing')")
        .bind(&change.change_id).bind(&claims.workspace_id).bind(&claims.branch_id).bind(&claims.device_id)
        .bind(&change.entity).bind(&change.entity_id).bind(change.version).bind(&payload_hash).execute(&mut *conn).await?;
    let mut ack = match change.entity.as_str() {
        "business" => apply_business(conn, &change.payload, change.version, claims).await?,
        "inventory_item" => {
            apply_inventory_item(conn, &change.payload, change.version, claims).await?
        }
        "price" => apply_price(conn, &change.payload, change.version, claims).await?,
        "price_history" => {
            apply_price_history(conn, &change.payload, change.version, claims).await?
        }
        "daily_summary" => {
            apply_daily_summary(conn, &change.payload, change.version, claims).await?
        }
        _ => unreachable!("entity was allow-listed above"),
    };
    ack.change_id = change.change_id.clone();
    sqlx::query("UPDATE sync_changes SET status=$1,reason=$2 WHERE device_id=$3 AND change_id=$4")
        .bind(&ack.status)
        .bind(&ack.reason)
        .bind(&claims.device_id)
        .bind(&change.change_id)
        .execute(&mut *conn)
        .await?;
    Ok(ack)
}

async fn apply_business(
    conn: &mut PgConnection,
    val: &serde_json::Value,
    version: i64,
    claims: &DeviceClaims,
) -> Result<ChangeAckResponse, ApiError> {
    let p: BusinessPayload = serde_json::from_value(val.clone())
        .map_err(|e| ApiError::BadRequest(format!("Invalid business payload: {}", e)))?;

    let current_version: Option<i64> = sqlx::query_scalar(
        "SELECT version FROM business_registry WHERE workspace_id = $1 AND business_id = $2 AND branch_id = $3 FOR UPDATE"
    )
    .bind(&claims.workspace_id)
    .bind(&claims.business_id)
    .bind(&claims.branch_id)
    .fetch_optional(&mut *conn)
    .await?;

    if current_version.is_none() {
        return Ok(ChangeAckResponse {
            change_id: String::new(),
            status: "rejected".into(),
            reason: Some("business_not_owned".into()),
        });
    }
    if let Some(curr) = current_version {
        if version <= curr {
            return Ok(ChangeAckResponse {
                change_id: "".into(),
                status: "stale".into(),
                reason: Some("Stale version".into()),
            });
        }
    }

    let res = sqlx::query(
        r#"
        UPDATE business_registry
        SET name = $1, tin = $2, tmda_number = $3, pharmacy_council_no = $4,
            role_scopes = $5, contact_mobile = $6, contact_email = $7, contact_whatsapp = $8,
            address_region = $9, address_district = $10, address_place = $11,
            version = $12, updated_at = NOW(), deleted_at = $13
        WHERE workspace_id = $14 AND business_id = $15 AND branch_id = $16 AND (version IS NULL OR version < $12)
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
    .bind(&claims.workspace_id)
    .bind(&claims.business_id)
    .bind(&claims.branch_id)
    .execute(&mut *conn)
    .await?;

    let status = if res.rows_affected() > 0 {
        "applied"
    } else {
        "stale"
    };
    Ok(ChangeAckResponse {
        change_id: "".into(),
        status: status.into(),
        reason: None,
    })
}

async fn apply_inventory_item(
    conn: &mut PgConnection,
    val: &serde_json::Value,
    version: i64,
    claims: &DeviceClaims,
) -> Result<ChangeAckResponse, ApiError> {
    let p: InventoryItemPayload = serde_json::from_value(val.clone())
        .map_err(|e| ApiError::BadRequest(format!("Invalid inventory item payload: {}", e)))?;

    if p.workspace_id != claims.workspace_id || p.branch_id != claims.branch_id {
        return Ok(ChangeAckResponse {
            change_id: String::new(),
            status: "rejected".into(),
            reason: Some("inventory_scope_mismatch".into()),
        });
    }
    let current_version: Option<(String, String, i64)> = sqlx::query_as(
        "SELECT workspace_id,branch_id,version FROM cloud_inventory_items WHERE id=$1 FOR UPDATE",
    )
    .bind(&p.id)
    .fetch_optional(&mut *conn)
    .await?;
    if let Some((workspace, branch, curr)) = current_version {
        if workspace != claims.workspace_id || branch != claims.branch_id {
            return Ok(ChangeAckResponse {
                change_id: String::new(),
                status: "rejected".into(),
                reason: Some("inventory_record_not_owned".into()),
            });
        }
        if version <= curr {
            return Ok(ChangeAckResponse {
                change_id: String::new(),
                status: "stale".into(),
                reason: Some("stale_version".into()),
            });
        }
    }

    let res = sqlx::query(
        r#"
        INSERT INTO cloud_inventory_items (
            id, workspace_id, branch_id, medicine_id, batch_number, expiry_date,
            buy_price, sell_price, quantity, low_stock_threshold, cold_chain_required,
            is_deactivated, version, deleted_at, source_device_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
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
            synced_at = NOW(),
            source_device_id = EXCLUDED.source_device_id
        WHERE cloud_inventory_items.workspace_id = EXCLUDED.workspace_id AND cloud_inventory_items.branch_id = EXCLUDED.branch_id AND cloud_inventory_items.version < EXCLUDED.version
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
    .bind(&claims.device_id)
    .execute(&mut *conn)
    .await?;

    Ok(if res.rows_affected() == 1 {
        ChangeAckResponse {
            change_id: String::new(),
            status: "applied".into(),
            reason: None,
        }
    } else {
        ChangeAckResponse {
            change_id: String::new(),
            status: "rejected".into(),
            reason: Some("inventory_ownership_or_version_conflict".into()),
        }
    })
}

async fn apply_price(
    conn: &mut PgConnection,
    val: &serde_json::Value,
    version: i64,
    claims: &DeviceClaims,
) -> Result<ChangeAckResponse, ApiError> {
    let p: PricePayload = serde_json::from_value(val.clone())
        .map_err(|_| ApiError::BadRequest("Invalid price payload".into()))?;
    if p.workspace_id != claims.workspace_id || p.branch_id != claims.branch_id {
        return Ok(ChangeAckResponse {
            change_id: String::new(),
            status: "rejected".into(),
            reason: Some("price_scope_mismatch".into()),
        });
    }
    let parent: Option<(String, String)> = sqlx::query_as(
        "SELECT workspace_id,branch_id FROM cloud_inventory_items WHERE id=$1 FOR SHARE",
    )
    .bind(&p.inventory_item_id)
    .fetch_optional(&mut *conn)
    .await?;
    if parent.as_ref().map_or(true, |(ws, br)| {
        ws != &claims.workspace_id || br != &claims.branch_id
    }) {
        return Ok(ChangeAckResponse {
            change_id: String::new(),
            status: "rejected".into(),
            reason: Some("inventory_parent_not_owned".into()),
        });
    }
    let current: Option<(String, String, i64)> = sqlx::query_as(
        "SELECT workspace_id,branch_id,version FROM cloud_prices WHERE id=$1 FOR UPDATE",
    )
    .bind(&p.id)
    .fetch_optional(&mut *conn)
    .await?;
    if let Some((ws, br, v)) = current {
        if ws != claims.workspace_id || br != claims.branch_id {
            return Ok(ChangeAckResponse {
                change_id: String::new(),
                status: "rejected".into(),
                reason: Some("price_record_not_owned".into()),
            });
        }
        if version <= v {
            return Ok(ChangeAckResponse {
                change_id: String::new(),
                status: "stale".into(),
                reason: Some("stale_version".into()),
            });
        }
    }
    let res=sqlx::query(r#"INSERT INTO cloud_prices(id,workspace_id,branch_id,inventory_item_id,selling_price,cost_price,version,deleted_at,source_device_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(id) DO UPDATE SET inventory_item_id=EXCLUDED.inventory_item_id,selling_price=EXCLUDED.selling_price,cost_price=EXCLUDED.cost_price,version=EXCLUDED.version,deleted_at=EXCLUDED.deleted_at,synced_at=NOW(),source_device_id=EXCLUDED.source_device_id WHERE cloud_prices.workspace_id=EXCLUDED.workspace_id AND cloud_prices.branch_id=EXCLUDED.branch_id AND cloud_prices.version<EXCLUDED.version"#)
        .bind(&p.id).bind(&claims.workspace_id).bind(&claims.branch_id).bind(&p.inventory_item_id).bind(p.selling_price).bind(p.cost_price).bind(version).bind(p.deleted_at).bind(&claims.device_id).execute(&mut *conn).await?;
    Ok(if res.rows_affected() == 1 {
        ChangeAckResponse {
            change_id: String::new(),
            status: "applied".into(),
            reason: None,
        }
    } else {
        ChangeAckResponse {
            change_id: String::new(),
            status: "rejected".into(),
            reason: Some("price_ownership_or_version_conflict".into()),
        }
    })
}

async fn apply_price_history(
    conn: &mut PgConnection,
    val: &serde_json::Value,
    version: i64,
    claims: &DeviceClaims,
) -> Result<ChangeAckResponse, ApiError> {
    let p: PriceHistoryPayload = serde_json::from_value(val.clone())
        .map_err(|_| ApiError::BadRequest("Invalid price history payload".into()))?;
    if p.workspace_id != claims.workspace_id || p.branch_id != claims.branch_id {
        return Ok(ChangeAckResponse {
            change_id: String::new(),
            status: "rejected".into(),
            reason: Some("price_history_scope_mismatch".into()),
        });
    }
    let parent: Option<(String, String)> = sqlx::query_as(
        "SELECT workspace_id,branch_id FROM cloud_inventory_items WHERE id=$1 FOR SHARE",
    )
    .bind(&p.inventory_item_id)
    .fetch_optional(&mut *conn)
    .await?;
    if parent.as_ref().map_or(true, |(ws, br)| {
        ws != &claims.workspace_id || br != &claims.branch_id
    }) {
        return Ok(ChangeAckResponse {
            change_id: String::new(),
            status: "rejected".into(),
            reason: Some("inventory_parent_not_owned".into()),
        });
    }
    let existing: Option<(String, String)> = sqlx::query_as(
        "SELECT workspace_id,branch_id FROM cloud_price_history WHERE id=$1 FOR UPDATE",
    )
    .bind(&p.id)
    .fetch_optional(&mut *conn)
    .await?;
    if let Some((ws, br)) = existing {
        return Ok(if ws == claims.workspace_id && br == claims.branch_id {
            ChangeAckResponse {
                change_id: String::new(),
                status: "stale".into(),
                reason: Some("history_record_exists".into()),
            }
        } else {
            ChangeAckResponse {
                change_id: String::new(),
                status: "rejected".into(),
                reason: Some("price_history_record_not_owned".into()),
            }
        });
    }
    sqlx::query("INSERT INTO cloud_price_history(id,workspace_id,branch_id,inventory_item_id,selling_price,cost_price,changed_at,version,source_device_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)")
        .bind(&p.id).bind(&claims.workspace_id).bind(&claims.branch_id).bind(&p.inventory_item_id).bind(p.selling_price).bind(p.cost_price).bind(&p.changed_at).bind(version).bind(&claims.device_id).execute(&mut *conn).await?;
    Ok(ChangeAckResponse {
        change_id: String::new(),
        status: "applied".into(),
        reason: None,
    })
}

async fn apply_daily_summary(
    conn: &mut PgConnection,
    val: &serde_json::Value,
    version: i64,
    claims: &DeviceClaims,
) -> Result<ChangeAckResponse, ApiError> {
    let p: DailySummaryPayload = serde_json::from_value(val.clone())
        .map_err(|_| ApiError::BadRequest("Invalid daily summary payload".into()))?;
    if p.workspace_id != claims.workspace_id || p.branch_id != claims.branch_id {
        return Ok(ChangeAckResponse {
            change_id: String::new(),
            status: "rejected".into(),
            reason: Some("summary_scope_mismatch".into()),
        });
    }
    let existing: Option<(String, String)> = sqlx::query_as(
        "SELECT workspace_id,branch_id FROM cloud_daily_summaries WHERE id=$1 FOR UPDATE",
    )
    .bind(&p.id)
    .fetch_optional(&mut *conn)
    .await?;
    if existing.as_ref().map_or(false, |(ws, br)| {
        ws != &claims.workspace_id || br != &claims.branch_id
    }) {
        return Ok(ChangeAckResponse {
            change_id: String::new(),
            status: "rejected".into(),
            reason: Some("summary_record_not_owned".into()),
        });
    }
    let res=sqlx::query(r#"INSERT INTO cloud_daily_summaries(id,workspace_id,branch_id,summary_date,revenue_total,tx_count,items_sold,version,source_device_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(workspace_id,branch_id,summary_date) DO UPDATE SET revenue_total=EXCLUDED.revenue_total,tx_count=EXCLUDED.tx_count,items_sold=EXCLUDED.items_sold,version=EXCLUDED.version,synced_at=NOW(),source_device_id=EXCLUDED.source_device_id WHERE cloud_daily_summaries.workspace_id=EXCLUDED.workspace_id AND cloud_daily_summaries.branch_id=EXCLUDED.branch_id AND cloud_daily_summaries.version<EXCLUDED.version"#)
        .bind(&p.id).bind(&claims.workspace_id).bind(&claims.branch_id).bind(&p.summary_date).bind(p.revenue_total).bind(p.tx_count).bind(p.items_sold).bind(version).bind(&claims.device_id).execute(&mut *conn).await?;
    Ok(if res.rows_affected() == 1 {
        ChangeAckResponse {
            change_id: String::new(),
            status: "applied".into(),
            reason: None,
        }
    } else {
        ChangeAckResponse {
            change_id: String::new(),
            status: "stale".into(),
            reason: Some("stale_summary_version".into()),
        }
    })
}
