use crate::models::integrations::{CollaboratorRef, IntegrationsConfig, UpdateIntegrationsPayload};
use sqlx::SqlitePool;

pub struct IntegrationsRepository;

impl IntegrationsRepository {
    pub async fn get(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
    ) -> Result<IntegrationsConfig, sqlx::Error> {
        let row = sqlx::query(
            r#"
            SELECT id, workspace_id, branch_id, email_connected, email_address,
                   whatsapp_connected, whatsapp_number, web_apps_connected,
                   mobile_phone, collaborators, created_at, updated_at
            FROM integrations_config
            WHERE workspace_id = ?
            LIMIT 1
            "#,
        )
        .bind(workspace_id)
        .fetch_optional(pool)
        .await?;

        if let Some(r) = row {
            use sqlx::Row;
            let id: String = r.get("id");
            let ws_id: String = r.get("workspace_id");
            let br_id: String = r.get("branch_id");
            let email_connected: i64 = r.get("email_connected");
            let email_address: Option<String> = r.get("email_address");
            let whatsapp_connected: i64 = r.get("whatsapp_connected");
            let whatsapp_number: Option<String> = r.get("whatsapp_number");
            let web_apps_json: String = r.get("web_apps_connected");
            let mobile_phone: Option<String> = r.get("mobile_phone");
            let collab_json: String = r.get("collaborators");
            let created_at: String = r.get("created_at");
            let updated_at: String = r.get("updated_at");

            let web_apps_connected: Vec<String> =
                serde_json::from_str(&web_apps_json).unwrap_or_default();
            let collaborators: Vec<CollaboratorRef> =
                serde_json::from_str(&collab_json).unwrap_or_default();

            Ok(IntegrationsConfig {
                id,
                workspace_id: ws_id,
                branch_id: br_id,
                email_connected: email_connected != 0,
                email_address,
                whatsapp_connected: whatsapp_connected != 0,
                whatsapp_number,
                web_apps_connected,
                mobile_phone,
                collaborators,
                created_at,
                updated_at,
            })
        } else {
            // Seed initial integrations config row
            let now = chrono::Utc::now().to_rfc3339();
            let id = format!("int_cfg_{}", uuid::Uuid::new_v4());
            let default_web_apps =
                serde_json::to_string(&vec!["Web App".to_string(), "Admin Portal".to_string()])
                    .unwrap_or_else(|_| "[]".into());
            let default_collabs = serde_json::to_string(&Vec::<CollaboratorRef>::new())
                .unwrap_or_else(|_| "[]".into());

            sqlx::query(
                r#"
                INSERT INTO integrations_config (
                    id, workspace_id, branch_id, email_connected, email_address,
                    whatsapp_connected, whatsapp_number, web_apps_connected,
                    mobile_phone, collaborators, created_at, updated_at
                ) VALUES (?, ?, ?, 1, 'notifications@40labs.health', 1, '+255 715 000 222', ?, '+255 715 000 111', ?, ?, ?)
                "#
            )
            .bind(&id)
            .bind(workspace_id)
            .bind(branch_id)
            .bind(&default_web_apps)
            .bind(&default_collabs)
            .bind(&now)
            .bind(&now)
            .execute(pool)
            .await?;

            Ok(IntegrationsConfig {
                id,
                workspace_id: workspace_id.to_string(),
                branch_id: branch_id.to_string(),
                email_connected: true,
                email_address: Some("notifications@40labs.health".to_string()),
                whatsapp_connected: true,
                whatsapp_number: Some("+255 715 000 222".to_string()),
                web_apps_connected: vec!["Web App".to_string(), "Admin Portal".to_string()],
                mobile_phone: Some("+255 715 000 111".to_string()),
                collaborators: vec![],
                created_at: now.clone(),
                updated_at: now,
            })
        }
    }

    pub async fn update(
        pool: &SqlitePool,
        workspace_id: &str,
        branch_id: &str,
        payload: UpdateIntegrationsPayload,
    ) -> Result<IntegrationsConfig, sqlx::Error> {
        let current = Self::get(pool, workspace_id, branch_id).await?;

        let email_conn = payload.email_connected.unwrap_or(current.email_connected);
        let email_addr = payload.email_address.or(current.email_address);
        let wa_conn = payload
            .whatsapp_connected
            .unwrap_or(current.whatsapp_connected);
        let wa_num = payload.whatsapp_number.or(current.whatsapp_number);
        let web_apps = payload
            .web_apps_connected
            .unwrap_or(current.web_apps_connected);
        let mob_phone = payload.mobile_phone.or(current.mobile_phone);
        let collabs = payload.collaborators.unwrap_or(current.collaborators);

        let web_apps_json = serde_json::to_string(&web_apps).unwrap_or_else(|_| "[]".into());
        let collabs_json = serde_json::to_string(&collabs).unwrap_or_else(|_| "[]".into());
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            UPDATE integrations_config
            SET email_connected = ?, email_address = ?, whatsapp_connected = ?,
                whatsapp_number = ?, web_apps_connected = ?, mobile_phone = ?,
                collaborators = ?, updated_at = ?
            WHERE workspace_id = ? AND id = ?
            "#,
        )
        .bind(if email_conn { 1 } else { 0 })
        .bind(&email_addr)
        .bind(if wa_conn { 1 } else { 0 })
        .bind(&wa_num)
        .bind(&web_apps_json)
        .bind(&mob_phone)
        .bind(&collabs_json)
        .bind(&now)
        .bind(workspace_id)
        .bind(&current.id)
        .execute(pool)
        .await?;

        Ok(IntegrationsConfig {
            id: current.id,
            workspace_id: workspace_id.to_string(),
            branch_id: current.branch_id,
            email_connected: email_conn,
            email_address: email_addr,
            whatsapp_connected: wa_conn,
            whatsapp_number: wa_num,
            web_apps_connected: web_apps,
            mobile_phone: mob_phone,
            collaborators: collabs,
            created_at: current.created_at,
            updated_at: now,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_db_pool_with_url;

    #[tokio::test]
    async fn test_integrations_config_get_and_update() {
        let pool = init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to initialize DB pool");

        let cfg = IntegrationsRepository::get(&pool, "ws_test_int", "br_test_int")
            .await
            .expect("Failed to get integrations config");

        assert!(cfg.email_connected);
        assert_eq!(cfg.workspace_id, "ws_test_int");

        let updated = IntegrationsRepository::update(
            &pool,
            "ws_test_int",
            "br_test_int",
            UpdateIntegrationsPayload {
                email_connected: Some(false),
                email_address: Some("custom@40labs.tz".to_string()),
                whatsapp_connected: None,
                whatsapp_number: None,
                web_apps_connected: Some(vec!["Portal".to_string()]),
                mobile_phone: None,
                collaborators: Some(vec![CollaboratorRef {
                    user_id: "user_collab_1".to_string(),
                    full_name: "Amina Juma".to_string(),
                    scope: "manage".to_string(),
                }]),
            },
        )
        .await
        .expect("Failed to update integrations config");

        assert!(!updated.email_connected);
        assert_eq!(updated.email_address, Some("custom@40labs.tz".to_string()));
        assert_eq!(updated.web_apps_connected, vec!["Portal".to_string()]);
        assert_eq!(updated.collaborators.len(), 1);
        assert_eq!(updated.collaborators[0].full_name, "Amina Juma");
    }
}
