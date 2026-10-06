use sqlx::SqlitePool;
use std::sync::Arc;
use zeroize::Zeroizing;

use crate::auth::error::AuthError;
use crate::auth::session::{AuthState, Session, StepUpGrant};
use crate::models::audit::AuditLogEntry;
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

        // Check idle lock against business configuration
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

        // Re-read user.active and permission_grant FROM THE DB EVERY CALL
        let user = UserRepository::get_by_id(&self.pool, &session.user_id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or(AuthError::SessionRequired)?;

        if user.active == 0 {
            *session_guard = None;
            return Err(AuthError::Forbidden);
        }

        // SUDO passes all permissions
        if user.role == "sudo" {
            return Ok(AuthContext {
                user_id: user.id,
                workspace_id: user.workspace_id,
                branch_id: user.branch_id,
            });
        }

        // Check permission grant or role preset mapping
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

    pub async fn login(&self, username: &str, password: &Zeroizing<String>) -> Result<(), AuthError> {
        let norm_username = policy::validate_username(username)
            .map_err(|_| AuthError::InvalidCredentials { retry_after_secs: None })?;

        let user_opt = UserRepository::get_by_username(&self.pool, &norm_username)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let now = self.state.clock.now_secs();
        let now_iso = self.state.clock.now_iso();

        // Always run an Argon2 verify (dummy hash when unknown to equalize timing)
        let dummy_hash = "$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXlzYWx0Zm9yZHVtbXloYXNo$dummyhashvalueforcel";

        let (user, cred) = match user_opt {
            Some(u) => {
                let c = CredentialRepository::get_by_user_id(&self.pool, &u.id)
                    .await
                    .map_err(|e| AuthError::DatabaseError(e.to_string()))?
                    .ok_or_else(|| AuthError::InvalidCredentials { retry_after_secs: None })?;
                (Some(u), Some(c))
            }
            None => {
                let _ = hashing::verify_password(password.as_str(), dummy_hash);
                (None, None)
            }
        };

        let mut tx = self.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        if let (Some(u), Some(c)) = (&user, &cred) {
            // Check lockout
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
                    action: "password_change".to_string(),
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

            // Success resets counters and updates last_login
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
                action: "password_change".to_string(),
                performed_by_user_id: Some(u.id.clone()),
                target_entity_type: "AppUser".to_string(),
                target_entity_id: u.id.clone(),
                metadata: Some(serde_json::json!({ "reason": "login_success" }).to_string()),
                created_at: now_iso.clone(),
            };
            audit::append(&mut tx, &audit).await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
            tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

            // Set session
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

        // Unknown username case
        let audit = AuditLogEntry {
            id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
            workspace_id: "ws_010101".to_string(),
            branch_id: "br_010101".to_string(),
            action: "password_change".to_string(),
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

        let now_iso = self.state.clock.now_iso();
        let mut tx = self.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let valid = hashing::verify_pin(&user_id, pin, self.keystore.pin_pepper(), &cred.pin_hash);
        if !valid {
            let new_fails = cred.failed_pin_attempts + 1;
            if new_fails >= 5 {
                let mut session_guard = self.state.session.write().await;
                *session_guard = None;
                return Err(AuthError::InvalidCredentials { retry_after_secs: None });
            }
            CredentialRepository::increment_pin_failures(&mut tx, &user_id, new_fails, &now_iso)
                .await
                .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
            tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
            return Err(AuthError::InvalidCredentials { retry_after_secs: None });
        }

        CredentialRepository::reset_pin_failures(&mut tx, &user_id, &now_iso)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let mut session_guard = self.state.session.write().await;
        if let Some(s) = session_guard.as_mut() {
            s.locked = false;
            s.last_activity = self.state.clock.now_secs();
        }

        Ok(())
    }

    pub async fn step_up(&self, permission: &str, pin: &str) -> Result<String, AuthError> {
        let session_guard = self.state.session.read().await;
        let session = session_guard.as_ref().ok_or(AuthError::SessionRequired)?;
        let user_id = session.user_id.clone();
        drop(session_guard);

        let cred = CredentialRepository::get_by_user_id(&self.pool, &user_id)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?
            .ok_or(AuthError::SessionRequired)?;

        let now_iso = self.state.clock.now_iso();
        let mut tx = self.pool.begin().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let valid = hashing::verify_pin(&user_id, pin, self.keystore.pin_pepper(), &cred.pin_hash);
        if !valid {
            let new_fails = cred.failed_pin_attempts + 1;
            if new_fails >= 5 {
                let mut session_guard = self.state.session.write().await;
                *session_guard = None;
                return Err(AuthError::InvalidCredentials { retry_after_secs: None });
            }
            CredentialRepository::increment_pin_failures(&mut tx, &user_id, new_fails, &now_iso)
                .await
                .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
            tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;
            return Err(AuthError::InvalidCredentials { retry_after_secs: None });
        }

        CredentialRepository::reset_pin_failures(&mut tx, &user_id, &now_iso)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
        tx.commit().await.map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let token = format!("stepup_{}", uuid::Uuid::new_v4());
        let expires_at = self.state.clock.now_secs() + 60;

        let mut step_ups = self.state.step_ups.write().await;
        step_ups.insert(token.clone(), StepUpGrant {
            user_id,
            permission: permission.to_string(),
            expires_at,
        });

        Ok(token)
    }

    pub async fn consume_step_up(&self, user_id: &str, permission: &str, token: &str) -> Result<(), AuthError> {
        let mut step_ups = self.state.step_ups.write().await;
        let grant = step_ups.remove(token).ok_or(AuthError::StepUpRequired)?;

        if grant.user_id != user_id || grant.permission != permission || grant.expires_at < self.state.clock.now_secs() {
            return Err(AuthError::StepUpRequired);
        }

        Ok(())
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

        // Seed business and user
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
        let pin_hash = hashing::hash_pin("user_s", "123456", &[42u8; 32]).unwrap();

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

        // Grant permission
        let mut tx = pool.begin().await.unwrap();
        UserRepository::set_permission_grants(&mut tx, "user_s", "ws_1", "br_1", &["inventory:adjust".to_string()], "user_s").await.unwrap();
        tx.commit().await.unwrap();

        let auth_state = Arc::new(AuthState::new(Arc::new(RealClock)));
        let keystore = Arc::new(Keystore::init().unwrap());
        let engine = AuthEngine::new(auth_state.clone(), pool.clone(), keystore);

        // Login success
        let res = engine.login("adminuser", &Zeroizing::new("Password123!".to_string())).await;
        assert!(res.is_ok());

        // Require permission success
        let ctx = engine.require("inventory:adjust").await;
        assert!(ctx.is_ok());
        assert_eq!(ctx.unwrap().user_id, "user_s");
    }
}

