use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AckStatus {
    Applied,
    Stale,
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeAck {
    pub change_id: String,
    pub status: AckStatus,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct OutboxChange {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub entity: String,
    pub entity_id: String,
    pub op: String,
    pub payload: String,
    pub version: i64,
    pub status: String,
    pub attempts: i64,
    pub last_error: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatusInfo {
    pub state: String,
    pub pending: i64,
    pub last_ack_at: Option<String>,
}
