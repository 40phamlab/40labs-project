use crate::activation::RegisterRequest;
use crate::auth::{AuthError, AuthErrorResponse};
use crate::db::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistrationErrorResponse {
    code: &'static str,
    stage: &'static str,
    retryable: bool,
}

impl From<AuthErrorResponse> for RegistrationErrorResponse {
    fn from(error: AuthErrorResponse) -> Self {
        let code = match error.code {
            crate::auth::AuthErrorCode::PolicyViolation => "INVALID_REGISTRATION_DATA",
            crate::auth::AuthErrorCode::NetworkRequired => "API_UNAVAILABLE",
            crate::auth::AuthErrorCode::InvalidCredentials => "INVALID_VERIFICATION",
            _ => "REGISTRATION_FAILED",
        };
        Self {
            code,
            stage: "validation",
            retryable: false,
        }
    }
}

fn registration_error(
    code: &'static str,
    stage: &'static str,
    retryable: bool,
) -> RegistrationErrorResponse {
    RegistrationErrorResponse {
        code,
        stage,
        retryable,
    }
}

fn registration_db_error(stage: &'static str, error: sqlx::Error) -> RegistrationErrorResponse {
    let (kind, code, retryable) = match &error {
        _ if stage == "local_commit" => ("database_commit", "TRANSACTION_FAILURE", true),
        sqlx::Error::Database(_) => ("constraint_or_schema", "DATABASE_CONSTRAINT_FAILURE", false),
        sqlx::Error::RowNotFound => ("missing_row", "DATABASE_CONSTRAINT_FAILURE", false),
        sqlx::Error::PoolTimedOut | sqlx::Error::PoolClosed => {
            ("database_unavailable", "TRANSACTION_FAILURE", true)
        }
        _ if stage == "local_commit" => ("database_operation", "TRANSACTION_FAILURE", true),
        _ => ("database_operation", "TRANSACTION_FAILURE", true),
    };
    tracing::error!(stage, kind, error = %error, "Registration database operation failed");
    crate::debug::registration_event(stage, kind, None);
    registration_error(code, stage, retryable)
}

struct RegistrationRun {
    started: std::time::Instant,
    completed: bool,
}

impl RegistrationRun {
    fn new() -> Self {
        Self {
            started: std::time::Instant::now(),
            completed: false,
        }
    }

    fn complete(&mut self) {
        self.completed = true;
    }
}

impl Drop for RegistrationRun {
    fn drop(&mut self) {
        if !self.completed {
            crate::debug::registration_event(
                "registration_commit",
                "failed_or_cancelled",
                Some(self.started.elapsed().as_millis()),
            );
        }
    }
}

#[tauri::command]
pub fn registration_diagnostic(stage: String, outcome: String) {
    let stage = match stage.as_str() {
        "terms_hash" => "terms_hash",
        _ => return,
    };
    let outcome = match outcome.as_str() {
        "started" => "started",
        "succeeded" => "succeeded",
        "failed" => "failed",
        _ => return,
    };
    crate::debug::registration_event(stage, outcome, None);
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistrationResult {
    business_id: String,
    workspace_id: String,
    branch_id: String,
    recovery_codes: Vec<String>,
}

fn normalize_tz_phone(input: &str) -> Result<String, AuthErrorResponse> {
    let digits: String = input.chars().filter(char::is_ascii_digit).collect();
    let normalized = if digits.starts_with("255") && digits.len() == 12 {
        digits
    } else if digits.starts_with('0') && digits.len() == 10 {
        format!("255{}", &digits[1..])
    } else if digits.len() == 9 {
        format!("255{digits}")
    } else {
        return Err(
            AuthError::PolicyViolation("Invalid Tanzanian phone number".into()).to_response(),
        );
    };
    if normalized
        .as_bytes()
        .get(3)
        .is_some_and(|prefix| matches!(prefix, b'6' | b'7'))
    {
        Ok(normalized)
    } else {
        Err(AuthError::PolicyViolation("Invalid Tanzanian phone number".into()).to_response())
    }
}

#[tauri::command]
pub async fn otp_request(
    state: State<'_, AppState>,
    phone: String,
) -> Result<i64, AuthErrorResponse> {
    crate::debug::registration_event("otp_request", "started", None);
    let started = std::time::Instant::now();
    let phone = normalize_tz_phone(&phone)?;
    let result = state.otp_client.request_otp(&phone).await.map_err(|e| {
        tracing::error!(error = %e, "Registration OTP request failed");
        crate::debug::registration_event(
            "otp_request",
            "failed",
            Some(started.elapsed().as_millis()),
        );
        AuthError::InternalError(e).to_response()
    })?;
    crate::debug::registration_event(
        "otp_request",
        "succeeded",
        Some(started.elapsed().as_millis()),
    );
    Ok(result)
}

#[tauri::command]
pub async fn otp_verify(
    state: State<'_, AppState>,
    phone: String,
    code: String,
) -> Result<String, AuthErrorResponse> {
    crate::debug::registration_event("otp_verify", "started", None);
    let started = std::time::Instant::now();
    let phone = normalize_tz_phone(&phone)?;
    if code.len() != 6 || !code.bytes().all(|byte| byte.is_ascii_digit()) {
        return Err(AuthError::PolicyViolation("OTP must be 6 digits".into()).to_response());
    }
    let result = state
        .otp_client
        .verify_otp(&phone, &code)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "Registration OTP verification failed");
            crate::debug::registration_event(
                "otp_verify",
                "failed",
                Some(started.elapsed().as_millis()),
            );
            AuthError::InternalError(e).to_response()
        })?;
    crate::debug::registration_event(
        "otp_verify",
        "succeeded",
        Some(started.elapsed().as_millis()),
    );
    Ok(result)
}

