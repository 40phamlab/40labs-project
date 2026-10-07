use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PairedDevice {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub user_id: String,
    pub device_label: String,
    pub device_type: String,
    pub status: String, // 'active' | 'blocked' | 'removed'
    pub permissions_json: String,
    pub credential_hash: Option<String>,
    pub last_connected_at: Option<String>,
    pub paired_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct StaffPermissionSet {
    pub can_update_stock: bool,
    pub can_adjust_stock: bool,
    pub can_issue_refund: bool,
    pub can_approve_po: bool,
    pub can_add_lab_sample: bool,
    pub can_override_lab_result: bool,
    pub can_view_reports: bool,
    #[serde(rename = "branches.manage", skip_serializing_if = "Option::is_none")]
    pub branches_manage: Option<bool>,
}

impl Default for StaffPermissionSet {
    fn default() -> Self {
        Self {
            can_update_stock: false,
            can_adjust_stock: false,
            can_issue_refund: false,
            can_approve_po: false,
            can_add_lab_sample: false,
            can_override_lab_result: false,
            can_view_reports: true,
            branches_manage: Some(false),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PairingSessionInfo {
    pub session_id: String,
    pub endpoint: String,
    pub expires_at: String,
    pub qr_payload: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PairDeviceRequest {
    pub session_id: String,
    pub token: String,
    pub device_label: String,
    pub device_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PairDeviceResponse {
    pub device: PairedDevice,
    pub credential: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePermissionsRequest {
    pub device_id: String,
    pub permissions: serde_json::Value,
}
