use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub struct Branch {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub business_id: String,
    pub name: String,
    pub location: Option<String>,
    pub branch_code: String,
    pub status: String,
    pub contacts: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct CreateBranchPayload {
    pub name: String,
    pub location: String,
    pub branch_code: String,
    pub status: Option<String>,
    pub contacts: Option<String>,
    pub step_up_token: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub struct UpdateBranchPayload {
    pub name: Option<String>,
    pub location: Option<String>,
    pub status: Option<String>,
    pub contacts: Option<Option<String>>,
    pub step_up_token: Option<String>,
}
