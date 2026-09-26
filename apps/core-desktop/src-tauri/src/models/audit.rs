use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AuditLogEntry {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub created_at: String,
    pub action: String,
    pub performed_by_user_id: String,
    pub target_entity_type: String,
    pub target_entity_id: String,
    pub metadata: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordAuditLogRequest {
    pub action: String,
    pub performed_by_user_id: String,
    pub target_entity_type: String,
    pub target_entity_id: String,
    pub metadata: Option<serde_json::Value>,
}
