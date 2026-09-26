use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Medicine {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub name: String,
    pub generic_name: Option<String>,
    pub category: String,
    pub unit: String,
    pub is_controlled_substance: bool,
    pub requires_prescription: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct InventoryItem {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub medicine_id: String,
    pub batch_number: String,
    pub expiry_date: String,
    pub buy_price: i64,
    pub sell_price: i64,
    pub quantity: i64,
    pub low_stock_threshold: i64,
    pub cold_chain_required: bool,
    pub is_deactivated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MedicineWithInventory {
    #[serde(flatten)]
    pub inventory_item: InventoryItem,
    pub medicine: Medicine,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct StockAdjustment {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub inventory_item_id: String,
    pub adjusted_by_user_id: String,
    pub delta: i64,
    pub reason: String,
    pub audit_log_id: String,
}

// Request Payload DTOs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddStockRequest {
    pub medicine_name: String,
    pub generic_name: Option<String>,
    pub category: String,
    pub unit: String,
    pub batch_number: String,
    pub expiry_date: String,
    pub buy_price: i64,
    pub sell_price: i64,
    pub quantity: i64,
    pub low_stock_threshold: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordStockActionRequest {
    pub inventory_item_id: String,
    pub action: String,
    pub quantity_delta: Option<i64>,
    pub new_quantity: Option<i64>,
    pub reason: String,
    pub authorized_pin: Option<String>,
    pub authorized_by_user_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordStockActionResult {
    pub inventory_item: MedicineWithInventory,
    pub adjustment: StockAdjustment,
    pub audit_entry_id: String,
}
