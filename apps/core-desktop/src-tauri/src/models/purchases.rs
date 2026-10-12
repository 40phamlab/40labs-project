use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Supplier {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub business_id: String,
    pub tmda_verified: bool,
    pub tra_verified: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderLine {
    pub id: String,
    pub purchase_order_id: String,
    pub medicine_id: String,
    pub quantity: i64,
    pub unit_cost: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrder {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub supplier_id: String,
    pub status: String,
    pub lines: Vec<PurchaseOrderLine>,
    pub total_cost: i64,
    pub approved_by_user_id: Option<String>,
    pub submitted_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
