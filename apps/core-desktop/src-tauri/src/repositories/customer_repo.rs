use sqlx::SqlitePool;
use crate::models::customers::Customer;

pub fn normalize_tz_phone(phone: &str) -> Option<String> {
    let trimmed = phone.trim();
    let has_plus = trimmed.starts_with('+');
    let digits: String = trimmed.chars().filter(|c| c.is_ascii_digit()).collect();

    if has_plus {
        if digits.starts_with("255") && digits.len() == 12 {
            return Some(format!("+{}", digits));
        }
    } else {
        if digits.starts_with("255") && digits.len() == 12 {
            return Some(format!("+{}", digits));
        }
        if digits.starts_with('0') && digits.len() == 10 {
            return Some(format!("+255{}", &digits[1..]));
        }
    }
    None
}

pub struct CustomerRepository;

impl CustomerRepository {
    pub async fn list(pool: &SqlitePool, workspace_id: &str) -> Result<Vec<Customer>, sqlx::Error> {
        sqlx::query_as::<_, Customer>(
            "SELECT * FROM customer WHERE workspace_id = ? ORDER BY created_at DESC"
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn get_by_id(pool: &SqlitePool, workspace_id: &str, id: &str) -> Result<Option<Customer>, sqlx::Error> {
        sqlx::query_as::<_, Customer>(
            "SELECT * FROM customer WHERE workspace_id = ? AND id = ?"
        )
        .bind(workspace_id)
        .bind(id)
        .fetch_optional(pool)
        .await
    }

    pub async fn find_by_workspace_and_phone(
        pool: &SqlitePool,
        workspace_id: &str,
        norm_phone: &str,
    ) -> Result<Option<Customer>, sqlx::Error> {
        sqlx::query_as::<_, Customer>(
            "SELECT * FROM customer WHERE workspace_id = ? AND phone = ?"
        )
        .bind(workspace_id)
        .bind(norm_phone)
        .fetch_optional(pool)
        .await
    }

    pub async fn create(executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>, customer: &Customer) -> Result<(), sqlx::Error> {
        let norm_phone = normalize_tz_phone(&customer.phone).unwrap_or_else(|| customer.phone.clone());
        sqlx::query(
            r#"
            INSERT INTO customer (
                id, workspace_id, branch_id, full_name, phone, email,
                outstanding_balance, notes, dob, sex, blood_group, allergies,
                chronic_conditions, current_medications, emergency_contact,
                ward_district, pharmacy_notes, archived_at, amob_patient_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&customer.id)
        .bind(&customer.workspace_id)
        .bind(&customer.branch_id)
        .bind(&customer.full_name)
        .bind(&norm_phone)
        .bind(&customer.email)
        .bind(customer.outstanding_balance)
        .bind(&customer.notes)
        .bind(&customer.dob)
        .bind(&customer.sex)
        .bind(&customer.blood_group)
        .bind(&customer.allergies)
        .bind(&customer.chronic_conditions)
        .bind(&customer.current_medications)
        .bind(&customer.emergency_contact)
        .bind(&customer.ward_district)
        .bind(&customer.pharmacy_notes)
        .bind(&customer.archived_at)
        .bind(&customer.amob_patient_id)
        .bind(&customer.created_at)
        .bind(&customer.updated_at)
        .execute(executor)
        .await?;

        Ok(())
    }

    pub async fn update(executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>, customer: &Customer) -> Result<(), sqlx::Error> {
        let norm_phone = normalize_tz_phone(&customer.phone).unwrap_or_else(|| customer.phone.clone());
        sqlx::query(
            r#"
            UPDATE customer SET
                full_name = ?,
                phone = ?,
                email = ?,
                outstanding_balance = ?,
                notes = ?,
                dob = ?,
                sex = ?,
                blood_group = ?,
                allergies = ?,
                chronic_conditions = ?,
                current_medications = ?,
                emergency_contact = ?,
                ward_district = ?,
                pharmacy_notes = ?,
                archived_at = ?,
                updated_at = ?
            WHERE id = ? AND workspace_id = ?
            "#
        )
        .bind(&customer.full_name)
        .bind(&norm_phone)
        .bind(&customer.email)
        .bind(customer.outstanding_balance)
        .bind(&customer.notes)
        .bind(&customer.dob)
        .bind(&customer.sex)
        .bind(&customer.blood_group)
        .bind(&customer.allergies)
        .bind(&customer.chronic_conditions)
        .bind(&customer.current_medications)
        .bind(&customer.emergency_contact)
        .bind(&customer.ward_district)
        .bind(&customer.pharmacy_notes)
        .bind(&customer.archived_at)
        .bind(&customer.updated_at)
        .bind(&customer.id)
        .bind(&customer.workspace_id)
        .execute(executor)
        .await?;

        Ok(())
    }
}
