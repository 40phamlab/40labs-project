use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Role {
    Sudo,
    Staff,
}

impl Role {
    pub fn as_str(&self) -> &'static str {
        match self {
            Role::Sudo => "sudo",
            Role::Staff => "staff",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RolePreset {
    Sudo,
    Admin,
    Pharmacist,
    LabTechnician,
}

impl RolePreset {
    pub fn as_str(&self) -> &'static str {
        match self {
            RolePreset::Sudo => "sudo",
            RolePreset::Admin => "admin",
            RolePreset::Pharmacist => "pharmacist",
            RolePreset::LabTechnician => "lab_technician",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Permission {
    UpdateStock,
    AdjustStock,
    IssueRefund,
    ApprovePo,
    AddLabSample,
    OverrideLabResult,
    ViewReports,
    InventoryAdjust,
    UsersManage,
    BranchesManage,
    SettingsManage,
    SalesRefund,
    InteractionOverride,
    PurchasesApprove,
    SalesDiscount,
    Custom(String),
}

impl Permission {
    pub fn as_str(&self) -> &str {
        match self {
            Permission::UpdateStock => "can_update_stock",
            Permission::AdjustStock => "can_adjust_stock",
            Permission::IssueRefund => "can_issue_refund",
            Permission::ApprovePo => "can_approve_po",
            Permission::AddLabSample => "can_add_lab_sample",
            Permission::OverrideLabResult => "can_override_lab_result",
            Permission::ViewReports => "can_view_reports",
            Permission::InventoryAdjust => "inventory.adjust",
            Permission::UsersManage => "users.manage",
            Permission::BranchesManage => "branches.manage",
            Permission::SettingsManage => "settings.manage",
            Permission::SalesRefund => "sales.refund",
            Permission::InteractionOverride => "interaction.override",
            Permission::PurchasesApprove => "purchases.approve",
            Permission::SalesDiscount => "sales.discount",
            Permission::Custom(s) => s.as_str(),
        }
    }

    pub fn is_flagged(&self) -> bool {
        matches!(self, Permission::BranchesManage) || self.as_str() == "branches.manage"
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum OnboardingState {
    Registered,
    OwnerFirstLogin,
    SetupComplete,
}

impl OnboardingState {
    pub fn as_str(&self) -> &'static str {
        match self {
            OnboardingState::Registered => "registered",
            OnboardingState::OwnerFirstLogin => "owner_first_login",
            OnboardingState::SetupComplete => "setup_complete",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum BoundDeviceStatus {
    Active,
    Revoked,
}

impl BoundDeviceStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            BoundDeviceStatus::Active => "active",
            BoundDeviceStatus::Revoked => "revoked",
        }
    }
}

/// Helper function to generate full_name display string from first and last names.
/// `full_name` is written ONLY via this helper.
pub fn format_full_name(first_name: &str, last_name: &str) -> String {
    format!("{} {}", first_name.trim(), last_name.trim())
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Owner {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub first_name: String,
    pub last_name: String,
    pub phone: String,
    pub phone_verified_at: Option<String>,
    pub email: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AppUser {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub username: String,
    pub first_name: String,
    pub last_name: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub role: String,
    pub role_preset: String,
    pub is_superintendent: i64,
    pub active: i64,
    pub owner_id: Option<String>,
    pub must_change_credentials: i64,
    pub last_login_at: Option<String>,
    pub created_by_user_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserCredential {
    pub user_id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub password_hash: String,
    pub pin_hash: String,
    pub failed_password_attempts: i64,
    pub failed_pin_attempts: i64,
    pub locked_until: Option<String>,
    pub password_changed_at: Option<String>,
    pub pin_changed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct RecoveryCode {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub user_id: String,
    pub batch_id: String,
    pub code_hash: String,
    pub used_at: Option<String>,
    pub invalidated_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct BoundDevice {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub device_label: String,
    pub public_key: String,
    pub bound_by_user_id: String,
    pub bound_at: String,
    pub last_sync_at: Option<String>,
    pub status: String,
    pub revoked_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PermissionGrant {
    pub id: String,
    pub workspace_id: String,
    pub branch_id: String,
    pub user_id: String,
    pub permission: String,
    pub granted_by_user_id: String,
    pub created_at: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_db_pool_with_url;

    #[test]
    fn test_format_full_name() {
        assert_eq!(format_full_name(" John ", " Doe "), "John Doe");
        assert_eq!(format_full_name("Sairiamu", "S."), "Sairiamu S.");
    }

    #[tokio::test]
    async fn test_auth_schema_crud() {
        let pool = init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to init in-memory db for auth tests");

        // 1. Insert Owner
        sqlx::query(
            r#"
            INSERT INTO owner (id, workspace_id, branch_id, first_name, last_name, phone)
            VALUES ('owner_1', 'ws_1', 'br_1', 'Amani', 'Owner', '+255712345678')
            "#,
        )
        .execute(&pool)
        .await
        .unwrap();

        let owner: Owner = sqlx::query_as("SELECT * FROM owner WHERE id = 'owner_1'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(owner.first_name, "Amani");

        // 2. Insert AppUser with full_name formatted
        let display_name = format_full_name("Fatma", "Pharmacist");
        sqlx::query(
            r#"
            INSERT INTO app_user (id, workspace_id, branch_id, username, first_name, last_name, full_name, role, role_preset, is_superintendent, active, owner_id)
            VALUES ('user_1', 'ws_1', 'br_1', 'fatma_ph', 'Fatma', 'Pharmacist', ?, 'staff', 'pharmacist', 1, 1, 'owner_1')
            "#
        )
        .bind(&display_name)
        .execute(&pool)
        .await
        .unwrap();

        let user: AppUser = sqlx::query_as("SELECT * FROM app_user WHERE id = 'user_1'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(user.full_name, "Fatma Pharmacist");
        assert_eq!(user.role_preset, "pharmacist");
        assert_eq!(user.is_superintendent, 1);

        // 3. Insert UserCredential
        sqlx::query(
            r#"
            INSERT INTO user_credential (user_id, workspace_id, branch_id, password_hash, pin_hash)
            VALUES ('user_1', 'ws_1', 'br_1', 'argon2_hash', 'argon2_pin_hash')
            "#
        )
        .execute(&pool)
        .await
        .unwrap();

        let cred: UserCredential = sqlx::query_as("SELECT * FROM user_credential WHERE user_id = 'user_1'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(cred.password_hash, "argon2_hash");

        // 4. Insert RecoveryCode
        sqlx::query(
            r#"
            INSERT INTO recovery_code (id, workspace_id, branch_id, user_id, batch_id, code_hash)
            VALUES ('rec_1', 'ws_1', 'br_1', 'user_1', 'batch_1', 'code_hash_val')
            "#
        )
        .execute(&pool)
        .await
        .unwrap();

        let rec: RecoveryCode = sqlx::query_as("SELECT * FROM recovery_code WHERE id = 'rec_1'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(rec.batch_id, "batch_1");

        // 5. Insert BoundDevice
        sqlx::query(
            r#"
            INSERT INTO bound_device (id, workspace_id, branch_id, device_label, public_key, bound_by_user_id)
            VALUES ('bound_1', 'ws_1', 'br_1', 'Main POS Counter', 'pubkey_123', 'user_1')
            "#
        )
        .execute(&pool)
        .await
        .unwrap();

        let bound: BoundDevice = sqlx::query_as("SELECT * FROM bound_device WHERE id = 'bound_1'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(bound.device_label, "Main POS Counter");
        assert_eq!(bound.status, "active");

        // 6. Insert PermissionGrant
        sqlx::query(
            r#"
            INSERT INTO permission_grant (id, workspace_id, branch_id, user_id, permission, granted_by_user_id)
            VALUES ('grant_1', 'ws_1', 'br_1', 'user_1', 'inventory:adjust', 'user_1')
            "#
        )
        .execute(&pool)
        .await
        .unwrap();

        let grant: PermissionGrant = sqlx::query_as("SELECT * FROM permission_grant WHERE id = 'grant_1'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(grant.permission, "inventory:adjust");
    }
}
