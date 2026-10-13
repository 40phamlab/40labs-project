use sqlx::{SqlitePool, SqliteConnection};
use crate::models::business::Business;

pub struct BusinessRepository;

impl BusinessRepository {
    pub async fn get(pool: &SqlitePool) -> Result<Option<Business>, sqlx::Error> {
        // Since business table has rows, fetch first row
        // Note: Business model in packages/types/business.ts maps business fields.
        // Let's implement robust raw queries or fetch_optional.
        let row = sqlx::query(
            r#"
            SELECT id, workspace_id, branch_id, business_id, name, tin, tmda_number,
                   role_scopes, tier, contact_mobile, contact_email, contact_whatsapp,
                   address_region, address_district, address_place, logo_url, appearance_mode,
                   owner_id, onboarding_state, business_type, country, address_ward, address_street,
                   address_area, latitude, longitude, lipa_namba, payment_number, declared_branch_count,
                   terms_version, terms_locale, terms_text_sha256, terms_accepted_at, terms_accepted_by_user_id,
                   scale, idle_lock_minutes, created_at, updated_at
            FROM business
            LIMIT 1
            "#,
        )
        .fetch_optional(pool)
        .await?;

        if let Some(r) = row {
            use sqlx::Row;
            let business_id: String = r.get("business_id");
            let name: String = r.get("name");
            let tin: Option<String> = r.get("tin");
            let tmda_number: Option<String> = r.get("tmda_number");
            let role_scopes_json: String = r.get("role_scopes");
            let role_scopes: Vec<String> = serde_json::from_str(&role_scopes_json).unwrap_or_default();
            let tier: String = r.get("tier");
            let contact_mobile: String = r.get("contact_mobile");
            let contact_email: Option<String> = r.get("contact_email");
            let contact_whatsapp: Option<String> = r.get("contact_whatsapp");
            let address_region: Option<String> = r.get("address_region");
            let address_district: Option<String> = r.get("address_district");
            let address_place: Option<String> = r.get("address_place");
            let logo_url: Option<String> = r.get("logo_url");
            let appearance_mode: String = r.get("appearance_mode");
            let owner_id: Option<String> = r.get("owner_id");
            let onboarding_state: Option<String> = r.get("onboarding_state");
            let business_type: Option<String> = r.get("business_type");
            let country: Option<String> = r.get("country");
            let address_ward: Option<String> = r.get("address_ward");
            let address_street: Option<String> = r.get("address_street");
            let address_area: Option<String> = r.get("address_area");
            let latitude: Option<f64> = r.get("latitude");
            let longitude: Option<f64> = r.get("longitude");
            let lipa_namba: Option<String> = r.get("lipa_namba");
            let payment_number: Option<String> = r.get("payment_number");
            let declared_branch_count: Option<i64> = r.get("declared_branch_count");
            let scale: Option<String> = r.get("scale");
            let terms_version: Option<String> = r.get("terms_version");
            let terms_locale: Option<String> = r.get("terms_locale");
            let terms_text_sha256: Option<String> = r.get("terms_text_sha256");
            let terms_accepted_at: Option<String> = r.get("terms_accepted_at");
            let terms_accepted_by_user_id: Option<String> = r.get("terms_accepted_by_user_id");
            let idle_lock_minutes: i64 = r.get("idle_lock_minutes");
            let id: String = r.get("id");
            let workspace_id: String = r.get("workspace_id");
            let branch_id: String = r.get("branch_id");
            let created_at: String = r.get("created_at");
            let updated_at: String = r.get("updated_at");

            Ok(Some(Business {
                id,
                workspace_id,
                branch_id,
                business_id,
                name,
                tin,
                tmda_number,
                role_scopes: role_scopes.iter().map(|s| match s.as_str() {
                    "lab" => crate::models::business::BusinessRoleScope::Lab,
                    "supplier" => crate::models::business::BusinessRoleScope::Supplier,
                    _ => crate::models::business::BusinessRoleScope::Pharmacy,
                }).collect(),
                tier: match tier.as_str() {
                    "class_1" => crate::models::business::PricingTier::Class1,
                    "class_2" => crate::models::business::PricingTier::Class2,
                    "class_3" => crate::models::business::PricingTier::Class3,
                    "class_4_enterprise" => crate::models::business::PricingTier::Class4Enterprise,
                    _ => crate::models::business::PricingTier::Free,
                },
                contacts: crate::models::business::BusinessContacts {
                    mobile: contact_mobile,
                    email: contact_email,
                    whatsapp: contact_whatsapp,
                },
                address: crate::models::business::BusinessAddress {
                    region: address_region.unwrap_or_default(),
                    district: address_district.unwrap_or_default(),
                    place: address_place.unwrap_or_default(),
                },
                logo_url,
                appearance_mode: if appearance_mode == "dark" {
                    crate::models::business::AppearanceMode::Dark
                } else {
                    crate::models::business::AppearanceMode::Light
                },
                owner_id,
                onboarding_state: match onboarding_state.as_deref() {
                    Some("owner_first_login") => Some(crate::models::business::OnboardingState::OwnerFirstLogin),
                    Some("setup_complete") => Some(crate::models::business::OnboardingState::SetupComplete),
                    _ => Some(crate::models::business::OnboardingState::Registered),
                },
                business_type,
                country,
                address_ward,
                address_street,
                address_area,
                latitude,
                longitude,
                lipa_namba,
                payment_number,
                declared_branch_count: declared_branch_count.map(|c| c as i32),
                terms_version,
                terms_locale,
                terms_text_sha256,
                terms_accepted_at,
                terms_accepted_by_user_id,
                scale,
                idle_lock_minutes: idle_lock_minutes as i32,
                created_at,
                updated_at,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn update_business_profile(
        pool: &SqlitePool,
        name: Option<&str>,
        tin: Option<Option<&str>>,
        tmda_number: Option<Option<&str>>,
        contact_mobile: Option<&str>,
        contact_email: Option<Option<&str>>,
        contact_whatsapp: Option<Option<&str>>,
        address_region: Option<&str>,
        address_district: Option<&str>,
        address_place: Option<&str>,
        logo_url: Option<Option<&str>>,
        lipa_namba: Option<Option<&str>>,
        payment_number: Option<Option<&str>>,
        appearance_mode: Option<&str>,
    ) -> Result<Option<Business>, sqlx::Error> {
        let existing = Self::get(pool).await?;
        if existing.is_none() {
            return Ok(None);
        }
        let now = chrono::Utc::now().to_rfc3339();

        if let Some(n) = name {
            sqlx::query("UPDATE business SET name = ?, updated_at = ?").bind(n).bind(&now).execute(pool).await?;
        }
        if let Some(t) = tin {
            sqlx::query("UPDATE business SET tin = ?, updated_at = ?").bind(t).bind(&now).execute(pool).await?;
        }
        if let Some(tmda) = tmda_number {
            sqlx::query("UPDATE business SET tmda_number = ?, updated_at = ?").bind(tmda).bind(&now).execute(pool).await?;
        }
        if let Some(m) = contact_mobile {
            sqlx::query("UPDATE business SET contact_mobile = ?, updated_at = ?").bind(m).bind(&now).execute(pool).await?;
        }
        if let Some(e) = contact_email {
            sqlx::query("UPDATE business SET contact_email = ?, updated_at = ?").bind(e).bind(&now).execute(pool).await?;
        }
        if let Some(w) = contact_whatsapp {
            sqlx::query("UPDATE business SET contact_whatsapp = ?, updated_at = ?").bind(w).bind(&now).execute(pool).await?;
        }
        if let Some(r) = address_region {
            sqlx::query("UPDATE business SET address_region = ?, updated_at = ?").bind(r).bind(&now).execute(pool).await?;
        }
        if let Some(d) = address_district {
            sqlx::query("UPDATE business SET address_district = ?, updated_at = ?").bind(d).bind(&now).execute(pool).await?;
        }
        if let Some(p) = address_place {
            sqlx::query("UPDATE business SET address_place = ?, updated_at = ?").bind(p).bind(&now).execute(pool).await?;
        }
        if let Some(l) = logo_url {
            sqlx::query("UPDATE business SET logo_url = ?, updated_at = ?").bind(l).bind(&now).execute(pool).await?;
        }
        if let Some(ln) = lipa_namba {
            sqlx::query("UPDATE business SET lipa_namba = ?, updated_at = ?").bind(ln).bind(&now).execute(pool).await?;
        }
        if let Some(pn) = payment_number {
            sqlx::query("UPDATE business SET payment_number = ?, updated_at = ?").bind(pn).bind(&now).execute(pool).await?;
        }
        if let Some(app_mode) = appearance_mode {
            sqlx::query("UPDATE business SET appearance_mode = ?, updated_at = ?").bind(app_mode).bind(&now).execute(pool).await?;
        }

        Self::get(pool).await
    }

    pub async fn update_onboarding_state(conn: &mut SqliteConnection, state: &str, updated_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE business SET onboarding_state = ?, updated_at = ?")
            .bind(state)
            .bind(updated_at)
            .execute(conn)
            .await?;
        Ok(())
    }

    pub async fn update_idle_lock(conn: &mut SqliteConnection, minutes: i32, updated_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE business SET idle_lock_minutes = ?, updated_at = ?")
            .bind(minutes)
            .bind(updated_at)
            .execute(conn)
            .await?;
        Ok(())
    }

    pub async fn update_payment(conn: &mut SqliteConnection, lipa_namba: Option<&str>, payment_number: Option<&str>, updated_at: &str) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE business SET lipa_namba = ?, payment_number = ?, updated_at = ?")
            .bind(lipa_namba)
            .bind(payment_number)
            .bind(updated_at)
            .execute(conn)
            .await?;
        Ok(())
    }

    pub async fn create(conn: &mut SqliteConnection, business: &Business) -> Result<(), sqlx::Error> {
        let scopes_json = serde_json::to_string(&business.role_scopes).unwrap_or_else(|_| "[\"pharmacy\"]".into());
        let tier_str = match business.tier {
            crate::models::business::PricingTier::Class1 => "class_1",
            crate::models::business::PricingTier::Class2 => "class_2",
            crate::models::business::PricingTier::Class3 => "class_3",
            crate::models::business::PricingTier::Class4Enterprise => "class_4_enterprise",
            _ => "free",
        };
        let app_mode = match business.appearance_mode {
            crate::models::business::AppearanceMode::Dark => "dark",
            _ => "light",
        };

        sqlx::query(
            r#"
            INSERT INTO business (
                id, workspace_id, branch_id, business_id, name, tin, tmda_number,
                role_scopes, tier, contact_mobile, contact_email, contact_whatsapp,
                address_region, address_district, address_place, logo_url, appearance_mode,
                owner_id, onboarding_state, business_type, country, address_ward, address_street,
                address_area, latitude, longitude, lipa_namba, payment_number, declared_branch_count,
                scale, idle_lock_minutes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&business.id)
        .bind(&business.workspace_id)
        .bind(&business.branch_id)
        .bind(&business.business_id)
        .bind(&business.name)
        .bind(&business.tin)
        .bind(&business.tmda_number)
        .bind(&scopes_json)
        .bind(tier_str)
        .bind(&business.contacts.mobile)
        .bind(&business.contacts.email)
        .bind(&business.contacts.whatsapp)
        .bind(&business.address.region)
        .bind(&business.address.district)
        .bind(&business.address.place)
        .bind(&business.logo_url)
        .bind(app_mode)
        .bind(&business.owner_id)
        .bind(match business.onboarding_state {
            Some(crate::models::business::OnboardingState::OwnerFirstLogin) => "owner_first_login",
            Some(crate::models::business::OnboardingState::SetupComplete) => "setup_complete",
            _ => "registered",
        })
        .bind(&business.business_type)
        .bind(business.country.as_deref().unwrap_or("TZ"))
        .bind(&business.address_ward)
        .bind(&business.address_street)
        .bind(&business.address_area)
        .bind(business.latitude)
        .bind(business.longitude)
        .bind(&business.lipa_namba)
        .bind(&business.payment_number)
        .bind(business.declared_branch_count)
        .bind(&business.scale)
        .bind(business.idle_lock_minutes)
        .bind(&business.created_at)
        .bind(&business.updated_at)
        .execute(conn)
        .await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_db_pool_with_url;
    use crate::models::business::{BusinessContacts, BusinessAddress, AppearanceMode, PricingTier, BusinessRoleScope};

    #[tokio::test]
    async fn test_business_repository_crud() {
        let pool = init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to initialize DB pool");

        let mut tx = pool.begin().await.unwrap();

        let b = Business {
            id: "bus_test_1".to_string(),
            workspace_id: "ws_bus_test".to_string(),
            branch_id: "br_bus_test".to_string(),
            business_id: "BIZ-999".to_string(),
            name: "Initial Pharmacy".to_string(),
            tin: Some("111-222-333".to_string()),
            tmda_number: Some("TMDA/001".to_string()),
            role_scopes: vec![BusinessRoleScope::Pharmacy],
            tier: PricingTier::Free,
            contacts: BusinessContacts {
                mobile: "0700000000".to_string(),
                email: Some("initial@40labs.tz".to_string()),
                whatsapp: None,
            },
            address: BusinessAddress {
                region: "Dar".to_string(),
                district: "Kinondoni".to_string(),
                place: "Makumbusho".to_string(),
            },
            logo_url: None,
            appearance_mode: AppearanceMode::Light,
            owner_id: None,
            onboarding_state: None,
            business_type: None,
            country: Some("TZ".to_string()),
            address_ward: None,
            address_street: None,
            address_area: None,
            latitude: None,
            longitude: None,
            lipa_namba: None,
            payment_number: None,
            declared_branch_count: Some(1),
            terms_version: None,
            terms_locale: None,
            terms_text_sha256: None,
            terms_accepted_at: None,
            terms_accepted_by_user_id: None,
            scale: None,
            idle_lock_minutes: 5,
            created_at: "2026-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
        };

        BusinessRepository::create(&mut *tx, &b).await.unwrap();
        tx.commit().await.unwrap();

        let fetched = BusinessRepository::get(&pool).await.unwrap().expect("Business must exist");
        assert_eq!(fetched.name, "Initial Pharmacy");
        assert_eq!(fetched.contacts.mobile, "0700000000");

        let updated = BusinessRepository::update_business_profile(
            &pool,
            Some("Updated Pharmacy"),
            Some(Some("999-888-777")),
            None,
            Some("0799887766"),
            None,
            None,
            Some("Arusha"),
            None,
            None,
            None,
            Some(Some("554433")),
            Some(Some("+255799887766")),
            Some("dark"),
        )
        .await
        .unwrap()
        .expect("Updated business must exist");

        assert_eq!(updated.name, "Updated Pharmacy");
        assert_eq!(updated.tin, Some("999-888-777".to_string()));
        assert_eq!(updated.contacts.mobile, "0799887766");
        assert_eq!(updated.address.region, "Arusha");
        assert_eq!(updated.lipa_namba, Some("554433".to_string()));
        assert_eq!(updated.appearance_mode, AppearanceMode::Dark);
    }
}
