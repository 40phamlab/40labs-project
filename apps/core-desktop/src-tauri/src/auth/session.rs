use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

pub trait Clock: Send + Sync {
    fn now_secs(&self) -> u64;
    fn now_iso(&self) -> String;
}

pub struct RealClock;
impl Clock for RealClock {
    fn now_secs(&self) -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }
    fn now_iso(&self) -> String {
        chrono::Utc::now().to_rfc3339()
    }
}

#[derive(Debug, Clone)]
pub struct Session {
    pub user_id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub role: String,
    pub started_at: u64,
    pub last_activity: u64,
    pub locked: bool,
}

#[derive(Debug, Clone)]
pub struct StepUpGrant {
    pub actor_user_id: String,
    pub permission: String,
    pub approver_user_id: String,
    pub target: Option<String>,
    pub uses_remaining: u32,
    pub expires_at: u64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApproverInfo {
    pub user_id: String,
    pub display_name: String,
}

pub struct AuthState {
    pub session: RwLock<Option<Session>>,
    pub step_ups: RwLock<HashMap<String, StepUpGrant>>, // token -> grant
    pub clock: Arc<dyn Clock>,
}

impl AuthState {
    pub fn new(clock: Arc<dyn Clock>) -> Self {
        Self {
            session: RwLock::new(None),
            step_ups: RwLock::new(HashMap::new()),
            clock,
        }
    }
}
