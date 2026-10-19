import { describe, test, expect } from 'vitest';
import { computeStockAnalytics } from './computeStockAnalytics';
import type { InventoryItem, Medicine, Sale, PurchaseOrder, StockAdjustment } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID } from '../../../devData/constants';

describe('computeStockAnalytics [phase: StockAnalytics]', () => {
  const medicines: Medicine[] = [
    {
      id: 'med_1',
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      name: 'Paracetamol',
      generic_name: 'Paracetamol',
      category: 'Analgesic',
      unit: 'tablet',
      is_controlled_substance: false,
      requires_prescription: false,
    },
    {
      id: 'med_2',
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      name: 'Amoxicillin',
      generic_name: 'Amoxicillin',
      category: 'Antibiotic',
      unit: 'capsule',
      is_controlled_substance: false,
      requires_prescription: true,
    },
  ];

  const inventoryItems: InventoryItem[] = [
    {
      id: 'inv_1',
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-03-30T00:00:00Z',
      medicine_id: 'med_1',
      batch_number: 'B1',
      expiry_date: '2026-07-01T00:00:00Z',
      buy_price: 1000,
      sell_price: 1500,
      quantity: 100,
      low_stock_threshold: 20,
      cold_chain_required: false,
    },
    {
      id: 'inv_2', // Expired batch (expiry before 2026-03-31)
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-03-30T00:00:00Z',
      medicine_id: 'med_2',
      batch_number: 'B2',
      expiry_date: '2026-03-20T00:00:00Z', // expired
      buy_price: 2000,
      sell_price: 3000,
      quantity: 50,
      low_stock_threshold: 10,
      cold_chain_required: false,
    },
    {
      id: 'inv_3', // Zero sales item (dead item)
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-03-30T00:00:00Z',
      medicine_id: 'med_1',
      batch_number: 'B3',
      expiry_date: '2026-10-01T00:00:00Z',
      buy_price: 500,
      sell_price: 800,
      quantity: 30,
      low_stock_threshold: 5,
      cold_chain_required: false,
    },
  ];

  const sales: Sale[] = [
    {
      id: 'sale_1',
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: '2026-03-29T10:00:00Z',
      updated_at: '2026-03-29T10:00:00Z',
      customer_id: null,
      lines: [
        {
          id: 'line_1',
          inventory_item_id: 'inv_1',
          medicine_id: 'med_1',
          quantity: 10,
          unit_price: 1500,
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

  const purchaseOrders: PurchaseOrder[] = [];
  const stockAdjustments: StockAdjustment[] = [];

  test('computes analytics correctly including expired items exclusion and zero sales cover null', () => {
    const analytics = computeStockAnalytics(
      inventoryItems,
      medicines,
      sales,
      purchaseOrders,
      stockAdjustments,
      '30d',
      new Date('2026-03-31T12:00:00Z')
    );

    expect(analytics.range).toBe('30d');
    expect(analytics.kpis.total_skus).toBe(3);
    // inv_2 is expired (quantity 50), so stock_value_buy should only include inv_1 (100 * 1000 = 100000) and inv_3 (30 * 500 = 15000) = 115000
    expect(analytics.kpis.stock_value_buy).toBe(115000);
    expect(analytics.status_breakdown.expired).toBe(1);

    // inv_3 has zero sales -> days_of_cover should be null
    const deadItemCover = analytics.cover.find((c) => c.item_id === 'inv_3');
    expect(deadItemCover).toBeDefined();
    expect(deadItemCover?.days_of_cover).toBeNull();

    // movement array should be zero-filled and have length 30
    expect(analytics.movement.length).toBe(30);
    const dayWithSale = analytics.movement.find((m) => m.units_out > 0);
    expect(dayWithSale).toBeDefined();
    expect(dayWithSale?.units_out).toBe(10);
  });
});
