use sqlx::SqlitePool;
use crate::models::customers::Customer;

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

    pub async fn create(pool: &SqlitePool, customer: &Customer) -> Result<(), sqlx::Error> {
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
        .bind(&customer.phone)
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
        .bind(&customer.phone)
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
