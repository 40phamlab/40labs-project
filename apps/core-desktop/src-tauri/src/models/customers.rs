use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Customer {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub full_name: String,
    pub phone: String,
    pub email: Option<String>,
    pub outstanding_balance: i64,
    pub notes: Option<String>,
    pub dob: Option<String>,
    pub sex: Option<String>,
    pub blood_group: Option<String>,
    pub allergies: Option<String>,
    pub chronic_conditions: Option<String>,
    pub current_medications: Option<String>,
    pub emergency_contact: Option<String>,
    pub ward_district: Option<String>,
    pub pharmacy_notes: Option<String>,
    pub archived_at: Option<String>,
    pub amob_patient_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddCustomerRequest {
    pub full_name: String,
    pub phone: String,
    pub email: Option<String>,
    pub notes: Option<String>,
    pub dob: Option<String>,
    pub sex: Option<String>,
    pub blood_group: Option<String>,
    pub allergies: Option<serde_json::Value>,
    pub chronic_conditions: Option<Vec<String>>,
    pub current_medications: Option<Vec<String>>,
    pub emergency_contact: Option<serde_json::Value>,
    pub ward_district: Option<String>,
    pub pharmacy_notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCustomerRequest {
    pub full_name: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub notes: Option<String>,
    pub outstanding_balance: Option<i64>,
    pub dob: Option<String>,
    pub sex: Option<String>,
    pub blood_group: Option<String>,
    pub allergies: Option<serde_json::Value>,
    pub chronic_conditions: Option<Vec<String>>,
    pub current_medications: Option<Vec<String>>,
    pub emergency_contact: Option<serde_json::Value>,
    pub ward_district: Option<String>,
    pub pharmacy_notes: Option<String>,
    pub archived_at: Option<String>,
}
