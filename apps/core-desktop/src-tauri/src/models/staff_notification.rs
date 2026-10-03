use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Serialize, Deserialize, FromRow, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StaffNotification {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub sender_user_id: String,
    pub sender_name: String,
    pub audience: String, // 'broadcast' | 'role' | 'direct' | 'alert'
    pub target_role: Option<String>,
    pub target_user_id: Option<String>,
    pub severity: String, // 'info' | 'alert'
    pub subject: String,
    pub body: String,
    pub created_at: String,
    #[sqlx(skip)]
    pub is_read: bool,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateStaffNotificationPayload {
    pub audience: String,
    pub target_role: Option<String>,
    pub target_user_id: Option<String>,
    pub severity: Option<String>,
    pub subject: String,
    pub body: String,
}
