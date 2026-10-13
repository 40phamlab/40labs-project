use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FieldUpdate<T> {
    Unset,
    Set(T),
    Clear,
}

impl<T> Default for FieldUpdate<T> {
    fn default() -> Self {
        FieldUpdate::Unset
    }
}

impl<'de, T: serde::Deserialize<'de>> serde::Deserialize<'de> for FieldUpdate<T> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        Option::<Option<T>>::deserialize(deserializer).map(|opt| match opt {
            Some(Some(val)) => FieldUpdate::Set(val),
            Some(None) => FieldUpdate::Clear,
            None => FieldUpdate::Unset,
        })
    }
}

impl<T: serde::Serialize> serde::Serialize for FieldUpdate<T> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            FieldUpdate::Unset | FieldUpdate::Clear => serializer.serialize_none(),
            FieldUpdate::Set(val) => val.serialize(serializer),
        }
    }
}

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

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCustomerRequest {
    #[serde(default)]
    pub full_name: Option<String>,
    #[serde(default)]
    pub phone: Option<String>,
    #[serde(default)]
    pub outstanding_balance: Option<i64>,

    #[serde(default)]
    pub email: FieldUpdate<String>,
    #[serde(default)]
    pub notes: FieldUpdate<String>,
    #[serde(default)]
    pub dob: FieldUpdate<String>,
    #[serde(default)]
    pub sex: FieldUpdate<String>,
    #[serde(default)]
    pub blood_group: FieldUpdate<String>,
    #[serde(default)]
    pub allergies: FieldUpdate<serde_json::Value>,
    #[serde(default)]
    pub chronic_conditions: FieldUpdate<Vec<String>>,
    #[serde(default)]
    pub current_medications: FieldUpdate<Vec<String>>,
    #[serde(default)]
    pub emergency_contact: FieldUpdate<serde_json::Value>,
    #[serde(default)]
    pub ward_district: FieldUpdate<String>,
    #[serde(default)]
    pub pharmacy_notes: FieldUpdate<String>,
    #[serde(default)]
    pub archived_at: FieldUpdate<String>,
}
