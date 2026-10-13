import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInitialDashboardSummary } from '../../../devData/dashboard/summary';
import { dashboardApi } from '../../../api/dashboardApi';
import { salesApi } from '../../../api/salesApi';
import { inventoryApi } from '../../../api/inventoryApi';
import { purchasesApi } from '../../../api/purchasesApi';
import { labApi } from '../../../api/labApi';
import { customersApi } from '../../../api/customersApi';
import type { Sale, InventoryItem, Medicine } from '@40labs/types';

vi.mock('../../../api/salesApi', () => ({
  salesApi: { list: vi.fn() },
}));
vi.mock('../../../api/inventoryApi', () => ({
  inventoryApi: { list: vi.fn(), listMedicines: vi.fn() },
}));
vi.mock('../../../api/purchasesApi', () => ({
  purchasesApi: { list: vi.fn() },
}));
vi.mock('../../../api/labApi', () => ({
  labApi: { listOrders: vi.fn() },
}));
vi.mock('../../../api/customersApi', () => ({
  customersApi: { list: vi.fn() },
}));

describe('Task 4 — Dashboard Aggregation and Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NaN Prevention & Canonical ID Resolution', () => {
    it('prevents NaN metrics when buy_price, sell_price, or grand_total are corrupt or missing', () => {
      const fixedNow = new Date('2026-03-31T12:00:00Z');

      const corruptInventory: InventoryItem[] = [
        {
          id: 'inv_corrupt_1',
          workspace_id: 'ws_1',
          branch_id: 'br_1',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
          medicine_id: 'med_corrupt_1',
          batch_number: 'B1',
          expiry_date: '2027-01-01',
          buy_price: 1000,
          sell_price: '5000' as any,
          quantity: '10' as any,
          low_stock_threshold: 5,
          cold_chain_required: false,
        },
      ];

      const corruptSales: Sale[] = [
        {
          id: 'sale_corrupt_1',
          workspace_id: 'ws_1',
          branch_id: 'br_1',
          created_at: '2026-03-31T10:00:00Z',
          updated_at: '2026-03-31T10:00:00Z',
          customer_id: null,
          lines: [
            {
              id: 'line_1',
              inventory_item_id: 'inv_corrupt_1',
              medicine_id: 'med_corrupt_1',
              quantity: '2' as any,
              unit_price: '5000' as any,
              subtotal: 10000,
              dispensed_by_user_id: 'u1',
              is_prescription_dispense: false,
            },
          ],
          payment_method: 'cash',
          discount_amount: 0,
          discount_authorized_by_user_id: null,
          tax_amount: 0,
          grand_total: '10000' as any,
          currency: 'TZS',
          synced_at: null,
        },
      ];

      const summary = getInitialDashboardSummary({
        sales: corruptSales,
        inventoryItems: corruptInventory,
        nowDate: fixedNow,
      });

      expect(Number.isNaN(summary.profit)).toBe(false);
      expect(Number.isNaN(summary.todaysSales)).toBe(false);
      expect(Number.isNaN(summary.inventoryValue)).toBe(false);
      expect(Number.isNaN(summary.totalStock)).toBe(false);
      expect(summary.profit).toBe(8000); // (5000 - 1000) * 2 = 8000
      expect(summary.todaysSales).toBe(10000);
      expect(summary.inventoryValue).toBe(50000); // 5000 * 10
      expect(summary.totalStock).toBe(10);
    });

    it('matches sale line to inventory using medicine_id when inventory_item_id differs', () => {
      const fixedNow = new Date('2026-03-31T12:00:00Z');

      const medicines: Medicine[] = [
        {
          id: 'med_canonical_1',
          workspace_id: 'ws_1',
          branch_id: 'br_1',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
          name: 'Amoxicillin',
          generic_name: 'Amoxicillin',
          category: 'Antibiotics',
          unit: 'pack',
          is_controlled_substance: false,
          requires_prescription: true,
        },
      ];

      const inventoryItems: InventoryItem[] = [
        {
          id: 'inv_actual_99',
          workspace_id: 'ws_1',
          branch_id: 'br_1',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
          medicine_id: 'med_canonical_1',
          batch_number: 'B99',
          expiry_date: '2027-01-01',
          buy_price: 3000,
          sell_price: 6000,
          quantity: 20,
          low_stock_threshold: 5,
          cold_chain_required: false,
        },
      ];

      const sales: Sale[] = [
        {
          id: 'sale_1',
          workspace_id: 'ws_1',
          branch_id: 'br_1',
          created_at: '2026-03-31T08:00:00Z',
          updated_at: '2026-03-31T08:00:00Z',
          customer_id: null,
          lines: [
            {
              id: 'line_1',
              inventory_item_id: 'different_inv_id', // mismatch on inv id
              medicine_id: 'med_canonical_1', // match on canonical medicine_id
              quantity: 2,
              unit_price: 6000,
              subtotal: 12000,
              dispensed_by_user_id: 'u1',
              is_prescription_dispense: true,
            },
          ],
          payment_method: 'cash',
          discount_amount: 0,
          discount_authorized_by_user_id: null,
          tax_amount: 0,
          grand_total: 12000,
          currency: 'TZS',
          synced_at: null,
        },
      ];

      const summary = getInitialDashboardSummary({
        sales,
        inventoryItems,
        medicines,
        nowDate: fixedNow,
      });

      // (6000 - 3000) * 2 = 6000
      expect(summary.profit).toBe(6000);
      expect(summary.todaysSales).toBe(12000);
    });
  });

  describe('dashboardApi Failure Handling', () => {
    it('propagates genuine backend errors when critical sales/inventory queries fail', async () => {
      vi.mocked(salesApi.list).mockRejectedValue(new Error('Database Connection Error [500]'));
      vi.mocked(inventoryApi.list).mockRejectedValue(new Error('Database Connection Error [500]'));

      await expect(dashboardApi.getSummary()).rejects.toThrow('Database Connection Error [500]');
    });

    it('remains resilient when optional queries fail (purchases/lab/customers)', async () => {
      vi.mocked(salesApi.list).mockResolvedValue([
        {
          id: 's1',
          workspace_id: 'w1',
          branch_id: 'b1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          customer_id: null,
          lines: [],
          payment_method: 'cash',
          discount_amount: 0,
          discount_authorized_by_user_id: null,
          tax_amount: 0,
          grand_total: 15000,
          currency: 'TZS',
          synced_at: null,
        },
      ]);
      vi.mocked(inventoryApi.list).mockResolvedValue([]);
      vi.mocked(inventoryApi.listMedicines).mockResolvedValue([]);
      vi.mocked(purchasesApi.list).mockRejectedValue(new Error('Purchases service timeout'));
      vi.mocked(labApi.listOrders).mockRejectedValue(new Error('Lab service offline'));
      vi.mocked(customersApi.list).mockRejectedValue(new Error('Customers service error'));

      const summary = await dashboardApi.getSummary();

      expect(summary.todaysSales).toBe(15000);
      expect(summary.pending.purchaseOrders.length).toBe(0);
      expect(summary.pending.labOrders.length).toBe(0);
    });
  });
});
