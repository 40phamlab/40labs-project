use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::models::sales::{CreateSaleRequest, Sale, SaleLine};
use crate::models::{DEFAULT_BRANCH_ID, DEFAULT_WORKSPACE_ID};
use crate::repositories::sales_repo::SalesRepository;

pub struct SalesService;

impl SalesService {
    pub async fn create_sale(
        pool: &SqlitePool,
        req: CreateSaleRequest,
        idempotency_key: Option<String>,
    ) -> Result<Sale, String> {
        if let Some(ref key) = idempotency_key {
            if let Ok(Some(existing)) = SalesRepository::get_by_idempotency_key(pool, key).await {
                return Ok(existing);
            }
        }

        let now = Utc::now().to_rfc3339();
        let sale_id = format!("sale_{}", Uuid::new_v4().simple());

        let mut lines = Vec::new();
        for (i, item_input) in req.items.into_iter().enumerate() {
            // Server-side lookup of sell price and medicine name from inventory item and medicine
            let inv_row = sqlx::query(
                r#"
                SELECT i.sell_price, m.name as medicine_name
                FROM inventory_item i
                JOIN medicine m ON m.id = i.medicine_id
                WHERE i.id = ?
                "#
            )
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
        let discount = req.discount_amount.unwrap_or(0);
        let grand_total = (subtotal_sum - discount).max(0);

        let sale = Sale {
            id: sale_id,
            workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
            branch_id: DEFAULT_BRANCH_ID.to_string(),
            created_at: now.clone(),
            updated_at: now,
            customer_id: req.customer_id,
            lines,
            payment_method: req.payment_method,
            discount_amount: discount,
            discount_authorized_by_user_id: if discount > 0 {
                Some("user_001".to_string())
            } else {
                None
            },
            tax_amount: 0,
            grand_total,
            currency: "TZS".to_string(),
            synced_at: None,
            idempotency_key,
        };

        SalesRepository::create_sale(pool, &sale)
            .await
            .map_err(|e| format!("Failed to create sale: {}", e))?;

        Ok(sale)
    }
}
