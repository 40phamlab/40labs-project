import { describe, test, expect } from 'vitest';
import { buildChartData, chartCompatibilityMap } from './chartData';
import { getInitialDashboardSummary } from '../../../devData/dashboard/summary';
import type { Medicine, InventoryItem, Sale } from '@40labs/types';

describe('Chart Data Utility & Compatibility Map', () => {
  test('compatibility map matches specs', () => {
    expect(chartCompatibilityMap.time).toEqual(['line', 'area', 'bar']);
    expect(chartCompatibilityMap.category).toEqual(['pie', 'ring', 'bar', 'radar']);
  });

  test('stock_value metric forces category breakdown (no time series support)', () => {
    const summary = getInitialDashboardSummary();
    const resultTime = buildChartData(summary, {
      metric: 'stock_value',
      breakdown: 'time',
      period: '30d',
    });

    // Should return category breakdown instead of time series
    expect(resultTime.xKey).toBe('category');
  });

  test('buildChartData handles category breakdown for sales, profit, purchases, stock_value', () => {
    const medicines: Medicine[] = [
      {
        id: 'med_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        name: 'Aspirin',
        generic_name: null,
        category: 'Analgesics',
        unit: 'pack',
        is_controlled_substance: false,
        requires_prescription: false,
      },
    ];

    const inventoryItems: InventoryItem[] = [
      {
        id: 'inv_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        medicine_id: 'med_1',
        batch_number: 'B1',
        expiry_date: '2028-01-01',
        buy_price: 1000,
        sell_price: 2000,
        quantity: 50,
        low_stock_threshold: 5,
        cold_chain_required: false,
      },
    ];

    const sales: Sale[] = [
      {
        id: 's_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-03-31T10:00:00Z',
        updated_at: '2026-03-31T10:00:00Z',
        customer_id: null,
        lines: [
          {
            id: 'l_1',
            inventory_item_id: 'inv_1',
            medicine_id: 'med_1',
            quantity: 10,
            unit_price: 2000,
            subtotal: 20000,
            dispensed_by_user_id: 'user_1',
            is_prescription_dispense: false,
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
      sales,
      inventoryItems,
      medicines,
      purchaseOrders: [],
      labOrders: [],
      customers: [],
      nowDate: new Date('2026-03-31T12:00:00Z'),
    });

    const salesResult = buildChartData(summary, {
      metric: 'sales',
      breakdown: 'category',
      period: '30d',
    });
    expect(salesResult.data).toEqual([{ category: 'Analgesics', value: 20000 }]);

    const profitResult = buildChartData(summary, {
      metric: 'profit',
      breakdown: 'category',
      period: '30d',
    });
    // (2000 - 1000) * 10 = 10000
    expect(profitResult.data).toEqual([{ category: 'Analgesics', value: 10000 }]);

    const stockResult = buildChartData(summary, {
      metric: 'stock_value',
      breakdown: 'time',
      period: '30d',
    });
    // sell_price 2000 * quantity 50 = 100000
    expect(stockResult.data).toEqual([{ category: 'Analgesics', value: 100000 }]);
  });
});
