use sqlx::SqlitePool;
use crate::models::purchases::{PurchaseOrder, PurchaseOrderLine, Supplier};

#[derive(Debug, sqlx::FromRow)]
struct PORow {
    id: String,
    workspace_id: String,
    branch_id: String,
    supplier_id: String,
    status: String,
    total_cost: i64,
    approved_by_user_id: Option<String>,
    submitted_at: Option<String>,
    created_at: String,
    updated_at: String,
}

pub struct PurchasesRepository;

impl PurchasesRepository {
    pub async fn list_suppliers(pool: &SqlitePool, workspace_id: &str) -> Result<Vec<Supplier>, sqlx::Error> {
        sqlx::query_as::<_, Supplier>(
            "SELECT * FROM supplier WHERE workspace_id = ? ORDER BY created_at DESC"
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn list_purchase_orders(pool: &SqlitePool, workspace_id: &str) -> Result<Vec<PurchaseOrder>, sqlx::Error> {
        let rows = sqlx::query_as::<_, PORow>(
            "SELECT * FROM purchase_order WHERE workspace_id = ? ORDER BY created_at DESC"
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await?;

        let mut orders = Vec::new();
        for r in rows {
            let lines = sqlx::query_as::<_, PurchaseOrderLine>(
                "SELECT * FROM purchase_order_line WHERE purchase_order_id = ?"
            )
            .bind(&r.id)
            .fetch_all(pool)
            .await?;

            orders.push(PurchaseOrder {
                id: r.id,
                workspace_id: r.workspace_id,
                branch_id: r.branch_id,
                supplier_id: r.supplier_id,
                status: r.status,
                lines,
                total_cost: r.total_cost,
                approved_by_user_id: r.approved_by_user_id,
                submitted_at: r.submitted_at,
                created_at: r.created_at,
                updated_at: r.updated_at,
            });
        }

        Ok(orders)
    }
}
