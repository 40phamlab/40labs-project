import type { DashboardSummary } from '../../../devData/dashboard/summary';

export type DashboardMetric = 'sales' | 'profit' | 'purchases' | 'stock_value';
export type DashboardChartType = 'line' | 'area' | 'bar' | 'pie' | 'ring' | 'radar';
export type DashboardPeriod = '7d' | '30d' | '90d';
export type DashboardBreakdown = 'time' | 'category';

export const chartCompatibilityMap: Record<DashboardBreakdown, DashboardChartType[]> = {
  time: ['line', 'area', 'bar'],
  category: ['pie', 'ring', 'bar', 'radar'],
};

export interface BuildChartDataOptions {
  metric: DashboardMetric;
  breakdown: DashboardBreakdown;
  period: DashboardPeriod;
  nowDate?: Date;
}

export interface ChartResult {
  data: Record<string, string | number>[];
  xKey: string;
  series: string;
}

export function buildChartData(
  summary: DashboardSummary,
  options: BuildChartDataOptions
): ChartResult {
  const { metric, breakdown, period } = options;

  // Rule: stock_value only supports category (no history exists)
  const effectiveBreakdown = metric === 'stock_value' ? 'category' : breakdown;

  const daysCount = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const allDates = [
    ...(summary.sales || []).map((s) => s.created_at),
    ...(summary.purchaseOrdersList || []).map((po) => po.created_at),
  ]
    .map((d) => new Date(d).getTime())
    .filter((t) => !isNaN(t));

  const now = options?.nowDate ?? (allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date());

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysCount);
  const startDateStr = startDate.toISOString().slice(0, 10);

  if (effectiveBreakdown === 'time') {
    const dateMap: Record<string, number> = {};
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      dateMap[dateStr] = 0;
    }

    if (metric === 'sales') {
      summary.sales
        .filter((s) => s.created_at.slice(0, 10) >= startDateStr)
        .forEach((s) => {
          const dateStr = s.created_at.slice(0, 10);
          if (dateMap[dateStr] !== undefined) {
            dateMap[dateStr] += s.grand_total;
          }
        });
    } else if (metric === 'profit') {
      summary.sales
        .filter((s) => s.created_at.slice(0, 10) >= startDateStr)
        .forEach((s) => {
          const dateStr = s.created_at.slice(0, 10);
          if (dateMap[dateStr] !== undefined) {
            let saleProfit = 0;
            s.lines.forEach((line) => {
              const invItem = summary.inventoryItems.find((i) => i.id === line.inventory_item_id);
              const buyPrice = invItem?.buy_price ?? 0;
              saleProfit += (line.unit_price - buyPrice) * line.quantity;
            });
            dateMap[dateStr] += saleProfit;
          }
        });
    } else if (metric === 'purchases') {
      summary.purchaseOrdersList
        .filter((po) => po.created_at.slice(0, 10) >= startDateStr)
        .forEach((po) => {
          const dateStr = po.created_at.slice(0, 10);
          if (dateMap[dateStr] !== undefined) {
            dateMap[dateStr] += po.total_cost;
          }
        });
    }

    const data = Object.entries(dateMap).map(([date, value]) => ({ date, value }));
    return { data, xKey: 'date', series: metric };
  } else {
    // Breakdown 'category'
    const catMap: Record<string, number> = {};

    if (metric === 'sales' || metric === 'profit') {
      summary.sales
        .filter((s) => s.created_at.slice(0, 10) >= startDateStr)
        .forEach((s) => {
          s.lines.forEach((line) => {
            const med =
              summary.medicines.find((m) => m.id === line.medicine_id) ||
              summary.medicines.find(
                (m) =>
                  m.id ===
                  summary.inventoryItems.find((i) => i.id === line.inventory_item_id)?.medicine_id
              );
            const cat = med?.category || 'Uncategorized';
            let val = metric === 'sales' ? line.subtotal : 0;
            if (metric === 'profit') {
              const invItem = summary.inventoryItems.find((i) => i.id === line.inventory_item_id);
              const buyPrice = invItem?.buy_price ?? 0;
              val = (line.unit_price - buyPrice) * line.quantity;
            }
            catMap[cat] = (catMap[cat] || 0) + val;
          });
        });
    } else if (metric === 'purchases') {
      summary.purchaseOrdersList
        .filter((po) => po.created_at.slice(0, 10) >= startDateStr)
        .forEach((po) => {
          po.lines.forEach((line) => {
            const med = summary.medicines.find((m) => m.id === line.medicine_id);
            const cat = med?.category || 'Uncategorized';
            catMap[cat] = (catMap[cat] || 0) + line.unit_cost * line.quantity;
          });
        });
    } else if (metric === 'stock_value') {
      summary.inventoryItems.forEach((item) => {
        const med = summary.medicines.find((m) => m.id === item.medicine_id);
        const cat = med?.category || 'Uncategorized';
        catMap[cat] = (catMap[cat] || 0) + item.sell_price * item.quantity;
      });
    }

    const data = Object.entries(catMap)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => Number(b.value) - Number(a.value));
    return { data, xKey: 'category', series: metric };
  }
}
