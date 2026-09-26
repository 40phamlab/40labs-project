use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SaleLine {
    pub id: String,
    pub sale_id: String,
    pub inventory_item_id: String,
    pub medicine_name: String,
    pub quantity: i64,
    pub unit_price: i64,
    pub subtotal: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sale {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub customer_id: Option<String>,
    pub lines: Vec<SaleLine>,
    pub payment_method: String,
    pub discount_amount: i64,
    pub discount_authorized_by_user_id: Option<String>,
    pub tax_amount: i64,
    pub grand_total: i64,
    pub currency: String,
    pub synced_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSaleLineInput {
    pub inventory_item_id: String,
    pub medicine_name: String,
    pub quantity: i64,
    pub unit_price: i64,
    pub subtotal: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSaleRequest {
    pub customer_id: Option<String>,
    pub lines: Vec<CreateSaleLineInput>,
    pub payment_method: String,
    pub discount_amount: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FiscalReceipt {
    pub id: String,
    pub sale_id: String,
    pub receipt_number: String,
    pub qr_code_url: Option<String>,
    pub verification_status: String,
    pub created_at: String,
}
