use sqlx::SqlitePool;
use crate::models::customers::Customer;

pub fn normalize_tz_phone(phone: &str) -> String {
    let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.starts_with("255") && digits.len() == 12 {
        format!("+{}", digits)
    } else if digits.starts_with('0') && digits.len() == 10 {
        format!("+255{}", &digits[1..])
    } else if digits.len() == 9 {
        format!("+255{}", digits)
    } else {
        phone.trim().to_string()
    }
}

pub struct CustomerRepository;

impl CustomerRepository {
    pub async fn list(pool: &SqlitePool) -> Result<Vec<Customer>, sqlx::Error> {
        sqlx::query_as::<_, Customer>(
            "SELECT * FROM customer ORDER BY created_at DESC"
        )
        .fetch_all(pool)
        .await
    }

    pub async fn get_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Customer>, sqlx::Error> {
        sqlx::query_as::<_, Customer>(
            "SELECT * FROM customer WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(pool)
        .await
    }

    pub async fn find_by_normalized_phone(
        pool: &SqlitePool,
        phone: &str,
    ) -> Result<Option<Customer>, sqlx::Error> {
        let customers = Self::list(pool).await?;
        let norm_target = normalize_tz_phone(phone);
        for c in customers {
            if normalize_tz_phone(&c.phone) == norm_target {
                return Ok(Some(c));
            }
        }
        Ok(None)
    }

    pub async fn create(pool: &SqlitePool, customer: &Customer) -> Result<(), sqlx::Error> {
        let norm_phone = normalize_tz_phone(&customer.phone);
        sqlx::query(
            r#"
            INSERT INTO customer (
                id, workspace_id, branch_id, full_name, phone, email,
                outstanding_balance, notes, amob_patient_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        .bind(&customer.amob_patient_id)
        .bind(&customer.created_at)
        .bind(&customer.updated_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn update(pool: &SqlitePool, customer: &Customer) -> Result<(), sqlx::Error> {
        let norm_phone = normalize_tz_phone(&customer.phone);
        sqlx::query(
            r#"
            UPDATE customer SET
                full_name = ?,
                phone = ?,
                email = ?,
                outstanding_balance = ?,
                notes = ?,
                updated_at = ?
            WHERE id = ?
            "#
        )
        .bind(&customer.full_name)
        .bind(&norm_phone)
        .bind(&customer.email)
        .bind(customer.outstanding_balance)
        .bind(&customer.notes)
        .bind(&customer.updated_at)
        .bind(&customer.id)
        .execute(pool)
        .await?;

        Ok(())
    }
}
