use crate::models::customers::Customer;
use sqlx::SqlitePool;

pub fn normalize_tz_phone(phone: &str) -> Option<String> {
    let trimmed = phone.trim();
    if trimmed.is_empty() {
        return None;
    }
    let digits: String = trimmed.chars().filter(|c| c.is_ascii_digit()).collect();

    let normalized = if digits.starts_with("255") && digits.len() == 12 {
        digits
    } else if digits.starts_with('0') && digits.len() == 10 {
        format!("255{}", &digits[1..])
    } else if digits.len() == 9 {
        format!("255{}", digits)
    } else {
        return None;
    };

    if normalized.len() == 12 && normalized.starts_with("255") {
        let prefix = normalized.as_bytes().get(3)?;
        if matches!(prefix, b'6' | b'7') {
            return Some(format!("+{}", normalized));
        }
    }
    None
}

pub struct CustomerRepository;

impl CustomerRepository {
    pub async fn list(pool: &SqlitePool, workspace_id: &str) -> Result<Vec<Customer>, sqlx::Error> {
        sqlx::query_as::<_, Customer>(
            "SELECT * FROM customer WHERE workspace_id = ? ORDER BY created_at DESC",
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn get_by_id(
        pool: &SqlitePool,
        workspace_id: &str,
        id: &str,
    ) -> Result<Option<Customer>, sqlx::Error> {
        sqlx::query_as::<_, Customer>("SELECT * FROM customer WHERE workspace_id = ? AND id = ?")
            .bind(workspace_id)
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn find_by_workspace_and_phone(
        pool: &SqlitePool,
        workspace_id: &str,
        norm_phone: &str,
        exclude_id: Option<&str>,
    ) -> Result<Option<Customer>, sqlx::Error> {
        let customers = if let Some(ex_id) = exclude_id {
            sqlx::query_as::<_, Customer>(
                "SELECT * FROM customer WHERE workspace_id = ? AND id != ?",
            )
            .bind(workspace_id)
            .bind(ex_id)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, Customer>(
                "SELECT * FROM customer WHERE workspace_id = ?",
            )
            .bind(workspace_id)
            .fetch_all(pool)
            .await?
        };

        let target_norm = normalize_tz_phone(norm_phone).unwrap_or_else(|| norm_phone.to_string());
        let target_digits: String = target_norm.chars().filter(|c| c.is_ascii_digit()).collect();

        for c in customers {
            if c.phone == norm_phone || c.phone == target_norm {
                return Ok(Some(c));
            }
            if let Some(c_norm) = normalize_tz_phone(&c.phone) {
                if c_norm == target_norm {
                    return Ok(Some(c));
                }
            }
            let c_digits: String = c.phone.chars().filter(|ch| ch.is_ascii_digit()).collect();
            if !target_digits.is_empty() && (c_digits == target_digits || (c_digits.len() >= 9 && target_digits.ends_with(&c_digits))) {
                return Ok(Some(c));
            }
        }

        Ok(None)
    }

    pub async fn create(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        customer: &Customer,
    ) -> Result<(), sqlx::Error> {
        let norm_phone =
            normalize_tz_phone(&customer.phone).unwrap_or_else(|| customer.phone.clone());
        sqlx::query(
            r#"
            INSERT INTO customer (
                id, workspace_id, branch_id, full_name, phone, email,
                outstanding_balance, notes, dob, sex, blood_group, allergies,
                chronic_conditions, current_medications, emergency_contact,
                ward_district, pharmacy_notes, archived_at, amob_patient_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
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

    pub async fn update(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        customer: &Customer,
    ) -> Result<(), sqlx::Error> {
        let norm_phone =
            normalize_tz_phone(&customer.phone).unwrap_or_else(|| customer.phone.clone());
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
            "#,
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

#[cfg(test)]
mod tests {
    use super::*;

    async fn setup_test_pool() -> SqlitePool {
        crate::db::init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to initialize test pool")
    }

    #[tokio::test]
    async fn test_customer_repo_create_list_and_workspace_isolation() {
        let pool = setup_test_pool().await;

        let cust1 = Customer {
            id: "cust_1".to_string(),
            workspace_id: "ws_1".to_string(),
            branch_id: "br_1".to_string(),
            created_at: "2026-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
            full_name: "Baraka Mussa".to_string(),
            phone: "+255712345678".to_string(),
            email: Some("baraka@example.com".to_string()),
            outstanding_balance: 5000,
            notes: Some("VIP Customer".to_string()),
            dob: None,
            sex: Some("male".to_string()),
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

        CustomerRepository::create(&pool, &cust1)
            .await
            .expect("Failed to create customer");

        // List in ws_1
        let list_ws1 = CustomerRepository::list(&pool, "ws_1")
            .await
            .expect("Failed to list customers in ws_1");
        assert_eq!(list_ws1.len(), 1);
        assert_eq!(list_ws1[0].full_name, "Baraka Mussa");
        assert_eq!(list_ws1[0].outstanding_balance, 5000);

        // Workspace isolation check: list in ws_2 should return 0
        let list_ws2 = CustomerRepository::list(&pool, "ws_2")
            .await
            .expect("Failed to list customers in ws_2");
        assert_eq!(list_ws2.len(), 0);

        // Lookup by ID with wrong workspace returns None
        let fetched_wrong_ws = CustomerRepository::get_by_id(&pool, "ws_2", "cust_1")
            .await
            .expect("Failed get_by_id query");
        assert!(fetched_wrong_ws.is_none());

        // Lookup by ID with correct workspace returns customer
        let fetched_correct_ws = CustomerRepository::get_by_id(&pool, "ws_1", "cust_1")
            .await
            .expect("Failed get_by_id query");
        assert!(fetched_correct_ws.is_some());
        assert_eq!(fetched_correct_ws.unwrap().email.as_deref(), Some("baraka@example.com"));
    }

    #[tokio::test]
    async fn test_customer_repo_update_and_phone_normalization() {
        let pool = setup_test_pool().await;

        let mut cust = Customer {
            id: "cust_2".to_string(),
            workspace_id: "ws_1".to_string(),
            branch_id: "br_1".to_string(),
            created_at: "2026-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
            full_name: "Amina Salum".to_string(),
            phone: "0754123456".to_string(),
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

        CustomerRepository::create(&pool, &cust).await.unwrap();

        // Verify phone normalized to +255 format
        let found = CustomerRepository::find_by_workspace_and_phone(&pool, "ws_1", "+255754123456", None)
            .await
            .unwrap();
        assert!(found.is_some());
        assert_eq!(found.unwrap().full_name, "Amina Salum");

        // Update customer
        cust.outstanding_balance = 12000;
        cust.notes = Some("Updated notes".to_string());
        cust.archived_at = Some("2026-02-01T00:00:00Z".to_string());

        CustomerRepository::update(&pool, &cust).await.unwrap();

        let updated = CustomerRepository::get_by_id(&pool, "ws_1", "cust_2")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(updated.outstanding_balance, 12000);
        assert_eq!(updated.notes.as_deref(), Some("Updated notes"));
        assert_eq!(updated.archived_at.as_deref(), Some("2026-02-01T00:00:00Z"));
    }
}
