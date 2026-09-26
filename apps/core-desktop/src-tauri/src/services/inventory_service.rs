use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::models::audit::AuditLogEntry;
use crate::models::inventory::{
    AddStockRequest, InventoryItem, Medicine, MedicineWithInventory,
    RecordStockActionRequest, RecordStockActionResult, StockAdjustment,
};
use crate::models::{DEFAULT_BRANCH_ID, DEFAULT_WORKSPACE_ID};
use crate::repositories::audit_repo::AuditRepository;
use crate::repositories::inventory_repo::InventoryRepository;

pub struct InventoryService;

impl InventoryService {
    pub async fn add_stock(
        pool: &SqlitePool,
        req: AddStockRequest,
    ) -> Result<MedicineWithInventory, String> {
        let now = Utc::now().to_rfc3339();
        let med_id = format!("med_{}", Uuid::new_v4().simple());
        let inv_id = format!("inv_{}", Uuid::new_v4().simple());

        let medicine = Medicine {
            id: med_id.clone(),
            workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
            branch_id: DEFAULT_BRANCH_ID.to_string(),
            created_at: now.clone(),
            updated_at: now.clone(),
            name: req.medicine_name,
            generic_name: req.generic_name,
            category: req.category,
            unit: req.unit,
            is_controlled_substance: false,
            requires_prescription: false,
        };

        let inventory_item = InventoryItem {
            id: inv_id.clone(),
            workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
            branch_id: DEFAULT_BRANCH_ID.to_string(),
            created_at: now.clone(),
            updated_at: now.clone(),
            medicine_id: med_id,
            batch_number: req.batch_number,
            expiry_date: req.expiry_date,
            buy_price: req.buy_price,
            sell_price: req.sell_price,
            quantity: req.quantity,
            low_stock_threshold: req.low_stock_threshold,
            cold_chain_required: false,
            is_deactivated: false,
        };

        InventoryRepository::create_medicine(pool, &medicine)
            .await
            .map_err(|e| format!("Failed to create medicine: {}", e))?;

        InventoryRepository::create_inventory_item(pool, &inventory_item)
            .await
            .map_err(|e| format!("Failed to create inventory item: {}", e))?;

        // Write initial audit log
        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
            branch_id: DEFAULT_BRANCH_ID.to_string(),
            action: "stock_adjustment".to_string(),
            performed_by_user_id: "user_001".to_string(),
            target_entity_type: "InventoryItem".to_string(),
            target_entity_id: inv_id,
            metadata: Some(
                serde_json::json!({
                    "actionType": "initial_stock_creation",
                    "quantity": req.quantity,
                })
                .to_string(),
            ),
            created_at: now,
        };

        AuditRepository::create(pool, &audit_entry)
            .await
            .map_err(|e| format!("Failed to record audit log: {}", e))?;

        Ok(MedicineWithInventory {
            inventory_item,
            medicine,
        })
    }

    pub async fn record_stock_action(
        pool: &SqlitePool,
        req: RecordStockActionRequest,
    ) -> Result<RecordStockActionResult, String> {
        let existing = InventoryRepository::get_inventory_item_by_id(pool, &req.inventory_item_id)
            .await
            .map_err(|e| format!("Failed to fetch inventory item: {}", e))?
            .ok_or_else(|| "Inventory item not found".to_string())?;

        let now = Utc::now().to_rfc3339();
        let current_qty = existing.inventory_item.quantity;
        let mut computed_delta: i64 = 0;
        let mut new_qty = current_qty;
        let mut is_deactivated = existing.inventory_item.is_deactivated;

        match req.action.as_str() {
            "refill" => {
                let amount = req.quantity_delta.or(req.new_quantity).unwrap_or(0).abs();
                computed_delta = amount;
                new_qty = current_qty + amount;
            }
            "damaged" | "expired" | "transferred" => {
                let amount = req.quantity_delta.unwrap_or(0).abs();
                computed_delta = -amount;
                new_qty = (current_qty - amount).max(0);
            }
            "disposed" => {
                let amount = req.quantity_delta.unwrap_or(current_qty).abs();
                computed_delta = -amount;
                new_qty = (current_qty - amount).max(0);
            }
            "deactivated" => {
                computed_delta = -current_qty;
                new_qty = 0;
                is_deactivated = true;
            }
            _ => {
                if let Some(target_qty) = req.new_quantity {
                    new_qty = target_qty.max(0);
                    computed_delta = new_qty - current_qty;
                } else if let Some(delta) = req.quantity_delta {
                    computed_delta = delta;
                    new_qty = (current_qty + delta).max(0);
                }
            }
        }

        InventoryRepository::update_inventory_quantity(
            pool,
            &req.inventory_item_id,
            new_qty,
            is_deactivated,
            &now,
        )
        .await
        .map_err(|e| format!("Failed to update inventory quantity: {}", e))?;

        let audit_id = format!("audit_{}", Uuid::new_v4().simple());
        let audit_entry = AuditLogEntry {
            id: audit_id.clone(),
            workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
            branch_id: DEFAULT_BRANCH_ID.to_string(),
            action: "stock_adjustment".to_string(),
            performed_by_user_id: req.authorized_by_user_id.unwrap_or_else(|| "user_001".to_string()),
            target_entity_type: "InventoryItem".to_string(),
            target_entity_id: req.inventory_item_id.clone(),
            metadata: Some(
                serde_json::json!({
                    "actionType": req.action,
                    "delta": computed_delta,
                    "previousQuantity": current_qty,
                    "newQuantity": new_qty,
                    "reason": req.reason,
                })
                .to_string(),
            ),
            created_at: now.clone(),
        };

        AuditRepository::create(pool, &audit_entry)
            .await
            .map_err(|e| format!("Failed to write audit entry: {}", e))?;

        let adj_id = format!("adj_{}", Uuid::new_v4().simple());
        let adjustment = StockAdjustment {
            id: adj_id,
            workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
            branch_id: DEFAULT_BRANCH_ID.to_string(),
            created_at: now.clone(),
            updated_at: now,
            inventory_item_id: req.inventory_item_id.clone(),
            adjusted_by_user_id: "user_001".to_string(),
            delta: computed_delta,
            reason: req.reason,
            audit_log_id: audit_id.clone(),
        };

        InventoryRepository::create_stock_adjustment(pool, &adjustment)
            .await
            .map_err(|e| format!("Failed to create stock adjustment: {}", e))?;

        let mut updated_item = existing;
        updated_item.inventory_item.quantity = new_qty;
        updated_item.inventory_item.is_deactivated = is_deactivated;

        Ok(RecordStockActionResult {
            inventory_item: updated_item,
            adjustment,
            audit_entry_id: audit_id,
        })
    }
}
