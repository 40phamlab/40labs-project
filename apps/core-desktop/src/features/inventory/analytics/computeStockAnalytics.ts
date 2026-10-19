/**
 * [phase: StockAnalytics] Pure Inventory Stock Trends & Category Analytics Computation
 *
 * FORMULAS & BUSINESS LOGIC:
 * - range_days: 7 for '7d', 30 for '30d', 90 for '90d'.
 * - units_out = sum of sale line quantity in range (exclude voided/refunded).
 * - units_in = sum of completed purchase order line quantity in range + positive stock adjustments.
 * - gross_profit = Σ (unit_price − buy_price) × quantity across sale lines in range.
 * - revenue = Σ (unit_price × quantity) across sale lines in range.
 * - margin_pct = (gross_profit / revenue) * 100 (0 if revenue is 0).
 * - avg_daily_out = units_out / range_days.
 * - days_of_cover = on_hand / avg_daily_out; null when avg_daily_out === 0.
 * - stock value (buy) = on_hand × buy_price per inventory item.
 * - stock value (sell) = on_hand × sell_price per inventory item.
 * - Expired batches (expiry_date < now) are excluded from "in stock" valuation and counted in status_breakdown.expired.
 * - All monetary values are integer TZS (Math.round).
 */

import type {
  InventoryItem,
  Medicine,
  Sale,
  PurchaseOrder,
  StockAdjustment,
  StockAnalytics,
  StockAnalyticsRange,
} from '@40labs/types';

