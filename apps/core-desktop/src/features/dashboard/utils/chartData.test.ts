import { describe, test, expect } from 'vitest';
import { buildChartData, buildUnifiedChartData } from './chartData';
import { getInitialDashboardSummary } from '../../../devData/dashboard/summary';
import type { Medicine, InventoryItem, Sale } from '@40labs/types';

describe('Chart Data Utility [phase: 8D]', () => {
  test('buildChartData creates time series for sales, profit, customers, stock', () => {
    const summary = getInitialDashboardSummary();

    const sales7d = buildChartData(summary, {
      metric: 'sales',
      chartType: 'bar',
      period: '7d',
    });
    expect(sales7d.data.length).toBe(7);
    expect(sales7d.isCategory).toBe(false);

    const profit30d = buildChartData(summary, {
      metric: 'profit',
      chartType: 'line',
      period: '30d',
    });
    expect(profit30d.data.length).toBe(30);

    const customers90d = buildChartData(summary, {
      metric: 'customers',
      chartType: 'area',
      period: '90d',
    });
    expect(customers90d.data.length).toBe(90);
    expect(customers90d.hasCategoryData).toBe(false); // customers has no category breakdown
  });

  test('buildChartData handles ring/category breakdown for sales, profit, stock', () => {
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

    const salesRing = buildChartData(summary, {
      metric: 'sales',
      chartType: 'ring',
      period: '30d',
    });
    expect(salesRing.data).toEqual([{ category: 'Analgesics', value: 20000, percentage: 100 }]);

    const profitRing = buildChartData(summary, {
      metric: 'profit',
      chartType: 'ring',
      period: '30d',
    });
    // (2000 - 1000) * 10 = 10000
    expect(profitRing.data).toEqual([{ category: 'Analgesics', value: 10000, percentage: 100 }]);

    const stockRing = buildChartData(summary, {
      metric: 'stock',
      chartType: 'ring',
      period: '30d',
    });
    // sell_price 2000 * quantity 50 = 100000
    expect(stockRing.data).toEqual([{ category: 'Analgesics', value: 100000, percentage: 100 }]);
  });

  test('buildUnifiedChartData builds multi-series datasets for unified chart', () => {
    const summary = getInitialDashboardSummary();
    const unified = buildUnifiedChartData(summary, '30d');

    expect(unified.data.length).toBe(30);
    expect(unified.series.length).toBeGreaterThanOrEqual(4);
    expect(unified.totalValues).toBeDefined();
    expect(typeof unified.totalValues.sales).toBe('number');
    expect(typeof unified.totalValues.profit).toBe('number');
  });
});
