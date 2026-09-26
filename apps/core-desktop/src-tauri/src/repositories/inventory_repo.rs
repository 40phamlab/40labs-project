use sqlx::SqlitePool;
use crate::models::inventory::{InventoryItem, Medicine, MedicineWithInventory, StockAdjustment};

pub struct InventoryRepository;

impl InventoryRepository {
    pub async fn list_medicines_with_inventory(
        pool: &SqlitePool,
        include_deactivated: bool,
    ) -> Result<Vec<MedicineWithInventory>, sqlx::Error> {
        let items: Vec<InventoryItem> = if include_deactivated {
            sqlx::query_as::<_, InventoryItem>(
                "SELECT * FROM inventory_item ORDER BY created_at DESC"
            )
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, InventoryItem>(
                "SELECT * FROM inventory_item WHERE is_deactivated = 0 ORDER BY created_at DESC"
            )
            .fetch_all(pool)
            .await?
        };

        let mut result = Vec::new();
        for item in items {
            let medicine = sqlx::query_as::<_, Medicine>(
                "SELECT * FROM medicine WHERE id = ?"
            )
            .bind(&item.medicine_id)
            .fetch_optional(pool)
            .await?;

            if let Some(med) = medicine {
                result.push(MedicineWithInventory {
                    inventory_item: item,
                    medicine: med,
                });
            }
        }

        Ok(result)
    }

    pub async fn get_inventory_item_by_id(
        pool: &SqlitePool,
        id: &str,
    ) -> Result<Option<MedicineWithInventory>, sqlx::Error> {
        let item = sqlx::query_as::<_, InventoryItem>(
            "SELECT * FROM inventory_item WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        if let Some(inv_item) = item {
            let medicine = sqlx::query_as::<_, Medicine>(
                "SELECT * FROM medicine WHERE id = ?"
            )
            .bind(&inv_item.medicine_id)
            .fetch_optional(pool)
            .await?;

            if let Some(med) = medicine {
                return Ok(Some(MedicineWithInventory {
                    inventory_item: inv_item,
                    medicine: med,
                }));
            }
        }

        Ok(None)
    }

    pub async fn create_medicine(
        pool: &SqlitePool,
        med: &Medicine,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO medicine (
                id, workspace_id, branch_id, name, generic_name, category, unit,
                is_controlled_substance, requires_prescription, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&med.id)
        .bind(&med.workspace_id)
        .bind(&med.branch_id)
        .bind(&med.name)
        .bind(&med.generic_name)
        .bind(&med.category)
        .bind(&med.unit)
        .bind(med.is_controlled_substance)
        .bind(med.requires_prescription)
        .bind(&med.created_at)
        .bind(&med.updated_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn create_inventory_item(
        pool: &SqlitePool,
        item: &InventoryItem,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO inventory_item (
                id, workspace_id, branch_id, medicine_id, batch_number, expiry_date,
                buy_price, sell_price, quantity, low_stock_threshold, cold_chain_required,
                is_deactivated, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&item.id)
        .bind(&item.workspace_id)
        .bind(&item.branch_id)
        .bind(&item.medicine_id)
        .bind(&item.batch_number)
        .bind(&item.expiry_date)
        .bind(item.buy_price)
        .bind(item.sell_price)
        .bind(item.quantity)
        .bind(item.low_stock_threshold)
        .bind(item.cold_chain_required)
        .bind(item.is_deactivated)
        .bind(&item.created_at)
        .bind(&item.updated_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn update_inventory_quantity(
        pool: &SqlitePool,
        id: &str,
        new_quantity: i64,
        is_deactivated: bool,
        updated_at: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "UPDATE inventory_item SET quantity = ?, is_deactivated = ?, updated_at = ? WHERE id = ?"
        )
        .bind(new_quantity)
        .bind(is_deactivated)
        .bind(updated_at)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn create_stock_adjustment(
        pool: &SqlitePool,
        adj: &StockAdjustment,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO stock_adjustment (
                id, workspace_id, branch_id, inventory_item_id, adjusted_by_user_id,
                delta, reason, audit_log_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&adj.id)
        .bind(&adj.workspace_id)
        .bind(&adj.branch_id)
        .bind(&adj.inventory_item_id)
        .bind(&adj.adjusted_by_user_id)
        .bind(adj.delta)
        .bind(&adj.reason)
        .bind(&adj.audit_log_id)
        .bind(&adj.created_at)
        .bind(&adj.updated_at)
        .execute(pool)
        .await?;

        Ok(())
    }
}
