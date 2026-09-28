import { describe, test, expect, vi } from 'vitest';
import { getInitialDashboardSummary } from './summary';
import type { Sale, InventoryItem, Medicine, PurchaseOrder } from '@40labs/types';

describe('Dashboard Summary Calculations', () => {
  test('computes profit and monthlyProfit correctly using devData', () => {
    const summary = getInitialDashboardSummary();

    expect(summary.profit).toBeGreaterThanOrEqual(0);
    expect(summary.monthlyProfit).toBeGreaterThanOrEqual(summary.profit);
  });

  test('computes profit dynamically for custom sales and inventory buy prices', () => {
    const fixedNow = new Date('2026-03-31T12:00:00Z');

    const testMedicines: Medicine[] = [
      {
        id: 'med_test_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        name: 'Test Medicine A',
        generic_name: 'Generic A',
        category: 'Analgesic',
        unit: 'pack',
        is_controlled_substance: false,
        requires_prescription: false,
      },
      {
        id: 'med_test_2',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        name: 'Test Medicine B',
        generic_name: 'Generic B',
        category: 'Antibiotic',
        unit: 'pack',
        is_controlled_substance: false,
        requires_prescription: true,
      },
    ];

    const testInventory: InventoryItem[] = [
      {
        id: 'inv_test_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        medicine_id: 'med_test_1',
        batch_number: 'BATCH-1',
        expiry_date: '2027-01-01',
        buy_price: 2000,
        sell_price: 5000,
        quantity: 100,
        low_stock_threshold: 10,
        cold_chain_required: false,
      },
      {
        id: 'inv_test_2',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        medicine_id: 'med_test_2',
        batch_number: 'BATCH-2',
        expiry_date: '2027-01-01',
        buy_price: 4000,
        sell_price: 10000,
        quantity: 50,
        low_stock_threshold: 5,
        cold_chain_required: false,
      },
    ];

    const testSales: Sale[] = [
      {
        id: 'sale_test_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-03-31T09:00:00Z',
        updated_at: '2026-03-31T09:00:00Z',
        customer_id: null,
        lines: [
          {
            id: 'line_1',
            inventory_item_id: 'inv_test_1',
            medicine_id: 'med_test_1',
            quantity: 2,
            unit_price: 5000,
            subtotal: 10000,
            dispensed_by_user_id: 'user_1',
            is_prescription_dispense: false,
          },
          {
            id: 'line_2',
            inventory_item_id: 'inv_test_2',
            medicine_id: 'med_test_2',
            quantity: 1,
            unit_price: 10000,
            subtotal: 10000,
            dispensed_by_user_id: 'user_1',
            is_prescription_dispense: true,
          },
        ],
        payment_method: 'cash',
        discount_amount: 0,
        discount_authorized_by_user_id: null,
        tax_amount: 0,
        grand_total: 20000,
        currency: 'TZS',
        synced_at: null,
      },
    ];

    const summary = getInitialDashboardSummary({
      sales: testSales,
      inventoryItems: testInventory,
      medicines: testMedicines,
      purchaseOrders: [],
      labOrders: [],
      customers: [],
      nowDate: fixedNow,
    });

    expect(summary.profit).toBe(12000);
    expect(summary.monthlyProfit).toBe(12000);
  });

  test('flags when cost_price is unavailable without faking it', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const testSales: Sale[] = [
      {
        id: 'sale_no_cost',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-03-31T10:00:00Z',
        updated_at: '2026-03-31T10:00:00Z',
        customer_id: null,
        lines: [
          {
            id: 'line_missing_inv',
            inventory_item_id: 'non_existent_inv_item',
            medicine_id: 'med_test_1',
            quantity: 5,
            unit_price: 3000,
            subtotal: 15000,
            dispensed_by_user_id: 'user_1',
            is_prescription_dispense: false,
          },
        ],
        payment_method: 'cash',
        discount_amount: 0,
        discount_authorized_by_user_id: null,
        tax_amount: 0,
        grand_total: 15000,
        currency: 'TZS',
        synced_at: null,
      },
    ];

    const summary = getInitialDashboardSummary({
      sales: testSales,
      inventoryItems: [],
      nowDate: new Date('2026-03-31T12:00:00Z'),
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cost price unavailable')
    );
    expect(summary.profit).toBe(0);

    consoleWarnSpy.mockRestore();
  });

  test('computes supplierDebt from unpaid/partial purchase orders', () => {
    const testPOs: PurchaseOrder[] = [
      {
        id: 'po_draft',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-03-01',
        updated_at: '2026-03-01',
        supplier_id: 'sup_1',
        status: 'draft',
        lines: [{ medicine_id: 'med_1', quantity: 10, unit_cost: 1000 }],
        total_cost: 10000,
        approved_by_user_id: null,
        submitted_at: null,
      },
      {
        id: 'po_pending',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-03-02',
        updated_at: '2026-03-02',
        supplier_id: 'sup_2',
        status: 'pending',
        lines: [{ medicine_id: 'med_2', quantity: 5, unit_cost: 5000 }],
        total_cost: 25000,
        approved_by_user_id: null,
        submitted_at: null,
      },
      {
        id: 'po_completed',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-03-03',
        updated_at: '2026-03-03',
        supplier_id: 'sup_1',
        status: 'completed',
        lines: [{ medicine_id: 'med_1', quantity: 20, unit_cost: 1000 }],
        total_cost: 20000,
        approved_by_user_id: 'user_1',
        submitted_at: '2026-03-03',
      },
    ];

    const summary = getInitialDashboardSummary({
      purchaseOrders: testPOs,
    });

    expect(summary.supplierDebt).toBe(35000);
    expect(summary.pendingPurchaseOrders).toBe(2);
  });

  test('groups sales-by-category correctly over the last 30 days', () => {
    const fixedNow = new Date('2026-03-31T12:00:00Z');

    const medicines: Medicine[] = [
      {
        id: 'med_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        name: 'Paracetamol',
        generic_name: null,
        category: 'Analgesics',
        unit: 'pack',
        is_controlled_substance: false,
        requires_prescription: false,
      },
      {
        id: 'med_2',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        name: 'Amoxicillin',
        generic_name: null,
        category: 'Antibiotics',
        unit: 'pack',
        is_controlled_substance: false,
        requires_prescription: true,
      },
    ];

    const sales: Sale[] = [
      {
        id: 'sale_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-03-25T10:00:00Z',
        updated_at: '2026-03-25T10:00:00Z',
        customer_id: null,
        lines: [
          {
            id: 'l1',
            inventory_item_id: 'inv_1',
            medicine_id: 'med_1',
            quantity: 2,
            unit_price: 3000,
            subtotal: 6000,
            dispensed_by_user_id: 'user_1',
            is_prescription_dispense: false,
          },
        ],
        payment_method: 'cash',
        discount_amount: 0,
        discount_authorized_by_user_id: null,
        tax_amount: 0,
        grand_total: 6000,
        currency: 'TZS',
        synced_at: null,
      },
      {
        id: 'sale_2',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-03-30T14:00:00Z',
        updated_at: '2026-03-30T14:00:00Z',
        customer_id: null,
        lines: [
          {
            id: 'l2',
            inventory_item_id: 'inv_2',
            medicine_id: 'med_2',
            quantity: 1,
            unit_price: 5000,
            subtotal: 5000,
            dispensed_by_user_id: 'user_1',
            is_prescription_dispense: true,
          },
          {
            id: 'l3',
            inventory_item_id: 'inv_1',
            medicine_id: 'med_1',
            quantity: 1,
            unit_price: 3000,
            subtotal: 3000,
            dispensed_by_user_id: 'user_1',
            is_prescription_dispense: false,
          },
        ],
        payment_method: 'cash',
        discount_amount: 0,
        discount_authorized_by_user_id: null,
        tax_amount: 0,
        grand_total: 8000,
        currency: 'TZS',
        synced_at: null,
      },
    ];

    const summary = getInitialDashboardSummary({
      sales,
      medicines,
      nowDate: fixedNow,
    });

    expect(summary.salesByCategory).toEqual([
      { category: 'Analgesics', total: 9000 },
      { category: 'Antibiotics', total: 5000 },
    ]);
  });
});
