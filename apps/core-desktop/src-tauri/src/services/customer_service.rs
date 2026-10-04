use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::models::customers::{AddCustomerRequest, Customer, UpdateCustomerRequest};
use crate::models::{DEFAULT_BRANCH_ID, DEFAULT_WORKSPACE_ID};
use crate::repositories::customer_repo::{CustomerRepository, normalize_tz_phone};

pub struct CustomerService;

impl CustomerService {
    pub async fn create_customer(
        pool: &SqlitePool,
        req: AddCustomerRequest,
    ) -> Result<Customer, String> {
        let norm_phone = normalize_tz_phone(&req.phone)
            .ok_or_else(|| "Invalid phone number format. Must be 0XXXXXXXXX, 255XXXXXXXXX, or +255XXXXXXXXX".to_string())?;

        let workspace_id = DEFAULT_WORKSPACE_ID.to_string();

        if let Some(existing) = CustomerRepository::find_by_workspace_and_phone(pool, &workspace_id, &norm_phone)
            .await
            .map_err(|e| e.to_string())?
        {
            return Err(format!("DUPLICATE_PHONE:{}", existing.id));
        }

        let now = Utc::now().to_rfc3339();
        let customer = Customer {
            id: format!("cust_{}", Uuid::new_v4().simple()),
            workspace_id,
            branch_id: DEFAULT_BRANCH_ID.to_string(),
            created_at: now.clone(),
            updated_at: now,
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

        CustomerRepository::create(pool, &customer)
            .await
            .map_err(|e| format!("Failed to create customer: {}", e))?;

        Ok(customer)
    }

    pub async fn update_customer(
        pool: &SqlitePool,
        id: &str,
        req: UpdateCustomerRequest,
    ) -> Result<Customer, String> {
        let existing = CustomerRepository::get_by_id(pool, id)
            .await
            .map_err(|e| format!("Failed to fetch customer: {}", e))?
            .ok_or_else(|| "Customer not found".to_string())?;

        let phone = if let Some(p) = req.phone {
            normalize_tz_phone(&p).ok_or_else(|| "Invalid phone number format".to_string())?
        } else {
            existing.phone
        };

        let updated = Customer {
            id: existing.id.clone(),
            workspace_id: existing.workspace_id,
            branch_id: existing.branch_id,
            created_at: existing.created_at,
            updated_at: Utc::now().to_rfc3339(),
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

        CustomerRepository::update(pool, &updated)
            .await
            .map_err(|e| format!("Failed to update customer: {}", e))?;

        Ok(updated)
    }
}
