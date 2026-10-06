use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum BusinessRoleScope {
    Pharmacy,
    Lab,
    Supplier,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PricingTier {
    Free,
    Class1,
    Class2,
    Class3,
    Class4Enterprise,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum OnboardingState {
    Registered,
    OwnerFirstLogin,
    SetupComplete,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AppearanceMode {
    Light,
    Dark,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessContacts {
    pub mobile: String,
    pub email: Option<String>,
    pub whatsapp: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessAddress {
    pub region: String,
    pub district: String,
    pub place: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Business {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub business_id: String,
    pub name: String,
    pub tin: Option<String>,
    pub tmda_number: Option<String>,
    pub role_scopes: Vec<BusinessRoleScope>,
    pub tier: PricingTier,
    pub contacts: BusinessContacts,
    pub address: BusinessAddress,
    pub logo_url: Option<String>,
    pub appearance_mode: AppearanceMode,
    pub owner_id: Option<String>,
    pub onboarding_state: Option<OnboardingState>,
    pub business_type: Option<String>,
    pub country: Option<String>,
    pub address_ward: Option<String>,
    pub address_street: Option<String>,
    pub address_area: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub lipa_namba: Option<String>,
    pub payment_number: Option<String>,
    pub declared_branch_count: Option<i32>,
    pub terms_version: Option<String>,
    pub terms_locale: Option<String>,
    pub terms_text_sha256: Option<String>,
    pub terms_accepted_at: Option<String>,
    pub terms_accepted_by_user_id: Option<String>,
    pub scale: Option<String>,
    pub idle_lock_minutes: i32,
    pub created_at: String,
    pub updated_at: String,
}
