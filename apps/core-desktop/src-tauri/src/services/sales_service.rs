use chrono::Utc;
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

use crate::auth::AuthContext;
use crate::models::audit::AuditLogEntry;
use crate::models::inventory::StockAdjustment;
use crate::models::sales::{CreateSaleRequest, FiscalReceipt, Sale, SaleLine};
use crate::repositories::audit_repo::audit;
use crate::repositories::inventory_repo::InventoryRepository;
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
        if req.items.is_empty() {
            return Err("Cannot create a sale with an empty cart".to_string());
        }

        if let Some(ref key) = idempotency_key {
            if let Ok(Some(existing)) =
                SalesRepository::get_by_idempotency_key(pool, &ctx.workspace_id, key).await
            {
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

        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let audit_entry_id = format!("audit_{}", Uuid::new_v4().simple());

        let mut lines = Vec::new();
        for (i, item_input) in req.items.into_iter().enumerate() {
            if item_input.quantity <= 0 {
                return Err("Quantity for each item must be greater than 0".to_string());
            }

            let inv_row = sqlx::query(
                r#"
                SELECT i.sell_price, i.quantity as stock_qty, i.is_deactivated, m.name as medicine_name
                FROM inventory_item i
                JOIN medicine m ON m.id = i.medicine_id
                WHERE i.workspace_id = ? AND i.id = ?
                "#
            )
            .bind(&ctx.workspace_id)
            .bind(&item_input.inventory_item_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| format!("Database error fetching inventory: {}", e))?
            .ok_or_else(|| format!("Inventory item not found: {}", item_input.inventory_item_id))?;

            let sell_price: i64 = inv_row.get("sell_price");
            let stock_qty: i64 = inv_row.get("stock_qty");
            let is_deactivated: bool = inv_row.get("is_deactivated");
            let medicine_name: String = inv_row.get("medicine_name");

            if is_deactivated {
                return Err(format!(
                    "Inventory item '{}' ({}) is deactivated and cannot be sold",
                    medicine_name, item_input.inventory_item_id
                ));
            }

            if stock_qty < item_input.quantity {
                return Err(format!(
                    "Insufficient stock for '{}': available {}, requested {}",
                    medicine_name, stock_qty, item_input.quantity
                ));
            }

            let qty = item_input.quantity;
            let subtotal = sell_price * qty;

            // Deduct stock quantity inside the transaction
            sqlx::query(
                "UPDATE inventory_item SET quantity = quantity - ?, updated_at = ? WHERE workspace_id = ? AND id = ?"
            )
            .bind(qty)
            .bind(&now)
            .bind(&ctx.workspace_id)
            .bind(&item_input.inventory_item_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to update inventory quantity: {}", e))?;

            // Insert stock adjustment audit record
            let adj = StockAdjustment {
                id: format!("adj_{}", Uuid::new_v4().simple()),
                workspace_id: ctx.workspace_id.clone(),
                branch_id: ctx.branch_id.clone(),
                created_at: now.clone(),
                updated_at: now.clone(),
                inventory_item_id: item_input.inventory_item_id.clone(),
                adjusted_by_user_id: ctx.user_id.clone(),
                delta: -qty,
                reason: format!("Sale ID: {}", sale_id),
                audit_log_id: audit_entry_id.clone(),
            };
            InventoryRepository::create_stock_adjustment(&mut *tx, &adj)
                .await
                .map_err(|e| format!("Failed to record stock adjustment: {}", e))?;

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
            idempotency_key: idempotency_key.clone(),
        };

        let audit_entry = AuditLogEntry {
            id: audit_entry_id,
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            action: "sale_create".to_string(),
            performed_by_user_id: Some(ctx.user_id.clone()),
            target_entity_type: "Sale".to_string(),
            target_entity_id: sale_id,
            metadata: Some(
                serde_json::json!({ "grand_total": grand_total, "discount": discount }).to_string(),
            ),
            created_at: now.clone(),
        };
        audit::append(&mut *tx, &audit_entry)
            .await
            .map_err(|e| format!("Audit error: {}", e))?;

        SalesRepository::create_sale(&mut *tx, &sale)
            .await
            .map_err(|e| format!("Failed to create sale: {}", e))?;

        let fiscal_receipt = FiscalReceipt {
            id: format!("fisc_{}", Uuid::new_v4().simple()),
            workspace_id: ctx.workspace_id.clone(),
            branch_id: ctx.branch_id.clone(),
            sale_id: sale.id.clone(),
            fiscal_device_id: Some("EFD_DEV_001".to_string()),
            status: "confirmed".to_string(),
            local_signature: format!("SIG_{}", Uuid::new_v4().simple()),
            tra_receipt_number: Some(format!("TRA_{}", Uuid::new_v4().simple())),
            queued_at: now.clone(),
            submitted_at: Some(now.clone()),
            retry_count: 0,
            buffering_window_hours: None,
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        SalesRepository::create_fiscal_receipt(&mut *tx, &fiscal_receipt)
            .await
            .map_err(|e| format!("Failed to create fiscal receipt: {}", e))?;

        tx.commit().await.map_err(|e| e.to_string())?;

        Ok(sale)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_db_pool_with_url;
    use crate::models::sales::CreateSaleItemInput;

    #[tokio::test]
    async fn test_create_sale_and_fiscal_receipt_persistence() {
        let pool = init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to init in-memory test database");

        let ctx = AuthContext {
            user_id: "user_test_01".to_string(),
            workspace_id: "ws_test_01".to_string(),
            branch_id: "br_test_01".to_string(),
        };

        // Seed user, medicine, inventory item
        sqlx::query(
            "INSERT INTO app_user (id, workspace_id, branch_id, username, first_name, last_name, full_name, role, role_preset, active, created_at, updated_at) VALUES ('user_test_01', 'ws_test_01', 'br_test_01', 'tester', 'Test', 'User', 'Test User', 'staff', 'pharmacist', 1, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')"
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO medicine (id, workspace_id, branch_id, name, generic_name, category, unit, is_controlled_substance, requires_prescription, created_at, updated_at) VALUES ('med_01', 'ws_test_01', 'br_test_01', 'Paracetamol', 'Acetaminophen', 'Analgesics', 'tablet', 0, 0, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')"
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO inventory_item (id, workspace_id, branch_id, medicine_id, batch_number, expiry_date, buy_price, sell_price, quantity, low_stock_threshold, cold_chain_required, is_deactivated, created_at, updated_at) VALUES ('inv_01', 'ws_test_01', 'br_test_01', 'med_01', 'BATCH001', '2026-12-31', 500, 1000, 100, 10, 0, 0, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')"
        )
        .execute(&pool)
        .await
        .unwrap();

        let req = CreateSaleRequest {
            customer_id: None,
            items: vec![CreateSaleItemInput {
                inventory_item_id: "inv_01".to_string(),
                quantity: 2,
            }],
            payment_method: "cash".to_string(),
            discount_amount: Some(0),
            step_up_token: None,
            idempotency_key: Some("key_001".to_string()),
        };

        let sale = SalesService::create_sale(&pool, &ctx, req, None, Some("key_001".to_string()))
            .await
            .expect("create_sale should succeed");

        assert_eq!(sale.grand_total, 2000);
        assert_eq!(sale.lines.len(), 1);

        // Verify stock deducted from 100 to 98
        let updated_qty: (i64,) =
            sqlx::query_as("SELECT quantity FROM inventory_item WHERE id = 'inv_01'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(updated_qty.0, 98);

        // Verify sale appears in list_sales
        let sales_list = SalesRepository::list_sales(&pool, "ws_test_01")
            .await
            .expect("list_sales should succeed");
        assert_eq!(sales_list.len(), 1);
        assert_eq!(sales_list[0].id, sale.id);

        // Verify fiscal receipt appears in list_fiscal_receipts
        let receipts = SalesRepository::list_fiscal_receipts(&pool, "ws_test_01")
            .await
            .expect("list_fiscal_receipts should succeed");
        assert_eq!(receipts.len(), 1);
        assert_eq!(receipts[0].sale_id, sale.id);
        assert_eq!(receipts[0].status, "confirmed");
    }

    #[tokio::test]
    async fn test_insufficient_stock_rollback() {
        let pool = init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to init in-memory test database");

        let ctx = AuthContext {
            user_id: "user_test_01".to_string(),
            workspace_id: "ws_test_01".to_string(),
            branch_id: "br_test_01".to_string(),
        };

        sqlx::query(
            "INSERT INTO app_user (id, workspace_id, branch_id, username, first_name, last_name, full_name, role, role_preset, active, created_at, updated_at) VALUES ('user_test_01', 'ws_test_01', 'br_test_01', 'tester', 'Test', 'User', 'Test User', 'staff', 'pharmacist', 1, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')"
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO medicine (id, workspace_id, branch_id, name, generic_name, category, unit, is_controlled_substance, requires_prescription, created_at, updated_at) VALUES ('med_01', 'ws_test_01', 'br_test_01', 'Paracetamol', 'Acetaminophen', 'Analgesics', 'tablet', 0, 0, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')"
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO inventory_item (id, workspace_id, branch_id, medicine_id, batch_number, expiry_date, buy_price, sell_price, quantity, low_stock_threshold, cold_chain_required, is_deactivated, created_at, updated_at) VALUES ('inv_01', 'ws_test_01', 'br_test_01', 'med_01', 'BATCH001', '2026-12-31', 500, 1000, 5, 10, 0, 0, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')"
        )
        .execute(&pool)
        .await
        .unwrap();

        // Request 10 units when only 5 are available
        let req = CreateSaleRequest {
            customer_id: None,
            items: vec![CreateSaleItemInput {
                inventory_item_id: "inv_01".to_string(),
                quantity: 10,
            }],
            payment_method: "cash".to_string(),
            discount_amount: Some(0),
            step_up_token: None,
            idempotency_key: None,
        };

        let result = SalesService::create_sale(&pool, &ctx, req, None, None).await;
        assert!(
            result.is_err(),
            "Expected create_sale to fail due to insufficient stock"
        );
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Insufficient stock"));

        // Verify inventory quantity remains unchanged (5)
        let qty: (i64,) = sqlx::query_as("SELECT quantity FROM inventory_item WHERE id = 'inv_01'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(qty.0, 5);

        // Verify no sales were inserted
        let sales = SalesRepository::list_sales(&pool, "ws_test_01")
            .await
            .unwrap();
        assert_eq!(sales.len(), 0);
    }

    #[tokio::test]
    async fn test_idempotent_duplicate_sale_prevention() {
        let pool = init_db_pool_with_url("sqlite::memory:")
            .await
            .expect("Failed to init in-memory test database");

        let ctx = AuthContext {
            user_id: "user_test_01".to_string(),
            workspace_id: "ws_test_01".to_string(),
            branch_id: "br_test_01".to_string(),
        };

        sqlx::query(
            "INSERT INTO app_user (id, workspace_id, branch_id, username, first_name, last_name, full_name, role, role_preset, active, created_at, updated_at) VALUES ('user_test_01', 'ws_test_01', 'br_test_01', 'tester', 'Test', 'User', 'Test User', 'staff', 'pharmacist', 1, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')"
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO medicine (id, workspace_id, branch_id, name, generic_name, category, unit, is_controlled_substance, requires_prescription, created_at, updated_at) VALUES ('med_01', 'ws_test_01', 'br_test_01', 'Paracetamol', 'Acetaminophen', 'Analgesics', 'tablet', 0, 0, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')"
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO inventory_item (id, workspace_id, branch_id, medicine_id, batch_number, expiry_date, buy_price, sell_price, quantity, low_stock_threshold, cold_chain_required, is_deactivated, created_at, updated_at) VALUES ('inv_01', 'ws_test_01', 'br_test_01', 'med_01', 'BATCH001', '2026-12-31', 500, 1000, 50, 10, 0, 0, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')"
        )
        .execute(&pool)
        .await
        .unwrap();

        let req = CreateSaleRequest {
            customer_id: None,
            items: vec![CreateSaleItemInput {
                inventory_item_id: "inv_01".to_string(),
                quantity: 2,
            }],
            payment_method: "cash".to_string(),
            discount_amount: Some(0),
            step_up_token: None,
            idempotency_key: Some("idem_key_999".to_string()),
        };

        // First attempt
        let sale1 = SalesService::create_sale(
            &pool,
            &ctx,
            req.clone(),
            None,
            Some("idem_key_999".to_string()),
        )
        .await
        .unwrap();

        // Second attempt with same idempotency key
        let sale2 = SalesService::create_sale(
            &pool,
            &ctx,
            req.clone(),
            None,
            Some("idem_key_999".to_string()),
        )
        .await
        .unwrap();

        // Must return identical sale record
        assert_eq!(sale1.id, sale2.id);

        // Verify stock was only deducted once (50 - 2 = 48)
        let qty: (i64,) = sqlx::query_as("SELECT quantity FROM inventory_item WHERE id = 'inv_01'")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(qty.0, 48);

        // Verify only 1 sale exists in database
        let sales = SalesRepository::list_sales(&pool, "ws_test_01")
            .await
            .unwrap();
        assert_eq!(sales.len(), 1);
    }
}
