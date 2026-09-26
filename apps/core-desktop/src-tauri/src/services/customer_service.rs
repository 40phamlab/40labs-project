use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::models::customers::{AddCustomerRequest, Customer, UpdateCustomerRequest};
use crate::models::{DEFAULT_BRANCH_ID, DEFAULT_WORKSPACE_ID};
use crate::repositories::customer_repo::CustomerRepository;

pub struct CustomerService;

impl CustomerService {
    pub async fn create_customer(
        pool: &SqlitePool,
        req: AddCustomerRequest,
    ) -> Result<Customer, String> {
        let now = Utc::now().to_rfc3339();
        let customer = Customer {
            id: format!("cust_{}", Uuid::new_v4().simple()),
            workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
            branch_id: DEFAULT_BRANCH_ID.to_string(),
            created_at: now.clone(),
            updated_at: now,
            full_name: req.full_name,
            phone: req.phone,
            email: req.email,
            outstanding_balance: 0,
            notes: req.notes,
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

        let updated = Customer {
            id: existing.id.clone(),
            workspace_id: existing.workspace_id,
            branch_id: existing.branch_id,
            created_at: existing.created_at,
            updated_at: Utc::now().to_rfc3339(),
            full_name: req.full_name.unwrap_or(existing.full_name),
            phone: req.phone.unwrap_or(existing.phone),
            email: req.email.or(existing.email),
            outstanding_balance: req.outstanding_balance.unwrap_or(existing.outstanding_balance),
            notes: req.notes.or(existing.notes),
            amob_patient_id: existing.amob_patient_id,
        };

        CustomerRepository::update(pool, &updated)
            .await
            .map_err(|e| format!("Failed to update customer: {}", e))?;

        Ok(updated)
    }
}
