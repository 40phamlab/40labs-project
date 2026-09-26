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
    ) -> Result<Sale, String> {
        let now = Utc::now().to_rfc3339();
        let sale_id = format!("sale_{}", Uuid::new_v4().simple());

        let lines: Vec<SaleLine> = req
            .lines
            .into_iter()
            .enumerate()
            .map(|(i, line_input)| SaleLine {
                id: format!("saleline_{}_{}", Uuid::new_v4().simple(), i),
                sale_id: sale_id.clone(),
                inventory_item_id: line_input.inventory_item_id,
                medicine_name: line_input.medicine_name,
                quantity: line_input.quantity,
                unit_price: line_input.unit_price,
                subtotal: line_input.subtotal,
            })
            .collect();

        let subtotal: i64 = lines.iter().map(|l| l.subtotal).sum();
        let grand_total = (subtotal - req.discount_amount).max(0);

        let sale = Sale {
            id: sale_id,
            workspace_id: DEFAULT_WORKSPACE_ID.to_string(),
            branch_id: DEFAULT_BRANCH_ID.to_string(),
            created_at: now.clone(),
            updated_at: now,
            customer_id: req.customer_id,
            lines,
            payment_method: req.payment_method,
            discount_amount: req.discount_amount,
            discount_authorized_by_user_id: if req.discount_amount > 0 {
                Some("user_001".to_string())
            } else {
                None
            },
            tax_amount: 0,
            grand_total,
            currency: "TZS".to_string(),
            synced_at: None,
        };

        SalesRepository::create_sale(pool, &sale)
            .await
            .map_err(|e| format!("Failed to create sale: {}", e))?;

        Ok(sale)
    }
}
