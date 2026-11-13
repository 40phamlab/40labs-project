use crate::models::branch::Branch;
use sqlx::{SqliteConnection, SqlitePool};

pub struct BranchRepository;

impl BranchRepository {
    pub async fn list(pool: &SqlitePool, workspace_id: &str) -> Result<Vec<Branch>, sqlx::Error> {
        sqlx::query_as::<_, Branch>(
            "SELECT * FROM branch WHERE workspace_id = ? ORDER BY created_at ASC",
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn get_by_id(
        executor: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
        workspace_id: &str,
        id: &str,
    ) -> Result<Option<Branch>, sqlx::Error> {
        sqlx::query_as::<_, Branch>("SELECT * FROM branch WHERE workspace_id = ? AND id = ?")
            .bind(workspace_id)
            .bind(id)
            .fetch_optional(executor)
            .await
    }

    pub async fn create(conn: &mut SqliteConnection, branch: &Branch) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO branch (
                id, workspace_id, branch_id, business_id, name, location,
                district, branch_code, status, contacts, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&branch.id)
        .bind(&branch.workspace_id)
        .bind(&branch.branch_id)
        .bind(&branch.business_id)
        .bind(&branch.name)
        .bind(&branch.location)
        .bind(&branch.district)
        .bind(&branch.branch_code)
        .bind(&branch.status)
        .bind(&branch.contacts)
        .bind(&branch.created_at)
        .bind(&branch.updated_at)
        .execute(&mut *conn)
        .await?;

        Ok(())
    }

    pub async fn update(
        conn: &mut SqliteConnection,
        workspace_id: &str,
        id: &str,
        name: Option<&str>,
        location: Option<&str>,
        district: Option<Option<&str>>,
        status: Option<&str>,
        contacts: Option<Option<&str>>,
        updated_at: &str,
    ) -> Result<Option<Branch>, sqlx::Error> {
        let existing = match Self::get_by_id(&mut *conn, workspace_id, id).await? {
            Some(b) => b,
            None => return Ok(None),
        };

        let new_name = name.unwrap_or(&existing.name);
        let new_location = location
            .map(|s| Some(s.to_string()))
            .unwrap_or(existing.location);
        let new_district = match district {
            Some(opt) => opt.map(|s| s.to_string()),
            None => existing.district,
        };
        let new_status = status.unwrap_or(&existing.status);
        let new_contacts = match contacts {
            Some(opt) => opt.map(|s| s.to_string()),
            None => existing.contacts,
        };

        sqlx::query(
            r#"
            UPDATE branch SET
                name = ?,
                location = ?,
                district = ?,
                status = ?,
                contacts = ?,
                updated_at = ?
            WHERE id = ? AND workspace_id = ?
            "#,
        )
        .bind(new_name)
        .bind(new_location)
        .bind(new_district)
        .bind(new_status)
        .bind(new_contacts)
        .bind(updated_at)
        .bind(id)
        .bind(workspace_id)
        .execute(&mut *conn)
        .await?;

        Self::get_by_id(&mut *conn, workspace_id, id).await
    }
}
