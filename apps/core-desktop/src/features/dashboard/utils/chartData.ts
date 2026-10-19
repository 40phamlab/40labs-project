// [phase: 8D] Extended Chart Data Builder for 4 Domain Metrics
import type { DashboardSummary } from '../../../devData/dashboard/summary';

export type DashboardChartMetric = 'sales' | 'profit' | 'customers' | 'stock' | 'purchases' | 'stock_value';
export type DashboardMetric = DashboardChartMetric;
export type DashboardChartType = 'bar' | 'line' | 'area' | 'ring' | 'pie' | 'radar';
export type DashboardPeriod = '7d' | '30d' | '90d';
export type DashboardBreakdown = 'time' | 'category';

export const chartCompatibilityMap: Record<DashboardBreakdown, DashboardChartType[]> = {
  time: ['bar', 'line', 'area'],
  category: ['bar', 'ring', 'pie'],
};

export interface ChartSeriesDefinition {
  dataKey: string;
  name: string;
  color: string;
  unit: 'money' | 'count';
  yAxisId: 'left' | 'right';
}

export const UNIFIED_SERIES: ChartSeriesDefinition[] = [
  { dataKey: 'sales', name: 'Mauzo', color: '#16A34A', unit: 'money', yAxisId: 'left' },
  { dataKey: 'profit', name: 'Faida', color: '#F97316', unit: 'money', yAxisId: 'left' },
  { dataKey: 'purchases', name: 'Manunuzi', color: '#0EA5E9', unit: 'money', yAxisId: 'left' },
  { dataKey: 'stock_value', name: 'Akiba', color: '#14B8A6', unit: 'money', yAxisId: 'left' },
  { dataKey: 'customers', name: 'Wateja', color: '#8B5CF6', unit: 'count', yAxisId: 'right' },
  { dataKey: 'lab', name: 'Maabara', color: '#EC4899', unit: 'count', yAxisId: 'right' },
];

export interface UnifiedChartDataPoint {
  date: string;
  sales: number;
  profit: number;
  purchases: number;
  customers: number;
  stock_value: number;
  lab: number;
  [key: string]: any;
}

export function buildUnifiedChartData(
  summary: DashboardSummary,
  period: DashboardPeriod = '30d'
): { data: UnifiedChartDataPoint[]; series: ChartSeriesDefinition[]; totalValues: Record<string, number> } {
  const daysCount = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysCount);
  const startDateStr = startDate.toISOString().slice(0, 10);

  const dateMap: Record<string, { sales: number; profit: number; purchases: number; customers: number; stock_value: number; lab: number }> = {};

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dateMap[dateStr] = { sales: 0, profit: 0, purchases: 0, customers: 0, stock_value: 0, lab: 0 };
  }

  // 1. Sales & Profit
  (summary.sales || [])
    .filter((s) => s?.created_at && s.created_at.slice(0, 10) >= startDateStr)
    .forEach((s) => {
      const dateStr = s.created_at.slice(0, 10);
      if (dateMap[dateStr]) {
        const grandTotal = s.grand_total ?? 0;
        dateMap[dateStr].sales += grandTotal;
        dateMap[dateStr].customers += 1;

        let saleProfit = 0;
        (s.lines || []).forEach((line) => {
          const invItem = (summary.inventoryItems || []).find((i) => i.id === line.inventory_item_id || i.medicine_id === line.medicine_id);
          const buyPrice = invItem?.buy_price ?? 0;
          saleProfit += ((line.unit_price ?? 0) - buyPrice) * (line.quantity ?? 0);
        });
        dateMap[dateStr].profit += saleProfit;
      }
    });

  // 2. Purchases
  (summary.purchaseOrdersList || [])
    .filter((po) => po?.created_at && po.created_at.slice(0, 10) >= startDateStr)
    .forEach((po) => {
      const dateStr = po.created_at.slice(0, 10);
      if (dateMap[dateStr]) {
        const poTotal = po.total ?? (po.lines || []).reduce((sum, l) => sum + (l.quantity ?? 0) * (l.unit_cost ?? 0), 0);
        dateMap[dateStr].purchases += poTotal;
      }
    });

  // 3. Lab Orders
  (summary.labOrdersList || [])
    .filter((lo) => lo?.created_at && lo.created_at.slice(0, 10) >= startDateStr)
    .forEach((lo) => {
      const dateStr = lo.created_at.slice(0, 10);
      if (dateMap[dateStr]) {
        dateMap[dateStr].lab += 1;
      }
    });

  // 4. Stock Value
  const totalStockVal = (summary.inventoryItems || []).reduce(
    (sum, item) => sum + (item.sell_price ?? 0) * (item.quantity ?? 0),
    0
  );

  const data: UnifiedChartDataPoint[] = Object.entries(dateMap).map(([date, vals]) => ({
    date,
    sales: Math.round(vals.sales),
    profit: Math.round(vals.profit),
    purchases: Math.round(vals.purchases),
    customers: vals.customers,
    stock_value: Math.round(totalStockVal),
    lab: vals.lab,
  }));

  const totalValues: Record<string, number> = {
    sales: data.reduce((acc, d) => acc + d.sales, 0),
    profit: data.reduce((acc, d) => acc + d.profit, 0),
    purchases: data.reduce((acc, d) => acc + d.purchases, 0),
    customers: data.reduce((acc, d) => acc + d.customers, 0),
    stock_value: totalStockVal,
    lab: data.reduce((acc, d) => acc + d.lab, 0),
  };

  return {
    data,
    series: UNIFIED_SERIES,
    totalValues,
  };
}

