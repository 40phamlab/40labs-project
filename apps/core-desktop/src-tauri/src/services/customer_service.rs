use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::auth::AuthContext;
use crate::models::audit::AuditLogEntry;
use crate::models::customers::{AddCustomerRequest, Customer, FieldUpdate, UpdateCustomerRequest};
use crate::repositories::audit_repo::audit;
use crate::repositories::customer_repo::{normalize_tz_phone, CustomerRepository};

pub struct CustomerService;

impl CustomerService {
    pub async fn create_customer(
        pool: &SqlitePool,
        ctx: &AuthContext,
        req: AddCustomerRequest,
    ) -> Result<Customer, String> {
        let full_name = req.full_name.trim().to_string();
        if full_name.is_empty() {
            return Err("INVALID_FULL_NAME: Full name is required".to_string());
        }

        let norm_phone = normalize_tz_phone(&req.phone).ok_or_else(|| {
            "INVALID_PHONE: Invalid Tanzanian phone number format. Must be 0XXXXXXXXX, 255XXXXXXXXX, or +255XXXXXXXXX".to_string()
        })?;

        if let Some(ref email) = req.email {
            let trimmed = email.trim();
            if !trimmed.is_empty() && (!trimmed.contains('@') || !trimmed.contains('.')) {
                return Err("INVALID_EMAIL: Invalid email address format".to_string());
            }
        }

        if let Some(ref sex) = req.sex {
            if !sex.is_empty() && !matches!(sex.as_str(), "male" | "female" | "other") {
                return Err("INVALID_SEX: Sex must be male, female, or other".to_string());
            }
        }

        if let Some(existing) =
            CustomerRepository::find_by_workspace_and_phone(pool, &ctx.workspace_id, &norm_phone, None)
                .await
                .map_err(|e| e.to_string())?
        {
            return Err(format!("DUPLICATE_PHONE:{}", existing.id));
        }

        let now = Utc::now().to_rfc3339();
        let customer_id = format!("cust_{}", Uuid::new_v4().simple());
        let customer = Customer {
            id: customer_id.clone(),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            created_at: now.clone(),
            updated_at: now.clone(),
            full_name,
            phone: norm_phone,
            email: req.email.map(|e| e.trim().to_string()).filter(|e| !e.is_empty()),
            outstanding_balance: 0,
            notes: req.notes,
            dob: req.dob,
            sex: req.sex,
            blood_group: req.blood_group,
            allergies: req.allergies.and_then(|v| serde_json::to_string(&v).ok()),
            chronic_conditions: req
                .chronic_conditions
                .and_then(|v| serde_json::to_string(&v).ok()),
            current_medications: req
                .current_medications
                .and_then(|v| serde_json::to_string(&v).ok()),
            emergency_contact: req
                .emergency_contact
                .and_then(|v| serde_json::to_string(&v).ok()),
            ward_district: req.ward_district,
            pharmacy_notes: req.pharmacy_notes,
            archived_at: None,
            amob_patient_id: None,
        };

        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "customer_create".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "Customer".to_string(),
            target_entity_id: customer_id,
            metadata: Some(serde_json::json!({ "name": &customer.full_name }).to_string()),
            created_at: now,
        };
        audit::append(&mut *tx, &audit_entry)
            .await
            .map_err(|e| format!("Audit error: {}", e))?;

        if let Err(err) = CustomerRepository::create(&mut *tx, &customer).await {
            let err_msg = err.to_string();
            if err_msg.contains("UNIQUE constraint failed") || err_msg.contains("code: 2067") || err_msg.contains("code: 1555") {
                if let Ok(Some(existing)) = CustomerRepository::find_by_workspace_and_phone(
                    pool,
                    &ctx.workspace_id,
                    &customer.phone,
                    None,
                ).await {
                    return Err(format!("DUPLICATE_PHONE:{}", existing.id));
                }
            }
            return Err(format!("Failed to create customer: {}", err));
        }

        tx.commit().await.map_err(|e| e.to_string())?;

