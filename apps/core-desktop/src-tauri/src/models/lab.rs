use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LabQcEquipment {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub name: String,
    pub manufacturer: Option<String>,
    pub model: Option<String>,
    pub asset_tag: Option<String>,
    pub status: String,
    pub last_calibrated_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LabQcRecord {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub equipment_id: String,
    pub control_name: String,
    pub lot_number: Option<String>,
    pub observed_value: String,
    pub expected_range: String,
    pub outcome: String,
    pub performed_by_user_id: String,
    pub performed_at: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LabQcData {
    pub equipment: Vec<LabQcEquipment>,
    pub records: Vec<LabQcRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTestCatalogRequest {
    pub name: String,
    pub category: String,
    pub reference_range: Option<String>,
    pub price: i64,
    pub stability_hours: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLabQcEquipmentRequest {
    pub name: String,
    pub manufacturer: Option<String>,
    pub model: Option<String>,
    pub asset_tag: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLabQcRecordRequest {
    pub equipment_id: String,
    pub control_name: String,
    pub lot_number: Option<String>,
    pub observed_value: String,
    pub expected_range: String,
    pub outcome: String,
}

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
#[serde(rename_all = "camelCase")]
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
    pub expires_at: Option<String>,
    pub expiry_source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct SampleEvent {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub sample_id: String,
    pub event_type: String,
    pub actor_user_id: String,
    pub payload_json: Option<String>,
    pub occurred_at: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSampleExpiryRequest {
    pub expires_at: Option<String>,
    pub expiry_source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpiryOverrideRequest {
    pub pin: String,
    pub reason: String,
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
    pub expires_at: Option<String>,
    pub expiry_source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordLabResultRequest {
    pub lab_order_id: String,
    pub result_notes: String,
    pub status: Option<String>,
    pub expiry_override_pin: Option<String>,
    pub expiry_override_reason: Option<String>,
    pub request_recollect: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TestCatalogEntry {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub name: String,
    pub category: String,
    pub reference_range: Option<String>,
    pub price: i64,
    pub stability_hours: Option<i64>,
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
    pub expiry_override_pin: Option<String>,
    pub expiry_override_reason: Option<String>,
    pub request_recollect: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LabReport {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub patient_id: String,
    pub order_id: String,
    pub version: i64,
    pub supersedes_report_id: Option<String>,
    pub status: String,
    pub summary_note: Option<String>,
    pub prepared_by: String,
    pub finalized_by: Option<String>,
    pub finalized_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LabReportItem {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub report_id: String,
    pub result_id: String,
    pub snapshot_json: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LabReportForward {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub report_id: String,
    pub from_user_id: String,
    pub to_user_id: String,
    pub note: Option<String>,
    pub forwarded_at: String,
    pub read_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLabReportRequest {
    pub patient_id: String,
    pub order_id: String,
    pub summary_note: Option<String>,
    pub result_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinalizeLabReportRequest {
    pub pin: String,
    pub summary_note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AmendLabReportRequest {
    pub pin: String,
    pub summary_note: Option<String>,
    pub result_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ForwardLabReportRequest {
    pub to_user_id: String,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LabWorkflowRunDb {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub order_id: String,
    pub template_id: String,
    pub template_version: i64,
    pub state: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LabWorkflowRunStepDb {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub run_id: String,
    pub node_id: String,
    pub status: String,
    pub completed_by: Option<String>,
    pub completed_at: Option<String>,
    pub block_reason: Option<String>,
    pub notes: Option<String>,
    pub measurements_json: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartWorkflowRunRequest {
    pub order_id: String,
    pub template_id: String,
    pub template_version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompleteWorkflowStepRequest {
    pub run_id: String,
    pub node_id: String,
    pub notes: Option<String>,
    pub measurements_json: Option<String>,
}

