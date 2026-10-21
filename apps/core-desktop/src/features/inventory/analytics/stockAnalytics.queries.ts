import type { MedicineWithInventory } from '@40labs/types';
import { deriveStockStatus, StockStatusType } from './deriveStockStatus';
import { DEFAULT_ALERT_THRESHOLDS } from '../../alerts/alertThresholds';

export interface StockKpis {
  totalValue: number;
  lowStockCount: number;
  outStockCount: number;
  expiring30dCount: number;
  totalSkus: number;
}

export interface CategoryDistributionItem {
  category: string;
  skuCount: number;
  value: number;
  units: number;
}

export interface StockHealthBreakdown {
  in_stock: number;
  low: number;
  out: number;
  expired: number;
}

export interface ComputedStockAnalytics {
  kpis: StockKpis;
  stockHealth: StockHealthBreakdown;
  categoryDistribution: CategoryDistributionItem[];
}

export function computeStockAnalytics(
  items: MedicineWithInventory[],
  currentTime: Date = new Date()
): ComputedStockAnalytics {
  let totalValue = 0;
  let lowStockCount = 0;
  let outStockCount = 0;
  let expiring30dCount = 0;
  const totalSkus = items.length;

  const health: StockHealthBreakdown = {
    in_stock: 0,
    low: 0,
    out: 0,
    expired: 0,
  };

  const categoryMap = new Map<string, { skuCount: number; value: number; units: number }>();
  const nowMs = currentTime.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  items.forEach((item) => {
    const qty = item.quantity ?? 0;
    const sellPrice = item.sell_price ?? item.medicine?.sell_price ?? 0;
    const itemValue = qty * sellPrice;
    totalValue += itemValue;

    const status = deriveStockStatus(item, DEFAULT_ALERT_THRESHOLDS, currentTime);
    health[status]++;

    if (status === 'low') lowStockCount++;
    if (status === 'out') outStockCount++;

    if (item.expiry_date) {
      const expMs = new Date(item.expiry_date).getTime();
      const days = Math.round((expMs - nowMs) / dayMs);
      if (days >= 0 && days <= 30) {
        expiring30dCount++;
      }
    }

    // Category aggregation
    const rawCat = item.category || item.medicine?.category || 'Hakuna kategoria';
    const cat = rawCat.trim() === '' ? 'Hakuna kategoria' : rawCat;

    const existing = categoryMap.get(cat) || { skuCount: 0, value: 0, units: 0 };
    existing.skuCount += 1;
    existing.value += itemValue;
    existing.units += qty;
    categoryMap.set(cat, existing);
  });

  const categoryDistribution: CategoryDistributionItem[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      skuCount: data.skuCount,
      value: data.value,
      units: data.units,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    kpis: {
      totalValue,
      lowStockCount,
      outStockCount,
      expiring30dCount,
      totalSkus,
    },
    stockHealth: health,
    categoryDistribution,
  };
}
