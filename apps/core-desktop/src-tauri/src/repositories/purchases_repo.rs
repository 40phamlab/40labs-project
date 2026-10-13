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

    pub async fn create_purchase_order(
        conn: &mut sqlx::SqliteConnection,
        po: &PurchaseOrder,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO purchase_order (
                id, workspace_id, branch_id, supplier_id, status, total_cost,
                approved_by_user_id, submitted_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&po.id)
        .bind(&po.workspace_id)
        .bind(&po.branch_id)
        .bind(&po.supplier_id)
        .bind(&po.status)
        .bind(po.total_cost)
        .bind(&po.approved_by_user_id)
        .bind(&po.submitted_at)
        .bind(&po.created_at)
        .bind(&po.updated_at)
        .execute(&mut *conn)
        .await?;

        for line in &po.lines {
            sqlx::query(
                r#"
                INSERT INTO purchase_order_line (
                    id, purchase_order_id, medicine_id, quantity, unit_cost
                ) VALUES (?, ?, ?, ?, ?)
                "#,
            )
            .bind(&line.id)
            .bind(&line.purchase_order_id)
            .bind(&line.medicine_id)
            .bind(line.quantity)
            .bind(line.unit_cost)
            .execute(&mut *conn)
            .await?;
        }

        Ok(())
    }

    pub async fn approve_purchase_order(
        pool: &SqlitePool,
        workspace_id: &str,
        id: &str,
        approved_by_user_id: &str,
        now: &str,
    ) -> Result<Option<PurchaseOrder>, sqlx::Error> {
        let res = sqlx::query(
            "UPDATE purchase_order SET status = 'completed', approved_by_user_id = ?, submitted_at = ?, updated_at = ? WHERE workspace_id = ? AND id = ?"
        )
        .bind(approved_by_user_id)
        .bind(now)
        .bind(now)
        .bind(workspace_id)
        .bind(id)
        .execute(pool)
        .await?;

        if res.rows_affected() == 0 {
            return Ok(None);
        }

        Self::get_purchase_order(pool, workspace_id, id).await
    }

    pub async fn get_purchase_order(
        pool: &SqlitePool,
        workspace_id: &str,
        id: &str,
    ) -> Result<Option<PurchaseOrder>, sqlx::Error> {
        let row = sqlx::query_as::<_, PORow>(
            "SELECT * FROM purchase_order WHERE workspace_id = ? AND id = ?"
        )
        .bind(workspace_id)
        .bind(id)
        .fetch_optional(pool)
        .await?;

        if let Some(r) = row {
            let lines = sqlx::query_as::<_, PurchaseOrderLine>(
                "SELECT * FROM purchase_order_line WHERE purchase_order_id = ?"
            )
            .bind(&r.id)
            .fetch_all(pool)
            .await?;

            Ok(Some(PurchaseOrder {
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
            }))
        } else {
            Ok(None)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_db_pool_with_url;

    async fn seed_purchases_prerequisites(pool: &SqlitePool) {
        sqlx::query(
            r#"
            INSERT OR IGNORE INTO app_user (
                id, workspace_id, branch_id, username, first_name, last_name, full_name,
                role, role_preset, active, created_at, updated_at
            ) VALUES (
                'user_po_test', 'ws_po', 'br_po', 'potech', 'PO', 'Tech', 'PO Tech',
                'staff', 'admin', 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
            )
            "#,
        )
        .execute(pool)
        .await
        .unwrap();

        sqlx::query(
            r#"
            INSERT OR IGNORE INTO supplier (
                id, workspace_id, branch_id, business_id, tmda_verified, tra_verified, created_at, updated_at
            ) VALUES (
                'supp_01', 'ws_po', 'br_po', 'biz_supp_01', 1, 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
            )
            "#,
        )
        .execute(pool)
        .await
        .unwrap();

        sqlx::query(
            r#"
            INSERT OR IGNORE INTO medicine (
                id, workspace_id, branch_id, name, generic_name, category, unit, is_controlled_substance, requires_prescription, created_at, updated_at
            ) VALUES (
                'med_po_01', 'ws_po', 'br_po', 'Paracetamol 500mg', 'Acetaminophen', 'Analgesics', 'tablet', 0, 0, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
            )
            "#,
        )
        .execute(pool)
        .await
        .unwrap();
    }

    #[tokio::test]
    async fn test_purchase_order_create_and_approve() {
        let pool = init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to initialize DB pool");

        seed_purchases_prerequisites(&pool).await;

        let po = PurchaseOrder {
            id: "po_test_001".to_string(),
            workspace_id: "ws_po".to_string(),
            branch_id: "br_po".to_string(),
            supplier_id: "supp_01".to_string(),
            status: "draft".to_string(),
            lines: vec![PurchaseOrderLine {
                id: "poline_001".to_string(),
                purchase_order_id: "po_test_001".to_string(),
                medicine_id: "med_po_01".to_string(),
                quantity: 100,
                unit_cost: 300,
            }],
            total_cost: 30000,
            approved_by_user_id: None,
            submitted_at: None,
            created_at: "2026-01-01T10:00:00Z".to_string(),
            updated_at: "2026-01-01T10:00:00Z".to_string(),
        };

        let mut tx = pool.begin().await.unwrap();
        PurchasesRepository::create_purchase_order(&mut *tx, &po)
            .await
            .expect("Failed to create purchase order");
        tx.commit().await.unwrap();

        let pos = PurchasesRepository::list_purchase_orders(&pool, "ws_po")
            .await
            .expect("Failed to list purchase orders");

        assert_eq!(pos.len(), 1);
        assert_eq!(pos[0].id, "po_test_001");
        assert_eq!(pos[0].status, "draft");
        assert_eq!(pos[0].lines.len(), 1);

        let approved = PurchasesRepository::approve_purchase_order(&pool, "ws_po", "po_test_001", "user_po_test", "2026-01-01T11:00:00Z")
            .await
            .expect("Failed to approve PO")
            .expect("PO must exist");

        assert_eq!(approved.status, "completed");
        assert_eq!(approved.approved_by_user_id, Some("user_po_test".to_string()));
    }
}
