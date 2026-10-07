use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::auth::AuthContext;
use crate::models::audit::AuditLogEntry;
use crate::models::customers::{AddCustomerRequest, Customer, UpdateCustomerRequest};
use crate::repositories::audit_repo::audit;
use crate::repositories::customer_repo::{CustomerRepository, normalize_tz_phone};

pub struct CustomerService;

impl CustomerService {
    pub async fn create_customer(
        pool: &SqlitePool,
        ctx: &AuthContext,
        req: AddCustomerRequest,
    ) -> Result<Customer, String> {
        let norm_phone = normalize_tz_phone(&req.phone)
            .ok_or_else(|| "Invalid phone number format. Must be 0XXXXXXXXX, 255XXXXXXXXX, or +255XXXXXXXXX".to_string())?;

        if let Some(existing) = CustomerRepository::find_by_workspace_and_phone(pool, &ctx.workspace_id, &norm_phone)
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
            full_name: req.full_name,
            phone: norm_phone,
            email: req.email,
            outstanding_balance: 0,
            notes: req.notes,
            dob: req.dob,
            sex: req.sex,
            blood_group: req.blood_group,
            allergies: req.allergies.and_then(|v| serde_json::to_string(&v).ok()),
            chronic_conditions: req.chronic_conditions.and_then(|v| serde_json::to_string(&v).ok()),
            current_medications: req.current_medications.and_then(|v| serde_json::to_string(&v).ok()),
            emergency_contact: req.emergency_contact.and_then(|v| serde_json::to_string(&v).ok()),
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

        CustomerRepository::create(&mut *tx, &customer)
            .await
            .map_err(|e| format!("Failed to create customer: {}", e))?;

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

        let phone = if let Some(p) = req.phone {
            normalize_tz_phone(&p).ok_or_else(|| "Invalid phone number format".to_string())?
        } else {
            existing.phone
        };

        let now = Utc::now().to_rfc3339();
        let updated = Customer {
            id: existing.id.clone(),
            workspace_id: existing.workspace_id,
            branch_id: existing.branch_id,
            created_at: existing.created_at,
            updated_at: now.clone(),
            full_name: req.full_name.unwrap_or(existing.full_name),
            phone,
            email: req.email.or(existing.email),
            outstanding_balance: req.outstanding_balance.unwrap_or(existing.outstanding_balance),
            notes: req.notes.or(existing.notes),
            dob: req.dob.or(existing.dob),
            sex: req.sex.or(existing.sex),
            blood_group: req.blood_group.or(existing.blood_group),
            allergies: req.allergies.and_then(|v| serde_json::to_string(&v).ok()).or(existing.allergies),
            chronic_conditions: req.chronic_conditions.and_then(|v| serde_json::to_string(&v).ok()).or(existing.chronic_conditions),
            current_medications: req.current_medications.and_then(|v| serde_json::to_string(&v).ok()).or(existing.current_medications),
            emergency_contact: req.emergency_contact.and_then(|v| serde_json::to_string(&v).ok()).or(existing.emergency_contact),
            ward_district: req.ward_district.or(existing.ward_district),
            pharmacy_notes: req.pharmacy_notes.or(existing.pharmacy_notes),
            archived_at: req.archived_at.or(existing.archived_at),
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

        CustomerRepository::update(&mut *tx, &updated)
            .await
            .map_err(|e| format!("Failed to update customer: {}", e))?;

        tx.commit().await.map_err(|e| e.to_string())?;

        Ok(updated)
    }
}