#[tauri::command]
pub async fn registration_commit(
    state: State<'_, AppState>,
    payload: serde_json::Value,
) -> Result<RegistrationResult, RegistrationErrorResponse> {
    registration_commit_inner(&state, payload).await
}

async fn registration_commit_inner(
    state: &AppState,
    payload: serde_json::Value,
) -> Result<RegistrationResult, RegistrationErrorResponse> {
    crate::debug::registration_event("registration_commit", "started", None);
    let mut registration_run = RegistrationRun::new();
    let registration_started = std::time::Instant::now();
    crate::debug::registration_event("registration_validation", "started", None);
    let verification_token = payload
        .get("verification_token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            AuthError::PolicyViolation("Missing verification_token".into()).to_response()
        })?;
    let business_name = payload
        .get("business_name")
        .and_then(|v| v.as_str())
        .filter(|s| !s.trim().is_empty())
        .ok_or_else(|| {
            AuthError::PolicyViolation("Business name is required".into()).to_response()
        })?;
    let owner_first_name = payload
        .get("owner_first_name")
        .and_then(|v| v.as_str())
        .filter(|s| !s.trim().is_empty())
        .ok_or_else(|| {
            AuthError::PolicyViolation("Owner first name is required".into()).to_response()
        })?;
    let owner_last_name = payload
        .get("owner_last_name")
        .and_then(|v| v.as_str())
        .filter(|s| !s.trim().is_empty())
        .ok_or_else(|| {
            AuthError::PolicyViolation("Owner last name is required".into()).to_response()
        })?;
    let owner_email = payload
        .get("owner_email")
        .and_then(|v| v.as_str())
        .map(String::from);
    let terms_accepted = payload
        .get("terms_accepted")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let terms_version = payload
        .get("terms_version")
        .and_then(|v| v.as_str())
        .unwrap_or("v1.0");
    let terms_locale = payload
        .get("terms_locale")
        .and_then(|v| v.as_str())
        .unwrap_or("en");
    let terms_text_sha256 = payload
        .get("terms_text_sha256")
        .and_then(|v| v.as_str())
        .unwrap_or("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    let owner_phone = normalize_tz_phone(
        payload
            .get("owner_phone")
            .and_then(|v| v.as_str())
            .unwrap_or(""),
    )?;
    let business_phone = match payload
        .get("business_phone")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        Some(phone) => normalize_tz_phone(phone)?,
        None => owner_phone.clone(),
    };
    let business_email = payload
        .get("business_email")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from);
    let business_type = payload
        .get("business_type")
        .and_then(|v| v.as_str())
        .unwrap_or("Pharmacy");
    let role_scopes: Vec<&str> = match payload
        .get("role_scopes")
        .and_then(|v| v.as_str())
        .unwrap_or("pharmacy")
    {
        "lab" => vec!["lab"],
        "both" => vec!["pharmacy", "lab"],
        _ => vec!["pharmacy"],
    };
    let role_scopes_json = serde_json::to_string(&role_scopes)
        .map_err(|e| AuthError::InternalError(e.to_string()).to_response())?;
    let scale = payload
        .get("scale")
        .and_then(|v| v.as_str())
        .unwrap_or("medium");
    let region = payload.get("region").and_then(|v| v.as_str()).unwrap_or("");
    let district = payload
        .get("district")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let mtaa = payload.get("mtaa").and_then(|v| v.as_str()).unwrap_or("");
    let kata = payload.get("kata").and_then(|v| v.as_str()).unwrap_or("");
    let latitude = payload.get("latitude").and_then(|v| v.as_f64());
    let longitude = payload.get("longitude").and_then(|v| v.as_f64());
    let lipa_namba = payload
        .get("lipa_namba")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let payment_number = payload
        .get("payment_number")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let logo_url = payload
        .get("logo_url")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .or_else(|| {
            payload
                .get("logo_data_url")
                .and_then(|v| v.as_str())
                .filter(|s| !s.is_empty())
        });
    let declared_branch_count = match payload.get("declared_branch_count") {
        Some(value) if !value.is_null() => {
            let count = value
                .as_i64()
                .or_else(|| value.as_str().and_then(|s| s.parse::<i64>().ok()))
                .ok_or_else(|| {
                    AuthError::PolicyViolation("Invalid branch count".into()).to_response()
                })?;
            if count < 1 {
                return Err(
                    AuthError::PolicyViolation("Branch count must be at least 1".into())
                        .to_response()
                        .into(),
                );
            }
            Some(count)
        }
        _ => Some(1),
    };
    let username = payload
        .get("username")
        .and_then(|v| v.as_str())
        .filter(|s| {
            regex::Regex::new(r"^[a-z0-9._-]{3,32}$")
                .unwrap()
                .is_match(s)
        })
        .ok_or_else(|| AuthError::PolicyViolation("Invalid username".into()).to_response())?;
    let password = payload
        .get("password")
        .and_then(|v| v.as_str())
        .filter(|s| s.len() >= 12 && s.len() <= 128)
        .ok_or_else(|| {
            AuthError::PolicyViolation("Password must be between 12 and 128 bytes".into())
                .to_response()
        })?;
    if !terms_accepted {
        return Err(AuthError::PolicyViolation("Terms must be accepted".into())
            .to_response()
            .into());
    }
    crate::debug::registration_event(
        "registration_validation",
        "succeeded",
        Some(registration_started.elapsed().as_millis()),
    );

    let reg_req = RegisterRequest {
        verification_token: verification_token.to_string(),
        owner_phone: owner_phone.clone(),
        business_name: business_name.to_string(),
        owner_first_name: owner_first_name.to_string(),
        owner_last_name: owner_last_name.to_string(),
        owner_email,
        terms_accepted,
        terms_version: terms_version.to_string(),
        terms_locale: terms_locale.to_string(),
        terms_text_sha256: terms_text_sha256.to_string(),
    };

    crate::debug::registration_event("activation_register", "started", None);
    let stage_started = std::time::Instant::now();
    let reg_resp = state
        .activation_client
        .register(reg_req)
        .await
        .map_err(|e| {
            let code = if let Some(code) = e.strip_prefix("REGISTRATION_CODE:") {
                match code {
                    "INVALID_VERIFICATION" => "INVALID_VERIFICATION",
                    "INVALID_REGISTRATION_DATA" => "INVALID_REGISTRATION_DATA",
                    "ACTIVATION_REJECTED" => "ACTIVATION_REJECTED",
                    "API_UNAVAILABLE" => "API_UNAVAILABLE",
                    _ => "ACTIVATION_REJECTED",
                }
            } else if e.contains("failed (") {
                "ACTIVATION_REJECTED"
            } else {
                "API_UNAVAILABLE"
            };
            tracing::warn!(code, "Activation service registration failed");
            crate::debug::registration_event(
                "activation_register",
                "failed",
                Some(stage_started.elapsed().as_millis()),
            );
            registration_error(code, "activation_register", code == "API_UNAVAILABLE")
        })?;
    crate::debug::registration_event(
        "activation_register",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );

    let already_registered: Option<(String, String)> =
        sqlx::query_as("SELECT workspace_id, branch_id FROM business WHERE business_id = ?")
            .bind(&reg_resp.business_id)
            .fetch_optional(&state.pool)
            .await
            .map_err(|e| registration_db_error("registration_preflight", e))?;
    if let Some((workspace_id, branch_id)) = already_registered {
        if workspace_id == reg_resp.workspace_id && branch_id == reg_resp.branch_id {
            return Err(registration_error(
                "REGISTRATION_ALREADY_COMPLETED",
                "registration_preflight",
                false,
            ));
        }
        return Err(registration_error(
            "DATABASE_CONSTRAINT_FAILURE",
            "registration_preflight",
            false,
        ));
    }

    // Cloud credentials are installed only after the server-issued activation
    // grant has been validated by the HTTP activation client. Local database
    // workflows remain usable offline after this one-time enrollment step.
    crate::debug::registration_event("cloud_device_id", "started", None);
    let stage_started = std::time::Instant::now();
    let cloud_device_id = state
        .registration_keychain
        .cloud_device_id()
        .map_err(|e| {
            tracing::error!(error = %e, "Registration cloud device ID lookup failed");
            crate::debug::registration_event(
                "cloud_device_id",
                "failed",
                Some(stage_started.elapsed().as_millis()),
            );
            registration_error("SECURE_STORAGE_FAILURE", "cloud_device_id", true)
        })?;
    crate::debug::registration_event(
        "cloud_device_id",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );
    crate::debug::registration_event("device_enrollment", "started", None);
    let stage_started = std::time::Instant::now();
    let cloud_credentials = state
        .activation_client
        .enroll_device(&reg_resp.activation_grant, &cloud_device_id)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "Registration device enrollment failed");
            let (mapped_code, retryable, status) = if let Some(stripped) = e.strip_prefix("ENROLLMENT_CODE:") {
                let parts: Vec<&str> = stripped.splitn(3, ':').collect();
                let code = parts.first().copied().unwrap_or("DEVICE_ENROLLMENT_FAILURE");
                let status = parts.get(1).and_then(|v| v.parse::<u16>().ok()).unwrap_or(0);
                let (mc, rt) = match code {
                    "DEVICE_SCOPE_CONFLICT" => ("DEVICE_SCOPE_CONFLICT", false),
                    "DEVICE_REVOKED" => ("DEVICE_REVOKED", false),
                    "DEVICE_SYNC_RECORD_CONFLICT" => ("DEVICE_SYNC_RECORD_CONFLICT", false),
                    "ACTIVATION_REJECTED" => ("ACTIVATION_REJECTED", false),
                    "API_UNAVAILABLE" => ("API_UNAVAILABLE", true),
                    _ => {
                        if status == 409 {
                            ("DEVICE_ENROLLMENT_FAILURE", false)
                        } else if status >= 500 || status == 429 {
                            ("API_UNAVAILABLE", true)
                        } else {
                            ("DEVICE_ENROLLMENT_FAILURE", true)
                        }
                    }
                };
                (mc, rt, status)
            } else {
                ("DEVICE_ENROLLMENT_FAILURE", true, 0)
            };

            crate::debug::registration_failure_event(
                "device_enrollment",
                mapped_code,
                status,
                &cloud_device_id,
                Some(stage_started.elapsed().as_millis()),
            );
            registration_error(mapped_code, "device_enrollment", retryable)
        })?;
    crate::debug::registration_event(
        "device_enrollment",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );
    crate::debug::registration_event("credential_storage", "started", None);
    let stage_started = std::time::Instant::now();
    state
        .registration_keychain
        .store_cloud_device_credentials(&cloud_credentials)
        .map_err(|e| {
            tracing::error!(error = %e, "Registration cloud credential storage failed");
            crate::debug::registration_event(
                "credential_storage",
                "failed",
                Some(stage_started.elapsed().as_millis()),
            );
            registration_error("SECURE_STORAGE_FAILURE", "credential_storage", true)
        })?;
    crate::debug::registration_event(
        "credential_storage",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );

    let now = chrono::Utc::now().to_rfc3339();
    crate::debug::registration_event("local_transaction", "started", None);
    let stage_started = std::time::Instant::now();
    let mut tx = state
        .pool
        .begin()
        .await
        .map_err(|e| registration_db_error("local_transaction", e))?;
    crate::debug::registration_event(
        "local_transaction",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );

    let owner_id = format!("owner_{}", uuid::Uuid::new_v4().simple());
    let user_id = format!("user_sudo_{}", uuid::Uuid::new_v4().simple());
    let local_device_public_key = hex::encode(state.keystore.verifying_key().to_bytes());
    crate::debug::registration_event("password_hash", "started", None);
    let stage_started = std::time::Instant::now();
    let pwd_hash = crate::security::hashing::hash_password(password).map_err(|e| {
        tracing::error!("Registration password hashing failed");
        crate::debug::registration_event(
            "password_hash",
            "failed",
            Some(stage_started.elapsed().as_millis()),
        );
        AuthError::InternalError(e.to_string()).to_response()
    })?;
    crate::debug::registration_event(
        "password_hash",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );
    let full_name = format!("{} {}", owner_first_name, owner_last_name);

    crate::debug::registration_event("owner_insert", "started", None);
    let stage_started = std::time::Instant::now();
    sqlx::query(
        r#"
        INSERT INTO owner (id, workspace_id, branch_id, first_name, last_name, phone, phone_verified_at, email, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&owner_id)
    .bind(&reg_resp.workspace_id)
    .bind(&reg_resp.branch_id)
    .bind(owner_first_name)
    .bind(owner_last_name)
    .bind(&owner_phone)
    .bind(&now)
    .bind(payload.get("owner_email").and_then(|v| v.as_str()).map(str::trim).filter(|s| !s.is_empty()))
    .bind(&now)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|e| registration_db_error("owner_insert", e))?;
    crate::debug::registration_event(
        "owner_insert",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );

    crate::debug::registration_event("user_insert", "started", None);
    let stage_started = std::time::Instant::now();
    sqlx::query(
        r#"
        INSERT INTO app_user (id, workspace_id, branch_id, username, first_name, last_name, full_name, phone, role, role_preset, active, owner_id, must_change_credentials, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sudo', 'sudo', 1, ?, 0, ?, ?)
        "#,
    )
    .bind(&user_id)
    .bind(&reg_resp.workspace_id)
    .bind(&reg_resp.branch_id)
    .bind(username)
    .bind(owner_first_name)
    .bind(owner_last_name)
    .bind(&full_name)
    .bind(&owner_phone)
    .bind(&owner_id)
    .bind(&now)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|e| registration_db_error("user_insert", e))?;
    crate::debug::registration_event(
        "user_insert",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );

    crate::debug::registration_event("business_insert", "started", None);
    let stage_started = std::time::Instant::now();
    sqlx::query(
        r#"
        INSERT INTO business (
            id, workspace_id, branch_id, business_id, name, role_scopes, tier,
            contact_mobile, contact_email, address_region, address_district, address_place,
            logo_url, owner_id, onboarding_state, business_type, country, address_ward,
            address_street, address_area, latitude, longitude, lipa_namba, payment_number,
            declared_branch_count, terms_version, terms_locale, terms_text_sha256,
            terms_accepted_at, terms_accepted_by_user_id, scale, idle_lock_minutes, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'free', ?, ?, ?, ?, ?, ?, ?, 'owner_first_login', ?, 'TZ', ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5, ?, ?)
        "#,
    )
    .bind(format!("biz_{}", uuid::Uuid::new_v4().simple()))
    .bind(&reg_resp.workspace_id)
    .bind(&reg_resp.branch_id)
    .bind(&reg_resp.business_id)
    .bind(business_name)
    .bind(&role_scopes_json)
    .bind(&business_phone)
    .bind(business_email.as_deref().or_else(|| payload.get("owner_email").and_then(|v| v.as_str())))
    .bind(if region.is_empty() { None } else { Some(region) })
    .bind(if district.is_empty() { None } else { Some(district) })
    .bind(if !mtaa.is_empty() { Some(mtaa) } else if !kata.is_empty() { Some(kata) } else { None })
    .bind(logo_url)
    .bind(&owner_id)
    .bind(business_type)
    .bind(if kata.is_empty() { None } else { Some(kata) })
    .bind(if mtaa.is_empty() { None } else { Some(mtaa) })
    .bind(latitude)
    .bind(longitude)
    .bind(lipa_namba)
    .bind(payment_number)
    .bind(declared_branch_count)
    .bind(terms_version)
    .bind(terms_locale)
    .bind(terms_text_sha256)
    .bind(&now)
    .bind(&user_id)
    .bind(scale)
    .bind(&now)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|e| registration_db_error("business_insert", e))?;
    crate::debug::registration_event(
        "business_insert",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );

    let cred = crate::models::auth::UserCredential {
        user_id: user_id.clone(),
        workspace_id: reg_resp.workspace_id.clone(),
        branch_id: reg_resp.branch_id.clone(),
        password_hash: pwd_hash,
        pin_hash: None,
        failed_password_attempts: 0,
        failed_pin_attempts: 0,
        locked_until: None,
        password_changed_at: Some(now.clone()),
        pin_changed_at: None,
        created_at: now.clone(),
        updated_at: now.clone(),
    };
    crate::debug::registration_event("user_credential_insert", "started", None);
    let stage_started = std::time::Instant::now();
    crate::repositories::credential_repo::CredentialRepository::create(&mut tx, &cred)
        .await
        .map_err(|e| registration_db_error("user_credential_insert", e))?;
    crate::debug::registration_event(
        "user_credential_insert",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );

    use rand::{thread_rng, Rng};
    const RECOVERY_ALPHABET: &[u8] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    let recovery_batch_id = format!("batch_{}", uuid::Uuid::new_v4().simple());
    let mut recovery_codes = Vec::with_capacity(8);
    crate::debug::registration_event("recovery_codes_insert", "started", None);
    let stage_started = std::time::Instant::now();
    for _ in 0..8 {
        let raw: String = {
            let mut rng = thread_rng();
            (0..10)
                .map(|_| RECOVERY_ALPHABET[rng.gen_range(0..RECOVERY_ALPHABET.len())] as char)
                .collect()
        };
        let code = format!("{}-{}", &raw[..5], &raw[5..]);
        let code_hash = crate::security::hashing::hash_recovery_code(&code).map_err(|e| {
            tracing::error!("Registration recovery code hashing failed");
            crate::debug::registration_event(
                "recovery_codes_insert",
                "failed_hashing",
                Some(stage_started.elapsed().as_millis()),
            );
            AuthError::InternalError(e.to_string()).to_response()
        })?;
        crate::repositories::recovery_repo::RecoveryRepository::create(
            &mut tx,
            &crate::models::auth::RecoveryCode {
                id: format!("rec_{}", uuid::Uuid::new_v4().simple()),
                workspace_id: reg_resp.workspace_id.clone(),
                branch_id: reg_resp.branch_id.clone(),
                user_id: user_id.clone(),
                batch_id: recovery_batch_id.clone(),
                code_hash,
                used_at: None,
                invalidated_at: None,
                created_at: now.clone(),
            },
        )
        .await
        .map_err(|e| registration_db_error("recovery_codes_insert", e))?;
        recovery_codes.push(code);
    }
    crate::debug::registration_event(
        "recovery_codes_insert",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );

    crate::debug::registration_event("bound_device_insert", "started", None);
    let stage_started = std::time::Instant::now();
    sqlx::query(
        r#"
        INSERT INTO bound_device (id, workspace_id, branch_id, device_label, public_key, bound_by_user_id, status, created_at, updated_at)
        VALUES (?, ?, ?, 'Local Desktop POS', ?, ?, 'active', ?, ?)
        "#,
    )
    .bind(&cloud_device_id)
    .bind(&reg_resp.workspace_id)
    .bind(&reg_resp.branch_id)
    .bind(&local_device_public_key)
    .bind(&user_id)
    .bind(&now)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|e| registration_db_error("bound_device_insert", e))?;
    crate::debug::registration_event(
        "bound_device_insert",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );

    crate::debug::registration_event("branch_insert", "started", None);
    let stage_started = std::time::Instant::now();
    sqlx::query(
        r#"
        INSERT INTO branch (id, workspace_id, branch_id, business_id, name, location, branch_code, status, contacts, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'Main Branch', ?, 'MAIN', 'active', ?, ?, ?)
        "#,
    )
    .bind(&reg_resp.branch_id)
    .bind(&reg_resp.workspace_id)
    .bind(&reg_resp.branch_id)
    .bind(&reg_resp.business_id)
    .bind(if region.is_empty() { None } else { Some(region) })
    .bind(&business_phone)
    .bind(&now)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|e| registration_db_error("branch_insert", e))?;
    crate::debug::registration_event(
        "branch_insert",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );

    let registration_result = RegistrationResult {
        business_id: reg_resp.business_id,
        workspace_id: reg_resp.workspace_id,
        branch_id: reg_resp.branch_id,
        recovery_codes,
    };
    let pending_result = serde_json::to_string(&registration_result)
        .map_err(|_| registration_error("SECURE_STORAGE_FAILURE", "recovery_result_store", true))?;
    state
        .registration_keychain
        .store_pending_registration_result(&pending_result)
        .map_err(|_| {
            crate::debug::registration_event("recovery_result_store", "failed", None);
            registration_error("SECURE_STORAGE_FAILURE", "recovery_result_store", true)
        })?;

    crate::debug::registration_event("local_commit", "started", None);
    let stage_started = std::time::Instant::now();
    if let Err(error) = tx.commit().await {
        let _ = state
            .registration_keychain
            .clear_pending_registration_result();
        return Err(registration_db_error("local_commit", error));
    }
    crate::debug::registration_event(
        "local_commit",
        "succeeded",
        Some(stage_started.elapsed().as_millis()),
    );
    crate::debug::registration_event(
        "registration_commit",
        "succeeded",
        Some(registration_started.elapsed().as_millis()),
    );
    registration_run.complete();
    Ok(registration_result)
}

