use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AuditAction {
    StockAdjustment,
    Refund,
    PoApproval,
    LabResultOverride,
    DiscountAuthorization,
    PinChange,
    PasswordChange,
    DeviceBlock,
    DeviceRemove,
    BusinessPaymentChanged,
    IdleLockChanged,
    LoginSuccess,
    LoginFailed,
    LoginFailedUnknownUser,
    Custom(String),
}

impl AuditAction {
    pub fn as_str(&self) -> &str {
        match self {
            AuditAction::StockAdjustment => "stock_adjustment",
            AuditAction::Refund => "refund",
            AuditAction::PoApproval => "po_approval",
            AuditAction::LabResultOverride => "lab_result_override",
            AuditAction::DiscountAuthorization => "discount_authorization",
            AuditAction::PinChange => "pin_change",
            AuditAction::PasswordChange => "password_change",
            AuditAction::DeviceBlock => "device_block",
            AuditAction::DeviceRemove => "device_remove",
            AuditAction::BusinessPaymentChanged => "business_payment_changed",
            AuditAction::IdleLockChanged => "idle_lock_changed",
            AuditAction::LoginSuccess => "login_success",
            AuditAction::LoginFailed => "login_failed",
            AuditAction::LoginFailedUnknownUser => "login_failed_unknown_user",
            AuditAction::Custom(s) => s.as_str(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AuditLogEntry {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub created_at: String,
    pub action: String,
    pub performed_by_user_id: Option<String>,
    pub target_entity_type: String,
    pub target_entity_id: String,
    pub metadata: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordAuditLogRequest {
    pub action: String,
    pub performed_by_user_id: Option<String>,
    pub target_entity_type: String,
    pub target_entity_id: String,
    pub metadata: Option<serde_json::Value>,
}