export function computeStockAnalytics(
  inventoryItems: InventoryItem[],
  medicines: Medicine[],
  sales: Sale[],
  purchaseOrders: PurchaseOrder[],
  stockAdjustments: StockAdjustment[],
  range: StockAnalyticsRange = '30d',
  nowDate?: Date
): StockAnalytics {
  const now = nowDate ?? new Date();
  const nowMs = now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : 90;

  const startDate = new Date(nowMs - rangeDays * dayMs);
  const startDateStr = startDate.toISOString();

  // Helper to find medicine by id
  const medicineMap = new Map<string, Medicine>();
  medicines.forEach((m) => medicineMap.set(m.id, m));

  const getMedicineName = (medId: string, inventoryItemId?: string): string => {
    const med = medicineMap.get(medId);
    if (med) return med.name;
    if (inventoryItemId) {
      const inv = inventoryItems.find((i) => i.id === inventoryItemId);
      if (inv) {
        const m2 = medicineMap.get(inv.medicine_id);
        if (m2) return m2.name;
      }
    }
    return 'Unknown Item';
  };

  // 1. KPI calculations & Status breakdown
  let totalSkus = inventoryItems.length;
  let stockValueBuy = 0;
  let stockValueSell = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let inStockCount = 0;
  let expiredCount = 0;
  let expiring30Count = 0;
  let expiring30Value = 0;

  const itemStatusMap = new Map<string, 'in_stock' | 'low' | 'out' | 'expired'>();

  inventoryItems.forEach((item) => {
    const qty = item.quantity ?? 0;
    const buyPrice = item.buy_price ?? 0;
    const sellPrice = item.sell_price ?? 0;
    const expDate = item.expiry_date ? new Date(item.expiry_date).getTime() : NaN;
    const daysToExpiry = !isNaN(expDate) ? Math.floor((expDate - nowMs) / dayMs) : null;

    const isExpired = daysToExpiry !== null && daysToExpiry < 0;

    if (isExpired) {
      expiredCount++;
      itemStatusMap.set(item.id, 'expired');
    } else {
      stockValueBuy += Math.round(qty * buyPrice);
      stockValueSell += Math.round(qty * sellPrice);

      if (qty === 0) {
        outOfStockCount++;
        itemStatusMap.set(item.id, 'out');
      } else if (qty <= (item.low_stock_threshold ?? 0)) {
        lowStockCount++;
        itemStatusMap.set(item.id, 'low');
      } else {
        inStockCount++;
        itemStatusMap.set(item.id, 'in_stock');
      }
    }

    if (daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 30) {
      expiring30Count++;
      if (!isExpired) {
        expiring30Value += Math.round(qty * buyPrice);
      }
    }
  });

  // 2. Category Aggregations
  const categoryMap = new Map<string, { units: number; value: number; skuSet: Set<string> }>();

  inventoryItems.forEach((item) => {
    const med = medicineMap.get(item.medicine_id);
    const cat = med?.category || 'General';
    const expDate = item.expiry_date ? new Date(item.expiry_date).getTime() : NaN;
    const isExpired = !isNaN(expDate) && expDate < nowMs;

    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { units: 0, value: 0, skuSet: new Set() });
    }
    const entry = categoryMap.get(cat)!;
    entry.units += item.quantity ?? 0;
    if (!isExpired) {
      entry.value += Math.round((item.quantity ?? 0) * (item.buy_price ?? 0));
    }
    entry.skuSet.add(item.id);
  });

  const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    units: data.units,
    value: Math.round(data.value),
    sku_count: data.skuSet.size,
  }));

  // 3. Movement (daily zero-filled for range)
  const movementMap = new Map<string, { units_in: number; units_out: number }>();
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(nowMs - i * dayMs);
    const dateStr = d.toISOString().slice(0, 10);
    movementMap.set(dateStr, { units_in: 0, units_out: 0 });
  }

  // Populate sales units_out
  const itemUnitsOutMap = new Map<string, number>();
  const itemRevenueMap = new Map<string, number>();
  const itemProfitMap = new Map<string, number>();
  const itemLastSaleDateMap = new Map<string, number>();

  sales.forEach((sale) => {
    if (!sale || !sale.created_at || sale.created_at < startDateStr) return;
    const dateStr = sale.created_at.slice(0, 10);
    const bucket = movementMap.get(dateStr);

    (sale.lines || []).forEach((line) => {
      const qty = line.quantity ?? 0;
      if (bucket) {
        bucket.units_out += qty;
      }

      const inv = inventoryItems.find((i) => i.id === line.inventory_item_id);
      const buyPrice = inv?.buy_price ?? 0;
      const unitPrice = line.unit_price ?? 0;
      const subtotal = line.subtotal ?? (unitPrice * qty);
      const profit = Math.round((unitPrice - buyPrice) * qty);

      const itemId = line.inventory_item_id;
      itemUnitsOutMap.set(itemId, (itemUnitsOutMap.get(itemId) || 0) + qty);
      itemRevenueMap.set(itemId, (itemRevenueMap.get(itemId) || 0) + subtotal);
      itemProfitMap.set(itemId, (itemProfitMap.get(itemId) || 0) + profit);

      const saleTime = new Date(sale.created_at).getTime();
      const lastTime = itemLastSaleDateMap.get(itemId) || 0;
      if (saleTime > lastTime) {
        itemLastSaleDateMap.set(itemId, saleTime);
      }
    });
  });

  // Populate purchase orders units_in
  purchaseOrders.forEach((po) => {
    if (!po || po.status !== 'completed' || !po.created_at || po.created_at < startDateStr) return;
    const dateStr = po.created_at.slice(0, 10);
    const bucket = movementMap.get(dateStr);

    (po.lines || []).forEach((line) => {
      const qty = line.quantity ?? 0;
      if (bucket) {
        bucket.units_in += qty;
      }
    });
  });

  // Positive stock adjustments as units_in
  stockAdjustments.forEach((adj) => {
    if (!adj || !adj.created_at || adj.created_at < startDateStr) return;
    const dateStr = adj.created_at.slice(0, 10);
    const bucket = movementMap.get(dateStr);
    const delta = adj.delta ?? 0;
    if (bucket && delta > 0) {
      bucket.units_in += delta;
    }
  });

  const movement = Array.from(movementMap.entries()).map(([date, vals]) => ({
    date,
    units_in: vals.units_in,
    units_out: vals.units_out,
  }));

  // 4. Top Moving items (top 8 by units_out)
  const topMovingList = inventoryItems.map((item) => {
    const unitsOut = itemUnitsOutMap.get(item.id) || 0;
    const avgDailyOut = Math.round((unitsOut / rangeDays) * 100) / 100;
    const medName = getMedicineName(item.medicine_id, item.id);
    return {
      item_id: item.id,
      name: `${medName} (${item.batch_number})`,
      units_out: unitsOut,
      avg_daily_out: avgDailyOut,
    };
  });
  topMovingList.sort((a, b) => b.units_out - a.units_out);
  const top_moving = topMovingList.slice(0, 8);

  // 5. Best Performers (top 8 by gross_profit)
  const bestPerformersList = inventoryItems.map((item) => {
    const revenue = itemRevenueMap.get(item.id) || 0;
    const grossProfit = itemProfitMap.get(item.id) || 0;
    const marginPct = revenue > 0 ? Math.round((grossProfit / revenue) * 100 * 10) / 10 : 0;
    const medName = getMedicineName(item.medicine_id, item.id);
    return {
      item_id: item.id,
      name: `${medName} (${item.batch_number})`,
      revenue: Math.round(revenue),
      gross_profit: Math.round(grossProfit),
      margin_pct: marginPct,
    };
  });
  bestPerformersList.sort((a, b) => b.gross_profit - a.gross_profit);
  const best_performers = bestPerformersList.slice(0, 8);

  // 6. Slow Movers (bottom 5 by units_out among items with on_hand > 0)
  const slowMoversList = inventoryItems
    .filter((item) => (item.quantity ?? 0) > 0)
    .map((item) => {
      const unitsOut = itemUnitsOutMap.get(item.id) || 0;
      const lastSaleTime = itemLastSaleDateMap.get(item.id);
      const daysSinceLastSale = lastSaleTime ? Math.floor((nowMs - lastSaleTime) / dayMs) : rangeDays;
      const medName = getMedicineName(item.medicine_id, item.id);
      return {
        item_id: item.id,
        name: `${medName} (${item.batch_number})`,
        on_hand: item.quantity ?? 0,
        units_out: unitsOut,
        days_since_last_sale: daysSinceLastSale,
      };
    });
  slowMoversList.sort((a, b) => a.units_out - b.units_out || b.days_since_last_sale - a.days_since_last_sale);
  const slow_movers = slowMoversList.slice(0, 5);

  // 7. Expiry Buckets
  const expiryBucketsMap: Record<string, { units: number; value: number }> = {
    '0-30': { units: 0, value: 0 },
    '31-60': { units: 0, value: 0 },
    '61-90': { units: 0, value: 0 },
  };

  inventoryItems.forEach((item) => {
    const expDate = item.expiry_date ? new Date(item.expiry_date).getTime() : NaN;
    if (isNaN(expDate)) return;
    const daysToExpiry = Math.floor((expDate - nowMs) / dayMs);
    const qty = item.quantity ?? 0;
    const val = Math.round(qty * (item.buy_price ?? 0));

    if (daysToExpiry >= 0 && daysToExpiry <= 30) {
      expiryBucketsMap['0-30'].units += qty;
      expiryBucketsMap['0-30'].value += val;
    } else if (daysToExpiry >= 31 && daysToExpiry <= 60) {
      expiryBucketsMap['31-60'].units += qty;
      expiryBucketsMap['31-60'].value += val;
    } else if (daysToExpiry >= 61 && daysToExpiry <= 90) {
      expiryBucketsMap['61-90'].units += qty;
      expiryBucketsMap['61-90'].value += val;
    }
  });

  const expiry_buckets = [
    { bucket: '0-30' as const, units: expiryBucketsMap['0-30'].units, value: Math.round(expiryBucketsMap['0-30'].value) },
    { bucket: '31-60' as const, units: expiryBucketsMap['31-60'].units, value: Math.round(expiryBucketsMap['31-60'].value) },
    { bucket: '61-90' as const, units: expiryBucketsMap['61-90'].units, value: Math.round(expiryBucketsMap['61-90'].value) },
  ];

  // 8. Cover (lowest 8 items by days_of_cover; null when avg_daily_out === 0)
  const coverList = inventoryItems.map((item) => {
    const unitsOut = itemUnitsOutMap.get(item.id) || 0;
    const avgDailyOut = unitsOut / rangeDays;
    const onHand = item.quantity ?? 0;
    const daysOfCover = avgDailyOut > 0 ? Math.round((onHand / avgDailyOut) * 10) / 10 : null;
    const medName = getMedicineName(item.medicine_id, item.id);
    return {
      item_id: item.id,
      name: `${medName} (${item.batch_number})`,
      on_hand: onHand,
      avg_daily_out: Math.round(avgDailyOut * 100) / 100,
      days_of_cover: daysOfCover,
    };
  });
  coverList.sort((a, b) => {
    if (a.days_of_cover === null && b.days_of_cover === null) return 0;
    if (a.days_of_cover === null) return 1;
    if (b.days_of_cover === null) return -1;
    return a.days_of_cover - b.days_of_cover;
  });
  const cover = coverList.slice(0, 8);

  return {
    range,
    generated_at: now.toISOString(),
    kpis: {
      total_skus: totalSkus,
      stock_value_buy: Math.round(stockValueBuy),
      stock_value_sell: Math.round(stockValueSell),
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
      expiring_30d_count: expiring30Count,
      expiring_30d_value: Math.round(expiring30Value),
    },
    by_category: byCategory,
    status_breakdown: {
      in_stock: inStockCount,
      low: lowStockCount,
      out: outOfStockCount,
      expired: expiredCount,
    },
    movement,
    top_moving,
    best_performers,
    slow_movers,
    expiry_buckets,
    cover,
  };
}