#[tauri::command]
pub async fn registration_resume_result(
    state: State<'_, AppState>,
) -> Result<Option<RegistrationResult>, RegistrationErrorResponse> {
    registration_resume_result_inner(&state).await
}

async fn registration_resume_result_inner(
    state: &AppState,
) -> Result<Option<RegistrationResult>, RegistrationErrorResponse> {
    let Some(encoded) = state
        .registration_keychain
        .load_pending_registration_result()
        .map_err(|_| registration_error("SECURE_STORAGE_FAILURE", "recovery_result_load", true))?
    else {
        return Ok(None);
    };
    let result: RegistrationResult = serde_json::from_str(&encoded)
        .map_err(|_| registration_error("SECURE_STORAGE_FAILURE", "recovery_result_load", false))?;
    let complete: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM business b
           JOIN bound_device d ON d.workspace_id=b.workspace_id AND d.branch_id=b.branch_id AND d.status='active'
           JOIN branch br ON br.workspace_id=b.workspace_id AND br.branch_id=b.branch_id AND br.business_id=b.business_id
           WHERE b.business_id=? AND b.workspace_id=? AND b.branch_id=?"#,
    )
    .bind(&result.business_id)
    .bind(&result.workspace_id)
    .bind(&result.branch_id)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| registration_db_error("recovery_result_validate", e))?;
    if complete.0 != 1 {
        return Ok(None);
    }
    Ok(Some(result))
}

