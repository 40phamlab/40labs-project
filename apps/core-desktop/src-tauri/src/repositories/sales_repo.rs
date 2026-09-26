use sqlx::SqlitePool;
use crate::models::sales::{Sale, SaleLine};

#[derive(Debug, sqlx::FromRow)]
struct SaleRow {
    id: String,
    workspace_id: String,
    branch_id: String,
    customer_id: Option<String>,
    payment_method: String,
    discount_amount: i64,
    discount_authorized_by_user_id: Option<String>,
    tax_amount: i64,
    grand_total: i64,
    currency: String,
    synced_at: Option<String>,
    created_at: String,
    updated_at: String,
}

pub struct SalesRepository;

impl SalesRepository {
    pub async fn list_sales(pool: &SqlitePool) -> Result<Vec<Sale>, sqlx::Error> {
        let sales_records = sqlx::query_as::<_, SaleRow>(
            "SELECT id, workspace_id, branch_id, customer_id, payment_method, discount_amount, discount_authorized_by_user_id, tax_amount, grand_total, currency, synced_at, created_at, updated_at FROM sale ORDER BY created_at DESC"
        )
        .fetch_all(pool)
        .await?;

        let mut sales = Vec::new();
        for r in sales_records {
            let lines = sqlx::query_as::<_, SaleLine>(
                "SELECT * FROM sale_line WHERE sale_id = ?"
            )
            .bind(&r.id)
            .fetch_all(pool)
            .await?;

            sales.push(Sale {
                id: r.id,
                workspace_id: r.workspace_id,
                branch_id: r.branch_id,
                created_at: r.created_at,
                updated_at: r.updated_at,
                customer_id: r.customer_id,
                lines,
                payment_method: r.payment_method,
                discount_amount: r.discount_amount,
                discount_authorized_by_user_id: r.discount_authorized_by_user_id,
                tax_amount: r.tax_amount,
                grand_total: r.grand_total,
                currency: r.currency,
                synced_at: r.synced_at,
            });
        }

        Ok(sales)
    }

    pub async fn create_sale(pool: &SqlitePool, sale: &Sale) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO sale (
                id, workspace_id, branch_id, customer_id, payment_method, discount_amount,
                discount_authorized_by_user_id, tax_amount, grand_total, currency, synced_at,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&sale.id)
        .bind(&sale.workspace_id)
        .bind(&sale.branch_id)
        .bind(&sale.customer_id)
        .bind(&sale.payment_method)
        .bind(sale.discount_amount)
        .bind(&sale.discount_authorized_by_user_id)
        .bind(sale.tax_amount)
        .bind(sale.grand_total)
        .bind(&sale.currency)
        .bind(&sale.synced_at)
        .bind(&sale.created_at)
        .bind(&sale.updated_at)
        .execute(pool)
        .await?;

        for line in &sale.lines {
            sqlx::query(
                r#"
                INSERT INTO sale_line (
                    id, sale_id, inventory_item_id, medicine_name, quantity, unit_price, subtotal
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                "#
            )
            .bind(&line.id)
            .bind(&line.sale_id)
            .bind(&line.inventory_item_id)
            .bind(&line.medicine_name)
            .bind(line.quantity)
            .bind(line.unit_price)
            .bind(line.subtotal)
            .execute(pool)
            .await?;
        }

        Ok(())
    }
}
