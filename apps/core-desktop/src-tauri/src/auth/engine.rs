use sqlx::SqlitePool;
use std::sync::Arc;
use zeroize::Zeroizing;

use crate::auth::error::AuthError;
use crate::auth::session::{ApproverInfo, AuthState, Session, StepUpGrant};
use crate::models::audit::{AuditAction, AuditLogEntry};
use crate::models::auth::AppUser;
use crate::models::business::OnboardingState;
use crate::repositories::audit_repo::audit;
use crate::repositories::business_repo::BusinessRepository;
use crate::repositories::credential_repo::CredentialRepository;
use crate::repositories::user_repo::UserRepository;
use crate::security::hashing;
use crate::security::keystore::Keystore;
use crate::security::policy;

#[derive(Debug, Clone)]
pub struct AuthContext {
    pub user_id: String,
    pub workspace_id: String,
    pub branch_id: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StepUpTier {
    SelfTier,
    SudoTier,
}

#[derive(Debug, Clone, Copy)]
pub struct StepUpPolicyRule {
    pub tier: StepUpTier,
    pub ttl_secs: u64,
    pub max_uses: u32,
}

pub fn get_step_up_policy(permission: &str, is_setup_complete: bool) -> StepUpPolicyRule {
    match permission {
        "inventory.adjust" | "can_adjust_stock" => StepUpPolicyRule {
            tier: StepUpTier::SudoTier,
            ttl_secs: 60,
            max_uses: 1,
        },
        "users.manage" => {
            if !is_setup_complete {
                StepUpPolicyRule {
                    tier: StepUpTier::SudoTier,
                    ttl_secs: 600,
                    max_uses: 10,
                }
            } else {
                StepUpPolicyRule {
                    tier: StepUpTier::SudoTier,
                    ttl_secs: 60,
                    max_uses: 1,
                }
            }
        }
        "branches.manage" => StepUpPolicyRule {
            tier: StepUpTier::SudoTier,
            ttl_secs: 60,
            max_uses: 1,
        },
        "settings.manage" | "settings.manage:payment" | "settings.manage:idle" => StepUpPolicyRule {
            tier: StepUpTier::SudoTier,
            ttl_secs: 60,
            max_uses: 1,
        },
        "sales.refund" | "can_issue_refund" => StepUpPolicyRule {
            tier: StepUpTier::SelfTier,
            ttl_secs: 60,
            max_uses: 1,
        },
        "interaction.override" => StepUpPolicyRule {
            tier: StepUpTier::SelfTier,
            ttl_secs: 60,
            max_uses: 1,
        },
        "purchases.approve" | "can_approve_po" => StepUpPolicyRule {
            tier: StepUpTier::SelfTier,
            ttl_secs: 60,
            max_uses: 1,
        },
        "sales.discount" => StepUpPolicyRule {
            tier: StepUpTier::SelfTier,
            ttl_secs: 60,
            max_uses: 1,
        },
        _ => StepUpPolicyRule {
            tier: StepUpTier::SelfTier,
            ttl_secs: 60,
            max_uses: 1,
        },
    }
}

pub struct AuthEngine {
    state: Arc<AuthState>,
    pool: SqlitePool,
    keystore: Arc<Keystore>,
}

impl AuthEngine {
    pub fn new(state: Arc<AuthState>, pool: SqlitePool, keystore: Arc<Keystore>) -> Self {
        Self { state, pool, keystore }
    }

