import { describe, it, expect } from 'vitest';
import { deriveStockStatus } from '../deriveStockStatus';
import { computeStockAnalytics } from '../stockAnalytics.queries';
import type { MedicineWithInventory } from '@40labs/types';

describe('Stock Analytics & Derive Stock Status', () => {
  const mockItem = (id: string, qty: number, threshold: number, expiry?: string, category?: string): MedicineWithInventory => ({
    id,
    medicine_id: `med_${id}`,
    quantity: qty,
    low_stock_threshold: threshold,
    expiry_date: expiry,
    category,
    medicine: {
      id: `med_${id}`,
      name: `Medicine ${id}`,
      category: category || '',
      sell_price: 1000,
      cost_price: 800,
    },
  });

  it('derives stock status boundaries correctly', () => {
    const now = new Date('2025-06-01T00:00:00Z');

    // Out (qty 0)
    expect(deriveStockStatus(mockItem('1', 0, 10), undefined, now)).toBe('out');

    // Low (qty <= threshold * 0.5 or <= threshold)
    expect(deriveStockStatus(mockItem('2', 4, 10), undefined, now)).toBe('low');
    expect(deriveStockStatus(mockItem('3', 10, 10), undefined, now)).toBe('low');

    // In stock (qty > threshold)
    expect(deriveStockStatus(mockItem('4', 11, 10), undefined, now)).toBe('in_stock');

    // Expired (qty > 0 and expiry date in past)
    expect(deriveStockStatus(mockItem('5', 5, 10, '2025-05-15'), undefined, now)).toBe('expired');
  });

  it('satisfies bucket-sum invariant and KPI matching', () => {
    const now = new Date('2025-06-01T00:00:00Z');
    const items = [
      mockItem('1', 0, 10, undefined, 'Painkillers'), // out
      mockItem('2', 5, 10, undefined, 'Antibiotics'), // low
      mockItem('3', 50, 10, undefined, 'Antibiotics'), // in_stock
      mockItem('4', 15, 10, '2025-05-01', 'Vitamins'), // expired
    ];

    const analytics = computeStockAnalytics(items, now);
    const { stockHealth, kpis, categoryDistribution } = analytics;

    const sumBuckets = stockHealth.in_stock + stockHealth.low + stockHealth.out + stockHealth.expired;
    expect(sumBuckets).toBe(kpis.totalSkus);
    expect(kpis.lowStockCount).toBe(stockHealth.low);
    expect(kpis.outStockCount).toBe(stockHealth.out);

    // Check category distribution
    expect(categoryDistribution.length).toBe(3);
    const uncategorized = categoryDistribution.find((c) => c.category === 'Hakuna kategoria');
    // If category is empty string, maps to 'Hakuna kategoria'
    const itemWithoutCat = mockItem('6', 10, 10, undefined, '');
    const analytics2 = computeStockAnalytics([itemWithoutCat], now);
    expect(analytics2.categoryDistribution[0].category).toBe('Hakuna kategoria');
  });
});
