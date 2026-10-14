use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum FacilityType {
    Pharmacy,
    Clinic,
    Hospital,
    Lab,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum FacilityStatus {
    Active,
    Blocked,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PartnerFacilityContacts {
    pub mobile: Option<String>,
    pub whatsapp: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PartnerFacility {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub partner_business_id: Option<String>,
    pub name: String,
    pub r#type: FacilityType,
    pub contacts: PartnerFacilityContacts,
    pub region: String,
    pub district: String,
    pub status: FacilityStatus,
    pub is_40labs_linked: bool,
    pub created_at: String,
    pub updated_at: String,
}