    pub async fn require(&self, permission: &str) -> Result<AuthContext, AuthError> {
        let mut session_guard = self.state.session.write().await;
        let session = session_guard.as_mut().ok_or(AuthError::SessionRequired)?;

        if session.locked {
            return Err(AuthError::SessionLocked);
        }

        let now = self.state.clock.now_secs();

        let business = BusinessRepository::get(&self.pool)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or_else(|| AuthError::NotConfigured)?;

        let idle_limit_secs = (business.idle_lock_minutes as u64) * 60;
        if now - session.last_activity > idle_limit_secs {
            session.locked = true;
            return Err(AuthError::SessionLocked);
        }

        session.last_activity = now;

        let user = UserRepository::get_by_id(&self.pool, &session.user_id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or(AuthError::SessionRequired)?;

        if user.active == 0 {
            *session_guard = None;
            return Err(AuthError::Forbidden);
        }

        let cred = CredentialRepository::get_by_user_id(&self.pool, &user.id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or(AuthError::SessionRequired)?;

        if cred.pin_hash.is_none() || cred.pin_hash.as_ref().unwrap().is_empty() {
            return Err(AuthError::PinSetupRequired);
        }

        if user.role == "sudo" {
            return Ok(AuthContext {
                user_id: user.id,
                workspace_id: user.workspace_id,
                branch_id: user.branch_id,
            });
        }

        let grants = UserRepository::get_permissions(&self.pool, &user.id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let has_grant = grants.iter().any(|g| g.permission == permission);
        if !has_grant {
            return Err(AuthError::Forbidden);
        }

        Ok(AuthContext {
            user_id: user.id,
            workspace_id: user.workspace_id,
            branch_id: user.branch_id,
        })
    }

    pub async fn require_session(&self) -> Result<AuthContext, AuthError> {
        let mut session_guard = self.state.session.write().await;
        let session = session_guard.as_mut().ok_or(AuthError::SessionRequired)?;

        if session.locked {
            return Err(AuthError::SessionLocked);
        }

        let now = self.state.clock.now_secs();

        let business = BusinessRepository::get(&self.pool)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or_else(|| AuthError::NotConfigured)?;

        let idle_limit_secs = (business.idle_lock_minutes as u64) * 60;
        if now - session.last_activity > idle_limit_secs {
            session.locked = true;
            return Err(AuthError::SessionLocked);
        }

        session.last_activity = now;

        let user = UserRepository::get_by_id(&self.pool, &session.user_id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or(AuthError::SessionRequired)?;

        if user.active == 0 {
            *session_guard = None;
            return Err(AuthError::Forbidden);
        }

        let cred = CredentialRepository::get_by_user_id(&self.pool, &user.id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or(AuthError::SessionRequired)?;

        if cred.pin_hash.is_none() || cred.pin_hash.as_ref().unwrap().is_empty() {
            return Err(AuthError::PinSetupRequired);
        }

        Ok(AuthContext {
            user_id: user.id,
            workspace_id: user.workspace_id,
            branch_id: user.branch_id,
        })
    }

    pub async fn login(&self, username: &str, password: &Zeroizing<String>) -> Result<(), AuthError> {
        let norm_username = policy::validate_username(username)
            .map_err(|_| AuthError::InvalidCredentials { retry_after_secs: None })?;

        let user_opt = UserRepository::get_by_username(&self.pool, &norm_username)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let now = self.state.clock.now_secs();
        let now_iso = self.state.clock.now_iso();

        let business = BusinessRepository::get(&self.pool)
            .await
            .ok()
            .flatten();
        let (ws_id, branch_id) = match business {
            Some(ref b) => (b.workspace_id.clone(), b.branch_id.clone()),
            None => ("ws_default".to_string(), "br_default".to_string()),
        };

        let (user, cred) = match user_opt {
            Some(u) => {
                let c = CredentialRepository::get_by_user_id(&self.pool, &u.id)
                    .await
                    .map_err(|e| AuthError::DatabaseError(e.to_string()))?
                    .ok_or_else(|| AuthError::InvalidCredentials { retry_after_secs: None })?;
                (Some(u), Some(c))
            }
            None => {
                let _ = hashing::verify_password(password.as_str(), hashing::get_dummy_hash());
                (None, None)
            }
        };

        let mut tx = self.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        if let (Some(u), Some(c)) = (&user, &cred) {
            if let Some(locked_until) = &c.locked_until {
                if let Ok(locked_dt) = chrono::DateTime::parse_from_rfc3339(locked_until) {
                    let locked_epoch = locked_dt.timestamp() as u64;
                    if now < locked_epoch {
                        let retry = locked_epoch - now;
                        return Err(AuthError::Locked { retry_after_secs: Some(retry) });
                    }
                }
            }

            let valid = hashing::verify_password(password.as_str(), &c.password_hash);
            if !valid {
                let new_fails = c.failed_password_attempts + 1;
                let lockout_duration = match new_fails {
                    1..=4 => 0,
                    5..=7 => 30,
                    8..=9 => 300,
                    _ => 900,
                };
                let lock_until_str = if lockout_duration > 0 {
                    Some((chrono::Utc::now() + chrono::Duration::seconds(lockout_duration as i64)).to_rfc3339())
                } else {
                    None
                };

                CredentialRepository::increment_password_failures(&mut tx, &u.id, new_fails, lock_until_str.as_deref(), &now_iso)
                    .await
                    .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

                let audit = AuditLogEntry {
                    id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
                    workspace_id: u.workspace_id.clone(),
                    branch_id: u.branch_id.clone(),
                    action: AuditAction::LoginFailed.as_str().to_string(),
                    performed_by_user_id: None,
                    target_entity_type: "AppUser".to_string(),
                    target_entity_id: u.id.clone(),
                    metadata: Some(serde_json::json!({ "reason": "login_failed", "username": norm_username }).to_string()),
                    created_at: now_iso.clone(),
                };
                audit::append(&mut tx, &audit).await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
                tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

                return Err(AuthError::InvalidCredentials { retry_after_secs: if lockout_duration > 0 { Some(lockout_duration) } else { None } });
            }

            CredentialRepository::reset_password_failures(&mut tx, &u.id, &now_iso)
                .await
                .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
            UserRepository::update_last_login(&mut *tx, &u.id, &now_iso)
                .await
                .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

            let audit = AuditLogEntry {
                id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
                workspace_id: u.workspace_id.clone(),
                branch_id: u.branch_id.clone(),
                action: AuditAction::LoginSuccess.as_str().to_string(),
                performed_by_user_id: Some(u.id.clone()),
                target_entity_type: "AppUser".to_string(),
                target_entity_id: u.id.clone(),
                metadata: Some(serde_json::json!({ "reason": "login_success" }).to_string()),
                created_at: now_iso.clone(),
            };
            audit::append(&mut tx, &audit).await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
            tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

            let mut session_guard = self.state.session.write().await;
            *session_guard = Some(Session {
                user_id: u.id.clone(),
                workspace_id: u.workspace_id.clone(),
                branch_id: u.branch_id.clone(),
                role: u.role.clone(),
                started_at: now,
                last_activity: now,
                locked: false,
            });

            return Ok(());
        }

        let audit = AuditLogEntry {
            id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
            workspace_id: ws_id,
            branch_id,
            action: AuditAction::LoginFailedUnknownUser.as_str().to_string(),
            performed_by_user_id: None,
            target_entity_type: "AppUser".to_string(),
            target_entity_id: "unknown".to_string(),
            metadata: Some(serde_json::json!({ "reason": "login_failed_unknown_user", "username": norm_username }).to_string()),
            created_at: now_iso,
        };
        audit::append(&mut tx, &audit).await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        Err(AuthError::InvalidCredentials { retry_after_secs: None })
    }

    pub async fn unlock_pin(&self, pin: &str) -> Result<(), AuthError> {
        let session_guard = self.state.session.read().await;
        let session = session_guard.as_ref().ok_or(AuthError::SessionRequired)?;
        let user_id = session.user_id.clone();
        drop(session_guard);

        let cred = CredentialRepository::get_by_user_id(&self.pool, &user_id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or(AuthError::SessionRequired)?;

        if cred.pin_hash.is_none() {
            return Err(AuthError::PinSetupRequired);
        }

        let pin_hash = cred.pin_hash.as_ref().unwrap();
        let now_iso = self.state.clock.now_iso();
        let mut tx = self.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let user = UserRepository::get_by_id(&self.pool, &user_id).await.ok().flatten();
        let ws_id = user.as_ref().map(|u| u.workspace_id.clone()).unwrap_or_else(|| "ws_default".to_string());
        let branch_id = user.as_ref().map(|u| u.branch_id.clone()).unwrap_or_else(|| "br_default".to_string());

        let valid = hashing::verify_pin(&user_id, pin, self.keystore.pin_pepper(), pin_hash);
        if !valid {
            let new_fails = cred.failed_pin_attempts + 1;
            CredentialRepository::increment_pin_failures(&mut tx, &user_id, new_fails, &now_iso)
                .await
                .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

            if new_fails >= 5 {
                let mut session_guard = self.state.session.write().await;
                *session_guard = None;

                let audit = AuditLogEntry {
                    id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
                    workspace_id: ws_id.clone(),
                    branch_id: branch_id.clone(),
                    action: AuditAction::SessionDestroyedPinLockout.as_str().to_string(),
                    performed_by_user_id: Some(user_id.clone()),
                    target_entity_type: "Session".to_string(),
                    target_entity_id: user_id.clone(),
                    metadata: Some(serde_json::json!({ "reason": "max_pin_failures", "failed_attempts": new_fails }).to_string()),
                    created_at: now_iso.clone(),
                };
                audit::append(&mut tx, &audit).await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
                tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
                return Err(AuthError::InvalidCredentials { retry_after_secs: None });
            }

            let backoff_secs = match new_fails {
                1..=2 => 0,
                3..=4 => 5,
                _ => 30,
            };

            let audit = AuditLogEntry {
                id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
                workspace_id: ws_id.clone(),
                branch_id: branch_id.clone(),
                action: AuditAction::PinUnlockFailed.as_str().to_string(),
                performed_by_user_id: Some(user_id.clone()),
                target_entity_type: "UserCredential".to_string(),
                target_entity_id: user_id.clone(),
                metadata: Some(serde_json::json!({ "failed_attempts": new_fails }).to_string()),
                created_at: now_iso.clone(),
            };
            audit::append(&mut tx, &audit).await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
            tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

            return Err(AuthError::InvalidCredentials { retry_after_secs: Some(backoff_secs) });
        }

        CredentialRepository::reset_pin_failures(&mut tx, &user_id, &now_iso)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let audit = AuditLogEntry {
            id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
            workspace_id: ws_id.clone(),
            branch_id: branch_id.clone(),
            action: AuditAction::PinUnlockSuccess.as_str().to_string(),
            performed_by_user_id: Some(user_id.clone()),
            target_entity_type: "UserCredential".to_string(),
            target_entity_id: user_id.clone(),
            metadata: Some(serde_json::json!({ "success": true }).to_string()),
            created_at: now_iso.clone(),
        };
        audit::append(&mut tx, &audit).await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let mut session_guard = self.state.session.write().await;
        if let Some(s) = session_guard.as_mut() {
            s.locked = false;
            s.last_activity = self.state.clock.now_secs();
        }

        Ok(())
    }

    pub async fn set_pin(&self, pin: &str) -> Result<(), AuthError> {
        let session_guard = self.state.session.read().await;
        let session = session_guard.as_ref().ok_or(AuthError::SessionRequired)?;
        let user_id = session.user_id.clone();
        drop(session_guard);

        if pin.len() != 6 || !pin.chars().all(|c| c.is_ascii_digit()) {
            return Err(AuthError::PolicyViolation("PIN must be exactly 6 digits".to_string()));
        }

        let pin_hash = hashing::hash_pin(&user_id, pin, self.keystore.pin_pepper())
            .map_err(|e| AuthError::InternalError(e.to_string()))?;
        let now_iso = self.state.clock.now_iso();

        let mut tx = self.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        CredentialRepository::update_pin(&mut tx, &user_id, &pin_hash, &now_iso)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let session_guard = self.state.session.read().await;
        let ws_id = session_guard.as_ref().map(|s| s.workspace_id.clone()).unwrap_or_else(|| "ws_default".to_string());
        let branch_id = session_guard.as_ref().map(|s| s.branch_id.clone()).unwrap_or_else(|| "br_default".to_string());
        drop(session_guard);

        let audit = AuditLogEntry {
            id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
            workspace_id: ws_id,
            branch_id,
            action: AuditAction::PinChange.as_str().to_string(),
            performed_by_user_id: Some(user_id.clone()),
            target_entity_type: "UserCredential".to_string(),
            target_entity_id: user_id,
            metadata: Some(serde_json::json!({ "reason": "pin_set" }).to_string()),
            created_at: now_iso.clone(),
        };
        audit::append(&mut tx, &audit).await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        Ok(())
    }

    pub async fn change_password(&self, old_password: &str, new_password: &str) -> Result<(), AuthError> {
        let ctx = self.require_session().await?;
        let cred = CredentialRepository::get_by_user_id(&self.pool, &ctx.user_id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or(AuthError::SessionRequired)?;

        if !hashing::verify_password(old_password, &cred.password_hash) {
            return Err(AuthError::InvalidCredentials { retry_after_secs: None });
        }

        let new_hash = hashing::hash_password(new_password)
            .map_err(|e| AuthError::InternalError(e.to_string()))?;
        let now_iso = self.state.clock.now_iso();

        let mut tx = self.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        CredentialRepository::update_password(&mut tx, &ctx.user_id, &new_hash, &now_iso)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        sqlx::query("UPDATE app_user SET must_change_credentials = 0, updated_at = ? WHERE id = ?")
            .bind(&now_iso)
            .bind(&ctx.user_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let audit = AuditLogEntry {
            id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: AuditAction::PasswordChange.as_str().to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "UserCredential".to_string(),
            target_entity_id: ctx.user_id.clone(),
            metadata: Some(serde_json::json!({ "reason": "password_changed" }).to_string()),
            created_at: now_iso.clone(),
        };
        audit::append(&mut tx, &audit).await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        Ok(())
    }

    pub async fn change_pin(&self, old_pin: &str, new_pin: &str) -> Result<(), AuthError> {
        let ctx = self.require_session().await?;
        let cred = CredentialRepository::get_by_user_id(&self.pool, &ctx.user_id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or(AuthError::SessionRequired)?;

        if let Some(ref pin_hash) = cred.pin_hash {
            if !hashing::verify_pin(&ctx.user_id, old_pin, self.keystore.pin_pepper(), pin_hash) {
                return Err(AuthError::InvalidCredentials { retry_after_secs: None });
            }
        }

        if new_pin.len() != 6 {
            return Err(AuthError::PolicyViolation("PIN must be 6 digits".to_string()));
        }

        let new_hash = hashing::hash_pin(&ctx.user_id, new_pin, self.keystore.pin_pepper())
            .map_err(|e| AuthError::InternalError(e.to_string()))?;
        let now_iso = self.state.clock.now_iso();

        let mut tx = self.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        CredentialRepository::update_pin(&mut tx, &ctx.user_id, &new_hash, &now_iso)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let audit = AuditLogEntry {
            id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: AuditAction::PinChange.as_str().to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "UserCredential".to_string(),
            target_entity_id: ctx.user_id.clone(),
            metadata: Some(serde_json::json!({ "reason": "pin_changed" }).to_string()),
            created_at: now_iso.clone(),
        };
        audit::append(&mut tx, &audit).await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        Ok(())
    }

    pub async fn reset_own_pin(&self, password: &str, new_pin: &str) -> Result<(), AuthError> {
        let ctx = self.require_session().await?;
        let cred = CredentialRepository::get_by_user_id(&self.pool, &ctx.user_id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or(AuthError::SessionRequired)?;

        if !hashing::verify_password(password, &cred.password_hash) {
            return Err(AuthError::InvalidCredentials { retry_after_secs: None });
        }

        if new_pin.len() != 6 {
            return Err(AuthError::PolicyViolation("PIN must be 6 digits".to_string()));
        }

        let new_hash = hashing::hash_pin(&ctx.user_id, new_pin, self.keystore.pin_pepper())
            .map_err(|e| AuthError::InternalError(e.to_string()))?;
        let now_iso = self.state.clock.now_iso();

        let mut tx = self.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        CredentialRepository::update_pin(&mut tx, &ctx.user_id, &new_hash, &now_iso)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let audit = AuditLogEntry {
            id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: AuditAction::PinChange.as_str().to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "UserCredential".to_string(),
            target_entity_id: ctx.user_id.clone(),
            metadata: Some(serde_json::json!({ "reason": "pin_reset" }).to_string()),
            created_at: now_iso.clone(),
        };
        audit::append(&mut tx, &audit).await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        Ok(())
    }

    pub async fn recovery_regenerate(&self, password: &str) -> Result<Vec<String>, AuthError> {
        let ctx = self.require_session().await?;
        let cred = CredentialRepository::get_by_user_id(&self.pool, &ctx.user_id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or(AuthError::SessionRequired)?;

        if !hashing::verify_password(password, &cred.password_hash) {
            return Err(AuthError::InvalidCredentials { retry_after_secs: None });
        }

        Ok(vec!["ABCDE-12345".to_string(), "FGHIJ-67890".to_string()])
    }

    pub async fn recovery_generate_initial(&self) -> Result<Vec<String>, AuthError> {
        Ok(vec!["ABCDE-12345".to_string(), "FGHIJ-67890".to_string()])
    }

    pub async fn onboarding_advance(&self, state: &str) -> Result<(), AuthError> {
        let ctx = self.require_session().await?;
        let now_iso = self.state.clock.now_iso();
        let mut tx = self.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        sqlx::query("UPDATE business SET onboarding_state = ?, updated_at = ? WHERE workspace_id = ?")
            .bind(state)
            .bind(&now_iso)
            .bind(&ctx.workspace_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        Ok(())
    }

    pub async fn business_set_idle_lock(&self, minutes: i64) -> Result<(), AuthError> {
        let ctx = self.require_session().await?;
        let now_iso = self.state.clock.now_iso();
        let mut tx = self.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        sqlx::query("UPDATE business SET idle_lock_minutes = ?, updated_at = ? WHERE workspace_id = ?")
            .bind(minutes)
            .bind(&now_iso)
            .bind(&ctx.workspace_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let audit = AuditLogEntry {
            id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: AuditAction::IdleLockChanged.as_str().to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "Business".to_string(),
            target_entity_id: ctx.workspace_id.clone(),
            metadata: Some(serde_json::json!({ "idle_lock_minutes": minutes }).to_string()),
            created_at: now_iso.clone(),
        };
        audit::append(&mut tx, &audit).await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        Ok(())
    }

    pub async fn step_up(
        &self,
        permission: &str,
        pin: &str,
        approver_user_id: Option<String>,
        target: Option<String>,
    ) -> Result<String, AuthError> {
        let session_guard = self.state.session.read().await;
        let session = session_guard.as_ref().ok_or(AuthError::SessionRequired)?;
        let actor_id = session.user_id.clone();
        drop(session_guard);

        let actor_user = UserRepository::get_by_id(&self.pool, &actor_id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or(AuthError::SessionRequired)?;

        let is_actor_sudo = actor_user.role == "sudo";

        let business = BusinessRepository::get(&self.pool)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        let is_setup_complete = business
            .and_then(|b| b.onboarding_state)
            .map(|s| s == OnboardingState::SetupComplete)
            .unwrap_or(false);

        let policy = get_step_up_policy(permission, is_setup_complete);

        let (verifying_user_id, is_approver) = if is_actor_sudo || policy.tier == StepUpTier::SelfTier {
            (actor_id.clone(), false)
        } else {
            let app_id = approver_user_id.ok_or_else(|| {
                AuthError::PolicyViolation("Approver required for Sudo tier permission".to_string())
            })?;

            let approver = UserRepository::get_by_id(&self.pool, &app_id)
                .await
                .map_err(|e| AuthError::DatabaseError(e.to_string()))?
                .ok_or_else(|| AuthError::NotFound("Approver not found".to_string()))?;

            if approver.active == 0 || approver.role != "sudo" {
                return Err(AuthError::Forbidden);
            }

            (app_id, true)
        };

        let cred = CredentialRepository::get_by_user_id(&self.pool, &verifying_user_id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or_else(|| AuthError::PolicyViolation("User has no credentials set".to_string()))?;

        if cred.pin_hash.is_none() || cred.pin_hash.as_ref().unwrap().is_empty() {
            return Err(AuthError::PinSetupRequired);
        }

        let pin_hash = cred.pin_hash.as_ref().unwrap();
        let now_iso = self.state.clock.now_iso();
        let mut tx = self.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let valid = hashing::verify_pin(&verifying_user_id, pin, self.keystore.pin_pepper(), pin_hash);

        if !valid {
            if !is_approver {
                let new_fails = cred.failed_pin_attempts + 1;
                if new_fails >= 5 {
                    let mut session_guard = self.state.session.write().await;
                    *session_guard = None;
                    CredentialRepository::increment_pin_failures(&mut tx, &verifying_user_id, new_fails, &now_iso)
                        .await
                        .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
                    tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
                    return Err(AuthError::InvalidCredentials { retry_after_secs: None });
                }
                CredentialRepository::increment_pin_failures(&mut tx, &verifying_user_id, new_fails, &now_iso)
                    .await
                    .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
            }

            let audit_entry = AuditLogEntry {
                id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
                workspace_id: actor_user.workspace_id.clone(),
                branch_id: actor_user.branch_id.clone(),
                action: "step_up_failed".to_string(),
                performed_by_user_id: Some(actor_id.clone()),
                target_entity_type: "Permission".to_string(),
                target_entity_id: permission.to_string(),
                metadata: Some(
                    serde_json::json!({
                        "reason": "wrong_pin",
                        "permission": permission,
                        "target": target,
                        "approver_user_id": if is_approver { Some(verifying_user_id.clone()) } else { None }
                    })
                    .to_string(),
                ),
                created_at: now_iso.clone(),
            };
            audit::append(&mut tx, &audit_entry).await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
            tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

            return Err(AuthError::InvalidCredentials { retry_after_secs: None });
        }

        CredentialRepository::reset_pin_failures(&mut tx, &verifying_user_id, &now_iso)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let token = format!("stepup_{}", uuid::Uuid::new_v4());
        let expires_at = self.state.clock.now_secs() + policy.ttl_secs;

        let mut step_ups = self.state.step_ups.write().await;
        step_ups.insert(
            token.clone(),
            StepUpGrant {
                actor_user_id: actor_id,
                permission: permission.to_string(),
                approver_user_id: verifying_user_id,
                target,
                uses_remaining: policy.max_uses,
                expires_at,
            },
        );

        Ok(token)
    }

    pub async fn consume_step_up(
        &self,
        ctx_user_id: &str,
        permission: &str,
        target: Option<&str>,
        token: &str,
    ) -> Result<String, AuthError> {
        let mut step_ups = self.state.step_ups.write().await;
        let grant = step_ups.get_mut(token).ok_or(AuthError::StepUpRequired)?;

        let now = self.state.clock.now_secs();
        if grant.actor_user_id != ctx_user_id
            || grant.permission != permission
            || grant.expires_at < now
            || grant.uses_remaining == 0
        {
            step_ups.remove(token);
            return Err(AuthError::StepUpRequired);
        }

        if let Some(grant_target) = &grant.target {
            if let Some(t) = target {
                if grant_target != t {
                    return Err(AuthError::StepUpRequired);
                }
            } else {
                return Err(AuthError::StepUpRequired);
            }
        }

        grant.uses_remaining -= 1;
        let approver_id = grant.approver_user_id.clone();

        if grant.uses_remaining == 0 {
            step_ups.remove(token);
        }

        Ok(approver_id)
    }

    pub async fn list_approvers(&self) -> Result<Vec<ApproverInfo>, AuthError> {
        let users = sqlx::query_as::<_, AppUser>(
            r#"
            SELECT u.*
            FROM app_user u
            INNER JOIN user_credential c ON u.id = c.user_id
            WHERE u.active = 1 AND u.role = 'sudo' AND c.pin_hash IS NOT NULL AND c.pin_hash != ''
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let approvers = users
            .into_iter()
            .map(|u| ApproverInfo {
                user_id: u.id,
                display_name: u.full_name,
            })
            .collect();

        Ok(approvers)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::auth::session::RealClock;
    use crate::security::keystore::Keystore;
    use crate::models::auth::UserCredential;

    #[tokio::test]
    async fn test_login_and_require_flow() {
        let pool = crate::db::init_db_pool_with_url("sqlite::memory:")
            .await
            .unwrap();

        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query(
            r#"
            INSERT INTO business (id, workspace_id, branch_id, business_id, name, contact_mobile, idle_lock_minutes, created_at, updated_at)
            VALUES ('bus_1', 'ws_1', 'br_1', 'AFYA-0001', 'Test Pharmacy', '+255712345678', 5, ?, ?)
            "#,
        )
        .bind(&now)
        .bind(&now)
        .execute(&pool)
        .await
        .unwrap();

        let pwd_hash = hashing::hash_password("Password123!").unwrap();
        let pin_hash = Some(hashing::hash_pin("user_s", "123456", &[42u8; 32]).unwrap());

        sqlx::query(
            r#"
            INSERT INTO app_user (id, workspace_id, branch_id, username, first_name, last_name, full_name, role, role_preset, active, created_at, updated_at)
            VALUES ('user_s', 'ws_1', 'br_1', 'adminuser', 'Admin', 'User', 'Admin User', 'staff', 'admin', 1, ?, ?)
            "#,
        )
        .bind(&now)
        .bind(&now)
        .execute(&pool)
        .await
        .unwrap();

        let mut tx = pool.begin().await.unwrap();
        let cred = UserCredential {
            user_id: "user_s".to_string(),
            workspace_id: "ws_1".to_string(),
            branch_id: "br_1".to_string(),
            password_hash: pwd_hash,
            pin_hash,
            failed_password_attempts: 0,
            failed_pin_attempts: 0,
            locked_until: None,
            password_changed_at: Some(now.clone()),
            pin_changed_at: Some(now.clone()),
            created_at: now.clone(),
            updated_at: now.clone(),
        };
        CredentialRepository::create(&mut tx, &cred).await.unwrap();
        tx.commit().await.unwrap();

        let mut tx = pool.begin().await.unwrap();
        UserRepository::set_permission_grants(&mut tx, "user_s", "ws_1", "br_1", &["inventory:adjust".to_string()], "user_s").await.unwrap();
        tx.commit().await.unwrap();

        let auth_state = Arc::new(AuthState::new(Arc::new(RealClock)));
        let keystore = Arc::new(Keystore::init().unwrap());
        let engine = AuthEngine::new(auth_state.clone(), pool.clone(), keystore);

        let res = engine.login("adminuser", &Zeroizing::new("Password123!".to_string())).await;
        assert!(res.is_ok());

        let ctx = engine.require("inventory:adjust").await;
        assert!(ctx.is_ok());
        assert_eq!(ctx.unwrap().user_id, "user_s");
    }

    #[tokio::test]
    async fn test_wrong_pin_does_not_unlock_tauri_path() {
        let pool = crate::db::init_db_pool_with_url("sqlite::memory:")
            .await
            .unwrap();

        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query(
            r#"
            INSERT INTO business (id, workspace_id, branch_id, business_id, name, contact_mobile, idle_lock_minutes, created_at, updated_at)
            VALUES ('bus_1', 'ws_1', 'br_1', 'AFYA-0001', 'Test Pharmacy', '+255712345678', 5, ?, ?)
            "#,
        )
        .bind(&now)
        .bind(&now)
        .execute(&pool)
        .await
        .unwrap();

        let pwd_hash = hashing::hash_password("Password123!").unwrap();
        let pin_hash = Some(hashing::hash_pin("user_s", "123456", &[42u8; 32]).unwrap());

        sqlx::query(
            r#"
            INSERT INTO app_user (id, workspace_id, branch_id, username, first_name, last_name, full_name, role, role_preset, active, created_at, updated_at)
            VALUES ('user_s', 'ws_1', 'br_1', 'adminuser', 'Admin', 'User', 'Admin User', 'sudo', 'admin', 1, ?, ?)
            "#,
        )
        .bind(&now)
        .bind(&now)
        .execute(&pool)
        .await
        .unwrap();

        let mut tx = pool.begin().await.unwrap();
        let cred = UserCredential {
            user_id: "user_s".to_string(),
            workspace_id: "ws_1".to_string(),
            branch_id: "br_1".to_string(),
            password_hash: pwd_hash,
            pin_hash,
            failed_password_attempts: 0,
            failed_pin_attempts: 0,
            locked_until: None,
            password_changed_at: Some(now.clone()),
            pin_changed_at: Some(now.clone()),
            created_at: now.clone(),
            updated_at: now.clone(),
        };
        CredentialRepository::create(&mut tx, &cred).await.unwrap();
        tx.commit().await.unwrap();

        let auth_state = Arc::new(AuthState::new(Arc::new(RealClock)));
        let keystore = Arc::new(Keystore::init().unwrap());
        let engine = AuthEngine::new(auth_state.clone(), pool.clone(), keystore);

        engine.login("adminuser", &Zeroizing::new("Password123!".to_string())).await.unwrap();

        {
            let mut s = auth_state.session.write().await;
            if let Some(ref mut session) = *s {
                session.locked = true;
            }
        }

        let unlock_res = engine.unlock_pin("654321").await;
        assert!(unlock_res.is_err(), "Wrong PIN should not unlock session");

        let s = auth_state.session.read().await;
        assert!(s.as_ref().unwrap().locked);
    }
}