#[tauri::command]
pub async fn registration_result_ack(
    state: State<'_, AppState>,
) -> Result<(), RegistrationErrorResponse> {
    registration_result_ack_inner(&state)
}

fn registration_result_ack_inner(state: &AppState) -> Result<(), RegistrationErrorResponse> {
    state
        .registration_keychain
        .clear_pending_registration_result()
        .map_err(|_| registration_error("SECURE_STORAGE_FAILURE", "recovery_result_ack", true))
}

#[tauri::command]
pub async fn cloud_device_credentials_refresh(
    state: State<'_, AppState>,
) -> Result<(), AuthErrorResponse> {
    let stored: crate::activation::DeviceCredentials =
        crate::security::keystore::Keystore::load_cloud_credentials()
            .map_err(|e| AuthError::InternalError(e.to_string()).to_response())?;
    let rotated = state
        .activation_client
        .refresh_device_credentials(&stored.device_id, &stored.refresh_token)
        .await
        .map_err(|e| AuthError::InternalError(e).to_response())?;
    crate::security::keystore::Keystore::store_cloud_credentials(&rotated)
        .map_err(|e| AuthError::InternalError(e.to_string()).to_response())
}

#[cfg(test)]
mod tests {
    use super::{
        normalize_tz_phone, registration_commit_inner, registration_result_ack_inner,
        registration_resume_result_inner,
    };
    use crate::{
        activation::{
            ActivationClient, DeviceCredentials, OtpClient, RegisterRequest, RegisterResponse,
        },
        auth::{AuthEngine, AuthState, RealClock},
        db::AppState,
        security::keystore::{Keystore, KeystoreError, RegistrationKeychain},
        services::lan::LanServerState,
    };
    use async_trait::async_trait;
    use std::sync::Arc;
    use zeroize::Zeroizing;

