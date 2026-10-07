use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::auth::AuthContext;
use crate::models::audit::AuditLogEntry;
use crate::models::sales::{CreateSaleRequest, Sale, SaleLine};
use crate::repositories::audit_repo::audit;
use crate::repositories::sales_repo::SalesRepository;

pub const DISCOUNT_PIN_THRESHOLD: i64 = 0; // TODO: [reason: discount PIN threshold TBD] [phase 1]

pub struct SalesService;

impl SalesService {
    pub async fn create_sale(
        pool: &SqlitePool,
        ctx: &AuthContext,
        req: CreateSaleRequest,
        discount_authorized_by: Option<String>,
        idempotency_key: Option<String>,
    ) -> Result<Sale, String> {
        if let Some(ref key) = idempotency_key {
            if let Ok(Some(existing)) = SalesRepository::get_by_idempotency_key(pool, &ctx.workspace_id, key).await {
                return Ok(existing);
            }
        }

        let discount = req.discount_amount.unwrap_or(0);
        let discount_approver = if discount > DISCOUNT_PIN_THRESHOLD {
            discount_authorized_by.or_else(|| Some(ctx.user_id.clone()))
        } else {
            None
        };

        let now = Utc::now().to_rfc3339();
        let sale_id = format!("sale_{}", Uuid::new_v4().simple());

        let mut lines = Vec::new();
        for (i, item_input) in req.items.into_iter().enumerate() {
            let inv_row = sqlx::query(
                r#"
                SELECT i.sell_price, m.name as medicine_name
                FROM inventory_item i
                JOIN medicine m ON m.id = i.medicine_id
                WHERE i.workspace_id = ? AND i.id = ?
                "#
            )
            .bind(&ctx.workspace_id)
            .bind(&item_input.inventory_item_id)
            .fetch_optional(pool)
            .await
            .map_err(|e| format!("Database error fetching inventory: {}", e))?
            .ok_or_else(|| format!("Inventory item not found: {}", item_input.inventory_item_id))?;

            use sqlx::Row;
            let sell_price: i64 = inv_row.get("sell_price");
            let medicine_name: String = inv_row.get("medicine_name");
            let qty = item_input.quantity;
            let subtotal = sell_price * qty;

            lines.push(SaleLine {
                id: format!("saleline_{}_{}", Uuid::new_v4().simple(), i),
                sale_id: sale_id.clone(),
                inventory_item_id: item_input.inventory_item_id,
                medicine_name,
                quantity: qty,
                unit_price: sell_price,
                subtotal,
            });
        }

        let subtotal_sum: i64 = lines.iter().map(|l| l.subtotal).sum();
        let grand_total = (subtotal_sum - discount).max(0);

        let sale = Sale {
            id: sale_id.clone(),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            created_at: now.clone(),
            updated_at: now.clone(),
            customer_id: req.customer_id,
            lines,
            payment_method: req.payment_method,
            discount_amount: discount,
            discount_authorized_by_user_id: discount_approver,
            tax_amount: 0,
            grand_total,
            currency: "TZS".to_string(),
            synced_at: None,
            idempotency_key,
        };

        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let audit_entry = AuditLogEntry {
            id: format!("audit_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "sale_create".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "Sale".to_string(),
            target_entity_id: sale_id,
            metadata: Some(serde_json::json!({ "grand_total": grand_total, "discount": discount }).to_string()),
            created_at: now,
        };
        audit::append(&mut *tx, &audit_entry)
            .await
            .map_err(|e| format!("Audit error: {}", e))?;

        SalesRepository::create_sale(&mut *tx, &sale)
            .await
            .map_err(|e| format!("Failed to create sale: {}", e))?;

        tx.commit().await.map_err(|e| e.to_string())?;

        Ok(sale)
    }
}
