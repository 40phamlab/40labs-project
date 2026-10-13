use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LabOrder {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub customer_id: String,
    pub sale_id: Option<String>,
    pub ordered_by_user_id: String,
    pub status: String,
    pub test_catalog_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LabSample {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub lab_order_id: String,
    pub collected_by_user_id: String,
    pub collected_at: String,
    pub sample_label: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLabOrderRequest {
    pub customer_id: String,
    pub test_catalog_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CollectLabSampleRequest {
    pub lab_order_id: String,
    pub sample_label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordLabResultRequest {
    pub lab_order_id: String,
    pub result_notes: String,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TestCatalogEntry {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub name: String,
    pub category: String,
    pub reference_range: Option<String>,
    pub price: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LabResult {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub lab_order_id: String,
    pub entered_by_user_id: String,
    pub value: String,
    pub reference_range: Option<String>,
    pub is_out_of_range: bool,
    pub override_authorized_by_user_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnterLabResultRequest {
    pub lab_order_id: String,
    pub value: String,
    pub reference_range: Option<String>,
    pub is_out_of_range: Option<bool>,
}