    struct MockActivation {
        register_error: Option<String>,
        enroll_fails: bool,
    }

    #[async_trait]
    impl OtpClient for MockActivation {
        async fn request_otp(&self, _phone: &str) -> Result<i64, String> {
            Ok(300)
        }
        async fn verify_otp(&self, _phone: &str, _code: &str) -> Result<String, String> {
            Ok("verified-test-token".into())
        }
    }

    #[async_trait]
    impl ActivationClient for MockActivation {
        async fn register(&self, _req: RegisterRequest) -> Result<RegisterResponse, String> {
            if let Some(error) = &self.register_error {
                return Err(error.clone());
            }
            Ok(RegisterResponse {
                business_id: "AFYA-TEST01".into(),
                workspace_id: "ws-registration-test".into(),
                branch_id: "branch-registration-test".into(),
                activation_grant: "mock-grant".into(),
            })
        }
        async fn enroll_device(
            &self,
            _grant: &str,
            device_id: &str,
        ) -> Result<DeviceCredentials, String> {
            if self.enroll_fails {
                return Err("upstream unavailable".into());
            }
            Ok(DeviceCredentials {
                device_id: device_id.into(),
                access_token: "mock-access".into(),
                refresh_token: "mock-refresh".into(),
                token_type: "Bearer".into(),
                expires_in: 900,
                refresh_expires_at: "2030-01-01T00:00:00Z".into(),
            })
        }
        async fn refresh_device_credentials(
            &self,
            _id: &str,
            _token: &str,
        ) -> Result<DeviceCredentials, String> {
            Err("not used".into())
        }
    }