export interface ChartDataPoint {
  date: string;
  value: number;
  prevValue?: number | null;
  [key: string]: any;
}

export interface CategoryDataPoint {
  category: string;
  value: number;
  percentage?: number;
  [key: string]: any;
}

export interface BuildChartDataOptions {
  metric: DashboardChartMetric;
  chartType?: DashboardChartType;
  breakdown?: DashboardBreakdown;
  period?: DashboardPeriod;
  nowDate?: Date;
  multiSeries?: boolean; // When true, includes both Sales and Profit
}

export interface ChartSeriesItem {
  dataKey: string;
  name: string;
  color?: string;
}

export interface ChartResult {
  data: (ChartDataPoint | CategoryDataPoint)[];
  xKey: string;
  isCategory: boolean;
  series: ChartSeriesItem[];
  totalValue: number;
  hasCategoryData: boolean;
}

export function buildChartData(
  summary: DashboardSummary,
  options: BuildChartDataOptions
): ChartResult {
  const { metric, chartType = 'bar', period = '30d', multiSeries = false } = options;
  const isCategory = chartType === 'ring' || chartType === 'pie' || options.breakdown === 'category';
  const daysCount = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const allDates = [
    ...(summary.sales || []).map((s) => s.created_at),
    ...(summary.purchaseOrdersList || []).map((po) => po.created_at),
  ]
    .map((d) => new Date(d!).getTime())
    .filter((t) => !isNaN(t));

  const now =
    options?.nowDate ?? (allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date());

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysCount);
  const startDateStr = startDate.toISOString().slice(0, 10);

  if (isCategory) {
    // Ring / Donut view by Medicine Category
    const catMap: Record<string, number> = {};

    if (metric === 'sales' || metric === 'profit') {
      (summary.sales || [])
        .filter((s) => s.created_at.slice(0, 10) >= startDateStr)
        .forEach((s) => {
          (s.lines || []).forEach((line) => {
            const med =
              summary.medicines.find((m) => m.id === line.medicine_id) ||
              summary.medicines.find(
                (m) =>
                  m.id ===
                  summary.inventoryItems.find((i) => i.id === line.inventory_item_id)?.medicine_id
              );
            const cat = med?.category || 'General';
            let val = line.subtotal ?? 0;
            if (metric === 'profit') {
              const invItem = summary.inventoryItems.find((i) => i.id === line.inventory_item_id);
              const buyPrice = invItem?.buy_price ?? 0;
              val = ((line.unit_price ?? 0) - buyPrice) * (line.quantity ?? 0);
            }
            catMap[cat] = (catMap[cat] || 0) + val;
          });
        });
    } else if (metric === 'stock' || metric === 'stock_value') {
      (summary.inventoryItems || []).forEach((item) => {
        const med = summary.medicines.find((m) => m.id === item.medicine_id);
        const cat = med?.category || 'General';
        const val = (item.sell_price ?? 0) * (item.quantity ?? 0);
        catMap[cat] = (catMap[cat] || 0) + val;
      });
    }

    const totalVal = Object.values(catMap).reduce((acc, v) => acc + v, 0);

    const data: CategoryDataPoint[] = Object.entries(catMap)
      .map(([category, value]) => ({
        category,
        value: Math.round(value),
        percentage: totalVal > 0 ? Math.round((value / totalVal) * 100) : 0,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      data,
      xKey: 'category',
      isCategory: true,
      series: [{ dataKey: 'value', name: metric === 'sales' ? 'Mauzo' : metric === 'profit' ? 'Faida' : 'Akiba' }],
      totalValue: totalVal,
      hasCategoryData: data.length > 0,
    };
  }

  // Time-series view
  const dateMap: Record<string, { value: number; sales?: number; profit?: number }> = {};

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dateMap[dateStr] = { value: 0, sales: 0, profit: 0 };
  }

  // Populate time series data
  if (metric === 'sales' || multiSeries) {
    (summary.sales || [])
      .filter((s) => s.created_at.slice(0, 10) >= startDateStr)
      .forEach((s) => {
        const dateStr = s.created_at.slice(0, 10);
        if (dateMap[dateStr]) {
          dateMap[dateStr].sales = (dateMap[dateStr].sales || 0) + (s.grand_total ?? 0);
          if (metric === 'sales' && !multiSeries) {
            dateMap[dateStr].value += s.grand_total ?? 0;
          }
        }
      });
  }

  if (metric === 'profit' || multiSeries) {
    (summary.sales || [])
      .filter((s) => s.created_at.slice(0, 10) >= startDateStr)
      .forEach((s) => {
        const dateStr = s.created_at.slice(0, 10);
        if (dateMap[dateStr]) {
          let saleProfit = 0;
          (s.lines || []).forEach((line) => {
            const invItem = summary.inventoryItems.find((i) => i.id === line.inventory_item_id);
            const buyPrice = invItem?.buy_price ?? 0;
            saleProfit += ((line.unit_price ?? 0) - buyPrice) * (line.quantity ?? 0);
          });
          dateMap[dateStr].profit = (dateMap[dateStr].profit || 0) + saleProfit;
          if (metric === 'profit' && !multiSeries) {
            dateMap[dateStr].value += saleProfit;
          }
        }
      });
  }

  if (metric === 'customers') {
    (summary.sales || [])
      .filter((s) => s.created_at.slice(0, 10) >= startDateStr)
      .forEach((s) => {
        const dateStr = s.created_at.slice(0, 10);
        if (dateMap[dateStr]) {
          dateMap[dateStr].value += 1;
        }
      });
  }

  if (metric === 'stock' || metric === 'stock_value') {
    const totalStockVal = (summary.inventoryItems || []).reduce(
      (sum, item) => sum + (item.sell_price ?? 0) * (item.quantity ?? 0),
      0
    );
    Object.keys(dateMap).forEach((d) => {
      dateMap[d].value = totalStockVal;
    });
  }

  const dateEntries = Object.entries(dateMap);
  let totalVal = 0;

  const data: ChartDataPoint[] = dateEntries.map(([date, valObj], idx) => {
    const val = Math.round(valObj.value);
    totalVal += val;
    const prevVal = idx > 0 ? Math.round(dateEntries[idx - 1][1].value) : null;

    return {
      date,
      value: val,
      sales: Math.round(valObj.sales || 0),
      profit: Math.round(valObj.profit || 0),
      prevValue: prevVal,
    };
  });

  const series = multiSeries
    ? [
        { dataKey: 'sales', name: 'Mauzo', color: '#16A34A' },
        { dataKey: 'profit', name: 'Faida', color: '#F97316' },
      ]
    : [{ dataKey: 'value', name: metric === 'sales' ? 'Mauzo' : metric === 'profit' ? 'Faida' : metric === 'customers' ? 'Wateja' : 'Akiba' }];

  const hasCategory = metric !== 'customers' && (summary.inventoryItems?.length ?? 0) > 0;

  return {
    data,
    xKey: 'date',
    isCategory: false,
    series,
    totalValue: totalVal,
    hasCategoryData: hasCategory,
  };
}
