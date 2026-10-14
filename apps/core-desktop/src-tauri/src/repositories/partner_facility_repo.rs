use crate::models::partner_facility::{PartnerFacility, PartnerFacilityContacts, FacilityType, FacilityStatus};
use sqlx::SqlitePool;

pub struct PartnerFacilityRepository;

impl PartnerFacilityRepository {
    pub async fn list(pool: &SqlitePool, workspace_id: &str, branch_id: &str) -> Result<Vec<PartnerFacility>, sqlx::Error> {
        let rows = sqlx::query(
            r#"
            SELECT id, workspace_id, branch_id, partner_business_id, name, type,
                   contact_mobile, contact_whatsapp, region, district, status, created_at, updated_at
            FROM partner_facility
            WHERE workspace_id = ? AND branch_id = ?
            ORDER BY created_at DESC
            "#,
        )
        .bind(workspace_id)
        .bind(branch_id)
        .fetch_all(pool)
        .await?;

        let mut results = Vec::new();
        for r in rows {
            use sqlx::Row;
            let id: String = r.get("id");
            let ws: String = r.get("workspace_id");
            let br: String = r.get("branch_id");
            let partner_business_id: Option<String> = r.get("partner_business_id");
            let name: String = r.get("name");
            let f_type: String = r.get("type");
            let contact_mobile: Option<String> = r.get("contact_mobile");
            let contact_whatsapp: Option<String> = r.get("contact_whatsapp");
            let region: String = r.get("region");
            let district: String = r.get("district");
            let status: String = r.get("status");
            let created_at: String = r.get("created_at");
            let updated_at: String = r.get("updated_at");

            let is_linked = partner_business_id.is_some() && !partner_business_id.as_deref().unwrap_or("").is_empty();

            results.push(PartnerFacility {
                id,
                workspace_id: ws,
                branch_id: br,
                partner_business_id,
                name,
                r#type: match f_type.as_str() {
                    "clinic" => FacilityType::Clinic,
                    "hospital" => FacilityType::Hospital,
                    "lab" => FacilityType::Lab,
                    "other" => FacilityType::Other,
                    _ => FacilityType::Pharmacy,
                },
                contacts: PartnerFacilityContacts {
                    mobile: contact_mobile,
                    whatsapp: contact_whatsapp,
                },
                region,
                district,
                status: match status.as_str() {
                    "blocked" => FacilityStatus::Blocked,
                    _ => FacilityStatus::Active,
                },
                is_40labs_linked: is_linked,
                created_at,
                updated_at,
            });
        }
        Ok(results)
    }

    pub async fn create(pool: &SqlitePool, facility: &PartnerFacility) -> Result<(), sqlx::Error> {
        let f_type = match facility.r#type {
            FacilityType::Clinic => "clinic",
            FacilityType::Hospital => "hospital",
            FacilityType::Lab => "lab",
            FacilityType::Other => "other",
            FacilityType::Pharmacy => "pharmacy",
        };
        let status = match facility.status {
            FacilityStatus::Blocked => "blocked",
            FacilityStatus::Active => "active",
        };

        sqlx::query(
            r#"
            INSERT INTO partner_facility (
                id, workspace_id, branch_id, partner_business_id, name, type,
                contact_mobile, contact_whatsapp, region, district, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&facility.id)
        .bind(&facility.workspace_id)
        .bind(&facility.branch_id)
        .bind(&facility.partner_business_id)
        .bind(&facility.name)
        .bind(f_type)
        .bind(&facility.contacts.mobile)
        .bind(&facility.contacts.whatsapp)
        .bind(&facility.region)
        .bind(&facility.district)
        .bind(status)
        .bind(&facility.created_at)
        .bind(&facility.updated_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn update_status(pool: &SqlitePool, id: &str, status: &str) -> Result<(), sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("UPDATE partner_facility SET status = ?, updated_at = ? WHERE id = ?")
            .bind(status)
            .bind(&now)
            .bind(id)
            .execute(pool)
            .await?;
        Ok(())
    }

    pub async fn delete(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM partner_facility WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;
        Ok(())
    }
}