    struct MockKeychain {
        fail_id: bool,
        fail_store: bool,
        fail_pending_store: bool,
        pending: std::sync::Mutex<Option<String>>,
    }
    impl RegistrationKeychain for MockKeychain {
        fn cloud_device_id(&self) -> Result<String, KeystoreError> {
            if self.fail_id {
                Err(KeystoreError::Unavailable("mock".into()))
            } else {
                Ok("desktop-registration-test".into())
            }
        }
        fn store_cloud_device_credentials(
            &self,
            _credentials: &DeviceCredentials,
        ) -> Result<(), KeystoreError> {
            if self.fail_store {
                Err(KeystoreError::Unavailable("mock".into()))
            } else {
                Ok(())
            }
        }
        fn store_pending_registration_result(&self, value: &str) -> Result<(), KeystoreError> {
            if self.fail_pending_store {
                return Err(KeystoreError::Unavailable("mock".into()));
            }
            *self.pending.lock().unwrap() = Some(value.to_owned());
            Ok(())
        }
        fn load_pending_registration_result(&self) -> Result<Option<String>, KeystoreError> {
            Ok(self.pending.lock().unwrap().clone())
        }
        fn clear_pending_registration_result(&self) -> Result<(), KeystoreError> {
            *self.pending.lock().unwrap() = None;
            Ok(())
        }
    }

    async fn test_state(
        register_error: Option<&str>,
        enroll_fails: bool,
        fail_id: bool,
        fail_store: bool,
        fail_pending_store: bool,
    ) -> AppState {
        let pool = crate::db::init_db_pool_with_url("sqlite::memory:")
            .await
            .unwrap();
        test_state_with_pool(
            pool,
            register_error,
            enroll_fails,
            fail_id,
            fail_store,
            fail_pending_store,
        )
        .await
    }

    async fn test_state_with_pool(
        pool: sqlx::SqlitePool,
        register_error: Option<&str>,
        enroll_fails: bool,
        fail_id: bool,
        fail_store: bool,
        fail_pending_store: bool,
    ) -> AppState {
        let lan_path =
            std::env::temp_dir().join(format!("registration-test-{}", uuid::Uuid::new_v4()));
        let lan_state = Arc::new(LanServerState::new(pool.clone(), 0, &lan_path).unwrap());
        let mock = Arc::new(MockActivation {
            register_error: register_error.map(str::to_owned),
            enroll_fails,
        });
        let keystore = Arc::new(Keystore::init().unwrap());
        AppState {
            pool,
            lan_state,
            auth_state: Arc::new(AuthState::new(Arc::new(RealClock))),
            keystore,
            registration_keychain: Arc::new(MockKeychain {
                fail_id,
                fail_store,
                fail_pending_store,
                pending: std::sync::Mutex::new(None),
            }),
            otp_client: mock.clone(),
            activation_client: mock,
        }
    }

