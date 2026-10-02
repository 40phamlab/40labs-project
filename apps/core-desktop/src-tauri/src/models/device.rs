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
    pub last_connected_at: Option<String>,
    pub paired_at: String,
    pub updated_at: String,
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
    pub device_label: String,
    pub device_type: String,
    pub user_id: String,
    pub permissions: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePermissionsRequest {
    pub device_id: String,
    pub permissions: serde_json::Value,
}
