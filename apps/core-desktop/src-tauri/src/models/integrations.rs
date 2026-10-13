use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CollaboratorRef {
    pub user_id: String,
    pub full_name: String,
    pub scope: String, // 'view' | 'manage'
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationsConfig {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub email_connected: bool,
    pub email_address: Option<String>,
    pub whatsapp_connected: bool,
    pub whatsapp_number: Option<String>,
    pub web_apps_connected: Vec<String>,
    pub mobile_phone: Option<String>,
    pub collaborators: Vec<CollaboratorRef>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct UpdateIntegrationsPayload {
    pub email_connected: Option<bool>,
    pub email_address: Option<String>,
    pub whatsapp_connected: Option<bool>,
    pub whatsapp_number: Option<String>,
    pub web_apps_connected: Option<Vec<String>>,
    pub mobile_phone: Option<String>,
    pub collaborators: Option<Vec<CollaboratorRef>>,
}