    fn valid_payload() -> serde_json::Value {
        serde_json::json!({
            "verification_token":"verified-test-token", "owner_phone":"0712345678",
            "business_name":"Afya Test", "owner_first_name":"Asha", "owner_last_name":"Test",
            "owner_email":"asha@example.co.tz", "terms_accepted":true,
            "terms_version":"1.0", "terms_locale":"sw-TZ", "terms_text_sha256":"a".repeat(64),
            "username":"owner.test", "password":"StrongPass123!", "business_phone":"0712345678"
        })
    }

    async fn table_count(pool: &sqlx::SqlitePool, table: &str) -> i64 {
        sqlx::query_scalar(&format!("SELECT COUNT(*) FROM {table}"))
            .fetch_one(pool)
            .await
            .unwrap()
    }

    #[test]
    fn validates_and_normalizes_tanzanian_phone_input() {
        assert_eq!(normalize_tz_phone("0712 345-678").unwrap(), "255712345678");
        assert_eq!(normalize_tz_phone("+255712345678").unwrap(), "255712345678");
        assert!(normalize_tz_phone("+233712345678").is_err());
        assert!(normalize_tz_phone("07123456789").is_err());
    }

    #[tokio::test]
    async fn registration_creates_local_state_and_allows_immediate_sudo_login() {
        let state = test_state(None, false, false, false, false).await;
        let result = registration_commit_inner(&state, valid_payload())
            .await
            .unwrap();
        let json = serde_json::to_value(&result).unwrap();
        assert_eq!(json["businessId"], "AFYA-TEST01");
        assert_eq!(json["recoveryCodes"].as_array().unwrap().len(), 8);
        let resumed = registration_resume_result_inner(&state)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(resumed.business_id, result.business_id);
        assert_eq!(resumed.recovery_codes, result.recovery_codes);
        let status_before_login = crate::commands::auth_cmd::auth_status_inner(&state)
            .await
            .unwrap();
        assert_eq!(status_before_login["deviceBound"], true);
        assert_eq!(
            status_before_login["business"]["business_id"],
            "AFYA-TEST01"
        );
        assert!(status_before_login["session"].is_null());
        for table in [
            "owner",
            "app_user",
            "business",
            "user_credential",
            "recovery_code",
            "bound_device",
            "branch",
        ] {
            assert!(
                table_count(&state.pool, table).await > 0,
                "missing rows in {table}"
            );
        }
        let engine = AuthEngine::new(
            state.auth_state.clone(),
            state.pool.clone(),
            state.keystore.clone(),
        );
        engine
            .login("owner.test", &Zeroizing::new("StrongPass123!".to_string()))
            .await
            .unwrap();
        assert!(state.auth_state.session.read().await.is_some());
        let status_after_login = crate::commands::auth_cmd::auth_status_inner(&state)
            .await
            .unwrap();
        assert_eq!(status_after_login["session"]["role"], "sudo");
        assert_eq!(status_after_login["session"]["hasRecoveryCodes"], true);
        registration_result_ack_inner(&state).unwrap();
        assert!(registration_resume_result_inner(&state)
            .await
            .unwrap()
            .is_none());
    }

    #[tokio::test]
    async fn activation_and_enrollment_failures_leave_no_local_registration() {
        for (register_error, enroll_fails, expected) in [
            (Some("connection refused"), false, "API_UNAVAILABLE"),
            (
                Some("REGISTRATION_CODE:INVALID_VERIFICATION"),
                false,
                "INVALID_VERIFICATION",
            ),
            (None, true, "DEVICE_ENROLLMENT_FAILURE"),
        ] {
            let state = test_state(register_error, enroll_fails, false, false, false).await;
            let error = registration_commit_inner(&state, valid_payload())
                .await
                .unwrap_err();
            assert_eq!(error.code, expected);
            assert_eq!(table_count(&state.pool, "business").await, 0);
            assert_eq!(table_count(&state.pool, "owner").await, 0);
        }
    }

    #[tokio::test]
    async fn enrollment_error_code_mappings() {
        let codes_to_test = vec![
            ("ENROLLMENT_CODE:DEVICE_SCOPE_CONFLICT:409:conflict", "DEVICE_SCOPE_CONFLICT", false),
            ("ENROLLMENT_CODE:DEVICE_REVOKED:409:revoked", "DEVICE_REVOKED", false),
            ("ENROLLMENT_CODE:DEVICE_SYNC_RECORD_CONFLICT:409:sync", "DEVICE_SYNC_RECORD_CONFLICT", false),
            ("ENROLLMENT_CODE:ACTIVATION_REJECTED:401:unauthorized", "ACTIVATION_REJECTED", false),
            ("ENROLLMENT_CODE:API_UNAVAILABLE:500:error", "API_UNAVAILABLE", true),
        ];

        for (err_str, expected_code, expected_retryable) in codes_to_test {
            let pool = crate::db::init_db_pool_with_url("sqlite::memory:").await.unwrap();
            let lan_path = std::env::temp_dir().join(format!("registration-test-{}", uuid::Uuid::new_v4()));
            let lan_state = Arc::new(LanServerState::new(pool.clone(), 0, &lan_path).unwrap());
            struct CustomMockActivation { err: String }
            #[async_trait]
            impl OtpClient for CustomMockActivation {
                async fn request_otp(&self, _phone: &str) -> Result<i64, String> { Ok(300) }
                async fn verify_otp(&self, _phone: &str, _code: &str) -> Result<String, String> { Ok("tok".into()) }
            }
            #[async_trait]
            impl ActivationClient for CustomMockActivation {
                async fn register(&self, _req: RegisterRequest) -> Result<RegisterResponse, String> {
                    Ok(RegisterResponse {
                        business_id: "AFYA-TEST01".into(),
                        workspace_id: "ws-1".into(),
                        branch_id: "branch-1".into(),
                        activation_grant: "grant".into(),
                    })
                }
                async fn enroll_device(&self, _grant: &str, _device_id: &str) -> Result<DeviceCredentials, String> {
                    Err(self.err.clone())
                }
                async fn refresh_device_credentials(&self, _id: &str, _token: &str) -> Result<DeviceCredentials, String> {
                    Err("not used".into())
                }
            }

            let mock = Arc::new(CustomMockActivation { err: err_str.into() });
            let state = AppState {
                pool,
                lan_state,
                auth_state: Arc::new(AuthState::new(Arc::new(RealClock))),
                keystore: Arc::new(Keystore::init().unwrap()),
                registration_keychain: Arc::new(MockKeychain {
                    fail_id: false,
                    fail_store: false,
                    fail_pending_store: false,
                    pending: std::sync::Mutex::new(None),
                }),
                otp_client: mock.clone(),
                activation_client: mock,
            };

            let err_res = registration_commit_inner(&state, valid_payload()).await.unwrap_err();
            assert_eq!(err_res.code, expected_code);
            assert_eq!(err_res.retryable, expected_retryable);
            assert_eq!(err_res.stage, "device_enrollment");
        }
    }