        Ok(customer)
    }

    pub async fn update_customer(
        pool: &SqlitePool,
        ctx: &AuthContext,
        id: &str,
        req: UpdateCustomerRequest,
    ) -> Result<Customer, String> {
        let existing = CustomerRepository::get_by_id(pool, &ctx.workspace_id, id)
            .await
            .map_err(|e| format!("Failed to fetch customer: {}", e))?
            .ok_or_else(|| "Customer not found".to_string())?;

        let full_name = if let Some(fn_str) = req.full_name {
            let trimmed = fn_str.trim().to_string();
            if trimmed.is_empty() {
                return Err("INVALID_FULL_NAME: Full name cannot be empty".to_string());
            }
            trimmed
        } else {
            existing.full_name
        };

        let phone = if let Some(p) = req.phone {
            let norm_p = normalize_tz_phone(&p).ok_or_else(|| {
                "INVALID_PHONE: Invalid Tanzanian phone number format. Must be 0XXXXXXXXX, 255XXXXXXXXX, or +255XXXXXXXXX".to_string()
            })?;
            if let Some(dup) = CustomerRepository::find_by_workspace_and_phone(
                pool,
                &ctx.workspace_id,
                &norm_p,
                Some(id),
            )
            .await
            .map_err(|e| e.to_string())?
            {
                return Err(format!("DUPLICATE_PHONE:{}", dup.id));
            }
            norm_p
        } else {
            existing.phone
        };

        let email = match req.email {
            FieldUpdate::Unset => existing.email,
            FieldUpdate::Clear => None,
            FieldUpdate::Set(e) => {
                let trimmed = e.trim().to_string();
                if trimmed.is_empty() {
                    None
                } else {
                    if !trimmed.contains('@') || !trimmed.contains('.') {
                        return Err("INVALID_EMAIL: Invalid email address format".to_string());
                    }
                    Some(trimmed)
                }
            }
        };

        let notes = match req.notes {
            FieldUpdate::Unset => existing.notes,
            FieldUpdate::Clear => None,
            FieldUpdate::Set(n) => {
                let trimmed = n.trim().to_string();
                if trimmed.is_empty() { None } else { Some(trimmed) }
            }
        };

        let dob = match req.dob {
            FieldUpdate::Unset => existing.dob,
            FieldUpdate::Clear => None,
            FieldUpdate::Set(d) => {
                let trimmed = d.trim().to_string();
                if trimmed.is_empty() { None } else { Some(trimmed) }
            }
        };

        let sex = match req.sex {
            FieldUpdate::Unset => existing.sex,
            FieldUpdate::Clear => None,
            FieldUpdate::Set(s) => {
                let trimmed = s.trim().to_string();
                if trimmed.is_empty() {
                    None
                } else {
                    if !matches!(trimmed.as_str(), "male" | "female" | "other") {
                        return Err("INVALID_SEX: Sex must be male, female, or other".to_string());
                    }
                    Some(trimmed)
                }
            }
        };

        let blood_group = match req.blood_group {
            FieldUpdate::Unset => existing.blood_group,
            FieldUpdate::Clear => None,
            FieldUpdate::Set(bg) => {
                let trimmed = bg.trim().to_string();
                if trimmed.is_empty() { None } else { Some(trimmed) }
            }
        };

        let allergies = match req.allergies {
            FieldUpdate::Unset => existing.allergies,
            FieldUpdate::Clear => None,
            FieldUpdate::Set(val) => {
                if val.is_null() || (val.is_array() && val.as_array().map_or(true, |a| a.is_empty())) {
                    None
                } else {
                    serde_json::to_string(&val).ok()
                }
            }
        };

        let chronic_conditions = match req.chronic_conditions {
            FieldUpdate::Unset => existing.chronic_conditions,
            FieldUpdate::Clear => None,
            FieldUpdate::Set(vec) => {
                if vec.is_empty() {
                    None
                } else {
                    serde_json::to_string(&vec).ok()
                }
            }
        };

        let current_medications = match req.current_medications {
            FieldUpdate::Unset => existing.current_medications,
            FieldUpdate::Clear => None,
            FieldUpdate::Set(vec) => {
                if vec.is_empty() {
                    None
                } else {
                    serde_json::to_string(&vec).ok()
                }
            }
        };

        let emergency_contact = match req.emergency_contact {
            FieldUpdate::Unset => existing.emergency_contact,
            FieldUpdate::Clear => None,
            FieldUpdate::Set(val) => {
                if val.is_null() {
                    None
                } else if let Some(obj) = val.as_object() {
                    let name = obj.get("name").and_then(|v| v.as_str()).unwrap_or("").trim();
                    let phone = obj.get("phone").and_then(|v| v.as_str()).unwrap_or("").trim();
                    if name.is_empty() && phone.is_empty() {
                        None
                    } else {
                        serde_json::to_string(&val).ok()
                    }
                } else {
                    serde_json::to_string(&val).ok()
                }
            }
        };

        let ward_district = match req.ward_district {
            FieldUpdate::Unset => existing.ward_district,
            FieldUpdate::Clear => None,
            FieldUpdate::Set(wd) => {
                let trimmed = wd.trim().to_string();
                if trimmed.is_empty() { None } else { Some(trimmed) }
            }
        };

        let pharmacy_notes = match req.pharmacy_notes {
            FieldUpdate::Unset => existing.pharmacy_notes,
            FieldUpdate::Clear => None,
            FieldUpdate::Set(pn) => {
                let trimmed = pn.trim().to_string();
                if trimmed.is_empty() { None } else { Some(trimmed) }
            }
        };

        let archived_at = match req.archived_at {
            FieldUpdate::Unset => existing.archived_at,
            FieldUpdate::Clear => None,
            FieldUpdate::Set(dt) => {
                let trimmed = dt.trim().to_string();
                if trimmed.is_empty() { None } else { Some(trimmed) }
            }
        };

        if let Some(bal) = req.outstanding_balance {
            if bal < 0 {
                return Err("INVALID_BALANCE: Outstanding balance cannot be negative".to_string());
            }
        }

        let outstanding_balance = req.outstanding_balance.unwrap_or(existing.outstanding_balance);

        let now = Utc::now().to_rfc3339();
        let updated = Customer {
            id: existing.id.clone(),
            workspace_id: existing.workspace_id,
            branch_id: existing.branch_id,
            created_at: existing.created_at,
            updated_at: now.clone(),
            full_name,
            phone,
            email,
            outstanding_balance,
            notes,
            dob,
            sex,
            blood_group,
            allergies,
            chronic_conditions,
            current_medications,
            emergency_contact,
            ward_district,
            pharmacy_notes,
            archived_at,
            amob_patient_id: existing.amob_patient_id,
        };

        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "customer_update".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "Customer".to_string(),
            target_entity_id: existing.id.clone(),
            metadata: Some(serde_json::json!({ "name": &updated.full_name }).to_string()),
            created_at: now,
        };
        audit::append(&mut *tx, &audit_entry)
            .await
            .map_err(|e| format!("Audit error: {}", e))?;

        if let Err(err) = CustomerRepository::update(&mut *tx, &updated).await {
            let err_msg = err.to_string();
            if err_msg.contains("UNIQUE constraint failed") || err_msg.contains("code: 2067") || err_msg.contains("code: 1555") {
                if let Ok(Some(existing_dup)) = CustomerRepository::find_by_workspace_and_phone(
                    pool,
                    &ctx.workspace_id,
                    &updated.phone,
                    Some(id),
                ).await {
                    return Err(format!("DUPLICATE_PHONE:{}", existing_dup.id));
                }
            }
            return Err(format!("Failed to update customer: {}", err));
        }

        tx.commit().await.map_err(|e| e.to_string())?;

        Ok(updated)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn setup_test_pool() -> SqlitePool {
        let pool = crate::db::init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to initialize test pool");

        sqlx::query(
            r#"
            INSERT INTO app_user (id, workspace_id, branch_id, username, first_name, last_name, full_name, role, role_preset, active, created_at, updated_at)
            VALUES ('user_test_1', 'ws_svc_1', 'br_svc_1', 'tester', 'Test', 'User', 'Test User', 'staff', 'pharmacist', 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')
            "#,
        )
        .execute(&pool)
        .await
        .unwrap();

        pool
    }

    #[tokio::test]
    async fn test_case_1_create_two_customers_with_equivalent_normalized_phones() {
        let pool = setup_test_pool().await;
        let ctx = AuthContext {
            user_id: "user_test_1".to_string(),
            workspace_id: "ws_svc_1".to_string(),
            branch_id: "br_svc_1".to_string(),
        };

        let req1 = AddCustomerRequest {
            full_name: "Juma Hamisi".to_string(),
            phone: "0712345678".to_string(),
            email: None,
            notes: None,
            dob: None,
            sex: None,
            blood_group: None,
            allergies: None,
            chronic_conditions: None,
            current_medications: None,
            emergency_contact: None,
            ward_district: None,
            pharmacy_notes: None,
        };
        let cust1 = CustomerService::create_customer(&pool, &ctx, req1)
            .await
            .expect("First customer creation failed");
        assert_eq!(cust1.phone, "+255712345678");

        let req2 = AddCustomerRequest {
            full_name: "Juma Hamisi Duplicate".to_string(),
            phone: "+255 712 345 678".to_string(),
            email: None,
            notes: None,
            dob: None,
            sex: None,
            blood_group: None,
            allergies: None,
            chronic_conditions: None,
            current_medications: None,
            emergency_contact: None,
            ward_district: None,
            pharmacy_notes: None,
        };
        let res2 = CustomerService::create_customer(&pool, &ctx, req2).await;
        assert!(res2.is_err());
        let err_msg = res2.unwrap_err();
        assert_eq!(err_msg, format!("DUPLICATE_PHONE:{}", cust1.id));
    }

    #[tokio::test]
    async fn test_case_2_update_customer_to_another_customers_phone() {
        let pool = setup_test_pool().await;
        let ctx = AuthContext {
            user_id: "user_test_1".to_string(),
            workspace_id: "ws_svc_1".to_string(),
            branch_id: "br_svc_1".to_string(),
        };

        let cust1 = CustomerService::create_customer(
            &pool,
            &ctx,
            AddCustomerRequest {
                full_name: "Customer One".to_string(),
                phone: "0754111222".to_string(),
                email: None,
                notes: None,
                dob: None,
                sex: None,
                blood_group: None,
                allergies: None,
                chronic_conditions: None,
                current_medications: None,
                emergency_contact: None,
                ward_district: None,
                pharmacy_notes: None,
            },
        )
        .await
        .unwrap();

        let cust2 = CustomerService::create_customer(
            &pool,
            &ctx,
            AddCustomerRequest {
                full_name: "Customer Two".to_string(),
                phone: "0754333444".to_string(),
                email: None,
                notes: None,
                dob: None,
                sex: None,
                blood_group: None,
                allergies: None,
                chronic_conditions: None,
                current_medications: None,
                emergency_contact: None,
                ward_district: None,
                pharmacy_notes: None,
            },
        )
        .await
        .unwrap();

        let update_req = UpdateCustomerRequest {
            phone: Some("+255 754 111 222".to_string()),
            ..Default::default()
        };

        let res = CustomerService::update_customer(&pool, &ctx, &cust2.id, update_req).await;
        assert!(res.is_err());
        assert_eq!(res.unwrap_err(), format!("DUPLICATE_PHONE:{}", cust1.id));
    }

    #[tokio::test]
    async fn test_case_3_update_customer_phone_without_changing_it() {
        let pool = setup_test_pool().await;
        let ctx = AuthContext {
            user_id: "user_test_1".to_string(),
            workspace_id: "ws_svc_1".to_string(),
            branch_id: "br_svc_1".to_string(),
        };

        let cust = CustomerService::create_customer(
            &pool,
            &ctx,
            AddCustomerRequest {
                full_name: "Amina Salum".to_string(),
                phone: "0768112233".to_string(),
                email: None,
                notes: None,
                dob: None,
                sex: None,
                blood_group: None,
                allergies: None,
                chronic_conditions: None,
                current_medications: None,
                emergency_contact: None,
                ward_district: None,
                pharmacy_notes: None,
            },
        )
        .await
        .unwrap();

        let update_req = UpdateCustomerRequest {
            full_name: Some("Amina Salum Hassan".to_string()),
            phone: Some("0768 112 233".to_string()),
            notes: FieldUpdate::Set("New note added".to_string()),
            ..Default::default()
        };

        let updated = CustomerService::update_customer(&pool, &ctx, &cust.id, update_req)
            .await
            .expect("Updating customer with same phone should succeed");

        assert_eq!(updated.full_name, "Amina Salum Hassan");
        assert_eq!(updated.phone, "+255768112233");
    }

    #[tokio::test]
    async fn test_case_4_submit_malformed_phones_and_invalid_fields() {
        let pool = setup_test_pool().await;
        let ctx = AuthContext {
            user_id: "user_test_1".to_string(),
            workspace_id: "ws_svc_1".to_string(),
            branch_id: "br_svc_1".to_string(),
        };

        let req_empty_name = AddCustomerRequest {
            full_name: "   ".to_string(),
            phone: "0712345678".to_string(),
            email: None,
            notes: None,
            dob: None,
            sex: None,
            blood_group: None,
            allergies: None,
            chronic_conditions: None,
            current_medications: None,
            emergency_contact: None,
            ward_district: None,
            pharmacy_notes: None,
        };
        let res1 = CustomerService::create_customer(&pool, &ctx, req_empty_name).await;
        assert!(res1.is_err());
        assert!(res1.unwrap_err().contains("INVALID_FULL_NAME"));

        let req_bad_phone = AddCustomerRequest {
            full_name: "John Doe".to_string(),
            phone: "12345".to_string(),
            email: None,
            notes: None,
            dob: None,
            sex: None,
            blood_group: None,
            allergies: None,
            chronic_conditions: None,
            current_medications: None,
            emergency_contact: None,
            ward_district: None,
            pharmacy_notes: None,
        };
        let res2 = CustomerService::create_customer(&pool, &ctx, req_bad_phone).await;
        assert!(res2.is_err());
        assert!(res2.unwrap_err().contains("INVALID_PHONE"));

        let req_bad_email = AddCustomerRequest {
            full_name: "John Doe".to_string(),
            phone: "0712345678".to_string(),
            email: Some("invalid-email-address".to_string()),
            notes: None,
            dob: None,
            sex: None,
            blood_group: None,
            allergies: None,
            chronic_conditions: None,
            current_medications: None,
            emergency_contact: None,
            ward_district: None,
            pharmacy_notes: None,
        };
        let res3 = CustomerService::create_customer(&pool, &ctx, req_bad_email).await;
        assert!(res3.is_err());
        assert!(res3.unwrap_err().contains("INVALID_EMAIL"));
    }

    #[tokio::test]
    async fn test_case_5_simulate_database_unique_constraint_conflict() {
        let pool = setup_test_pool().await;
        let ctx = AuthContext {
            user_id: "user_test_1".to_string(),
            workspace_id: "ws_svc_1".to_string(),
            branch_id: "br_svc_1".to_string(),
        };

        let cust_direct = Customer {
            id: "cust_db_direct_1".to_string(),
            workspace_id: "ws_svc_1".to_string(),
            branch_id: "br_svc_1".to_string(),
            created_at: "2026-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
            full_name: "Direct DB Customer".to_string(),
            phone: "+255719887766".to_string(),
            email: None,
            outstanding_balance: 0,
            notes: None,
            dob: None,
            sex: None,
            blood_group: None,
            allergies: None,
            chronic_conditions: None,
            current_medications: None,
            emergency_contact: None,
            ward_district: None,
            pharmacy_notes: None,
            archived_at: None,
            amob_patient_id: None,
        };
        CustomerRepository::create(&pool, &cust_direct).await.unwrap();

        let req = AddCustomerRequest {
            full_name: "Conflict Customer".to_string(),
            phone: "0719887766".to_string(),
            email: None,
            notes: None,
            dob: None,
            sex: None,
            blood_group: None,
            allergies: None,
            chronic_conditions: None,
            current_medications: None,
            emergency_contact: None,
            ward_district: None,
            pharmacy_notes: None,
        };

        let res = CustomerService::create_customer(&pool, &ctx, req).await;
        assert!(res.is_err());
        assert_eq!(res.unwrap_err(), "DUPLICATE_PHONE:cust_db_direct_1");
    }

    #[tokio::test]
    async fn test_change_clear_and_preserve_optional_fields_and_sql_null() {
        let pool = setup_test_pool().await;
        let ctx = AuthContext {
            user_id: "user_test_1".to_string(),
            workspace_id: "ws_svc_1".to_string(),
            branch_id: "br_svc_1".to_string(),
        };

        let initial_req = AddCustomerRequest {
            full_name: "Initial Patient".to_string(),
            phone: "0711223344".to_string(),
            email: Some("initial@example.com".to_string()),
            notes: Some("Initial note".to_string()),
            dob: Some("1990-01-01".to_string()),
            sex: Some("female".to_string()),
            blood_group: Some("A+".to_string()),
            allergies: Some(serde_json::json!([{"substance": "Pollen"}])),
            chronic_conditions: Some(vec!["Asthma".to_string()]),
            current_medications: Some(vec!["Inhaler".to_string()]),
            emergency_contact: Some(serde_json::json!({"name": "Guardian", "phone": "+255711000000"})),
            ward_district: Some("Ilala".to_string()),
            pharmacy_notes: Some("Check inhaler refill".to_string()),
        };

        let cust = CustomerService::create_customer(&pool, &ctx, initial_req)
            .await
            .expect("Failed to create customer");

        assert_eq!(cust.email.as_deref(), Some("initial@example.com"));
        assert_eq!(cust.notes.as_deref(), Some("Initial note"));

        // 1. Partial update: change notes, leave email & dob Unset (preserved)
        let update_1 = UpdateCustomerRequest {
            notes: FieldUpdate::Set("Updated note".to_string()),
            ..Default::default()
        };
        CustomerService::update_customer(&pool, &ctx, &cust.id, update_1)
            .await
            .expect("Failed update 1");

        let reloaded_1 = CustomerRepository::get_by_id(&pool, &ctx.workspace_id, &cust.id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(reloaded_1.notes.as_deref(), Some("Updated note"));
        assert_eq!(reloaded_1.email.as_deref(), Some("initial@example.com")); // Preserved!
        assert_eq!(reloaded_1.dob.as_deref(), Some("1990-01-01")); // Preserved!

        // 2. Clear email, clear allergies, clear current_medications, clear emergency_contact
        let update_2 = UpdateCustomerRequest {
            email: FieldUpdate::Clear,
            allergies: FieldUpdate::Clear,
            current_medications: FieldUpdate::Set(vec![]), // empty list becomes SQL NULL
            emergency_contact: FieldUpdate::Clear,
            ..Default::default()
        };
        CustomerService::update_customer(&pool, &ctx, &cust.id, update_2)
            .await
            .expect("Failed update 2");

        let reloaded_2 = CustomerRepository::get_by_id(&pool, &ctx.workspace_id, &cust.id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(reloaded_2.email, None); // Persisted SQL NULL!
        assert_eq!(reloaded_2.allergies, None); // Persisted SQL NULL!
        assert_eq!(reloaded_2.current_medications, None); // Persisted SQL NULL!
        assert_eq!(reloaded_2.emergency_contact, None); // Persisted SQL NULL!
        assert_eq!(reloaded_2.notes.as_deref(), Some("Updated note")); // Preserved!

        // 3. Archive and unarchive flow
        let archive_req = UpdateCustomerRequest {
            archived_at: FieldUpdate::Set("2026-02-01T12:00:00Z".to_string()),
            ..Default::default()
        };
        CustomerService::update_customer(&pool, &ctx, &cust.id, archive_req)
            .await
            .expect("Failed archiving");

        let archived = CustomerRepository::get_by_id(&pool, &ctx.workspace_id, &cust.id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(archived.archived_at.as_deref(), Some("2026-02-01T12:00:00Z"));

        let unarchive_req = UpdateCustomerRequest {
            archived_at: FieldUpdate::Clear,
            ..Default::default()
        };
        CustomerService::update_customer(&pool, &ctx, &cust.id, unarchive_req)
            .await
            .expect("Failed unarchiving");

        let unarchived = CustomerRepository::get_by_id(&pool, &ctx.workspace_id, &cust.id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(unarchived.archived_at, None); // Persisted SQL NULL!

        // 4. Update non-existent customer returns not found error
        let res_not_found = CustomerService::update_customer(
            &pool,
            &ctx,
            "cust_non_existent",
            UpdateCustomerRequest {
                notes: FieldUpdate::Set("Should fail".to_string()),
                ..Default::default()
            },
        )
        .await;
        assert!(res_not_found.is_err());
        assert_eq!(res_not_found.unwrap_err(), "Customer not found");

        // 5. Verify failed write does not commit audit event
        let audit_count_before: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM audit_log WHERE target_entity_id = 'cust_non_existent'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(audit_count_before, 0);
    }
}