    #[tokio::test]
    async fn secure_storage_failures_and_invalid_owner_phone_fail_before_local_writes() {
        for (fail_id, fail_store) in [(true, false), (false, true)] {
            let state = test_state(None, false, fail_id, fail_store, false).await;
            let error = registration_commit_inner(&state, valid_payload())
                .await
                .unwrap_err();
            assert_eq!(error.code, "SECURE_STORAGE_FAILURE");
            assert_eq!(table_count(&state.pool, "business").await, 0);
        }
        let state = test_state(None, false, false, false, true).await;
        let error = registration_commit_inner(&state, valid_payload())
            .await
            .unwrap_err();
        assert_eq!(error.code, "SECURE_STORAGE_FAILURE");
        assert_eq!(table_count(&state.pool, "owner").await, 0);
        assert_eq!(table_count(&state.pool, "business").await, 0);
        let state = test_state(None, false, false, false, false).await;
        let mut payload = valid_payload();
        payload["owner_phone"] = serde_json::json!("+233712345678");
        let error = registration_commit_inner(&state, payload)
            .await
            .unwrap_err();
        assert_eq!(error.code, "INVALID_REGISTRATION_DATA");
        assert_eq!(table_count(&state.pool, "owner").await, 0);
    }

    #[tokio::test]
    async fn failed_local_insert_rolls_back_prior_owner_insert() {
        let state = test_state(None, false, false, false, false).await;
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("INSERT INTO app_user (id,workspace_id,branch_id,username,first_name,last_name,full_name,role,role_preset,active,created_at,updated_at) VALUES ('existing','ws-registration-test','branch-registration-test','owner.test','Existing','User','Existing User','sudo','sudo',1,?,?)")
            .bind(&now).bind(&now).execute(&state.pool).await.unwrap();
        let error = registration_commit_inner(&state, valid_payload())
            .await
            .unwrap_err();
        assert_eq!(error.code, "DATABASE_CONSTRAINT_FAILURE");
        assert_eq!(table_count(&state.pool, "owner").await, 0);
        assert_eq!(table_count(&state.pool, "business").await, 0);
    }

    #[tokio::test]
    async fn duplicate_registration_retry_does_not_duplicate_business_or_owner() {
        let state = test_state(None, false, false, false, false).await;
        registration_commit_inner(&state, valid_payload())
            .await
            .unwrap();
        let error = registration_commit_inner(&state, valid_payload())
            .await
            .unwrap_err();
        assert_eq!(error.code, "REGISTRATION_ALREADY_COMPLETED");
        assert_eq!(table_count(&state.pool, "business").await, 1);
        assert_eq!(table_count(&state.pool, "owner").await, 1);
    }

    #[tokio::test]
    async fn registration_succeeds_after_upgrading_a_populated_database() {
        use sqlx::{
            migrate::Migrator,
            sqlite::{SqliteConnectOptions, SqlitePoolOptions},
        };
        use std::{borrow::Cow, str::FromStr};
        static MIGRATOR: Migrator = sqlx::migrate!("../../../infra/db/sqlite-schema/migrations");

        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(
                SqliteConnectOptions::from_str("sqlite::memory:")
                    .unwrap()
                    .foreign_keys(true),
            )
            .await
            .unwrap();
        let before_latest = Migrator {
            migrations: Cow::Owned(
                MIGRATOR
                    .iter()
                    .filter(|migration| migration.version < 34)
                    .cloned()
                    .collect(),
            ),
            ..Migrator::DEFAULT
        };
        before_latest.run(&pool).await.unwrap();
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("INSERT INTO business (id,workspace_id,branch_id,business_id,name,contact_mobile,created_at,updated_at) VALUES ('preserved','old-workspace','old-branch','AFYA-OLD001','Existing Pharmacy','255712345678',?,?)")
            .bind(&now).bind(&now).execute(&pool).await.unwrap();
        MIGRATOR.run(&pool).await.unwrap();

        let state = test_state_with_pool(pool, None, false, false, false, false).await;
        let result = registration_commit_inner(&state, valid_payload())
            .await
            .unwrap();
        assert_eq!(result.business_id, "AFYA-TEST01");
        let preserved: (String,) =
            sqlx::query_as("SELECT name FROM business WHERE business_id='AFYA-OLD001'")
                .fetch_one(&state.pool)
                .await
                .unwrap();
        assert_eq!(preserved.0, "Existing Pharmacy");
        assert_eq!(table_count(&state.pool, "owner").await, 1);
    }
}

#[tauri::command]
pub async fn recovery_redeem(
    _state: State<'_, AppState>,
    _username: String,
    _code: String,
    _new_password: String,
) -> Result<(), AuthErrorResponse> {
    Ok(())
}
