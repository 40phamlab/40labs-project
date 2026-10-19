// [phase: 8D] Extended Chart Data Builder for Business Analytics
import type { DashboardSummary } from '../../../devData/dashboard/summary';

export type DashboardChartMetric = 'sales' | 'profit' | 'customers' | 'stock' | 'purchases' | 'stock_value';
export type DashboardMetric = DashboardChartMetric;
export type DashboardChartType = 'bar' | 'line' | 'area' | 'stackedBar' | 'stackedArea' | 'pie' | 'donut';
export type DashboardPeriod = '7d' | '30d' | '90d';
export type DashboardBreakdown = 'time' | 'category';

export type AnalyticsPeriod = 'today' | '7d' | '30d' | '90d' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';
export type TimeGrouping = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ChartScale = 'auto' | 'linear' | 'log';

export interface ChartSettingsOptions {
  period?: AnalyticsPeriod;
  grouping?: TimeGrouping;
  scale?: ChartScale;
  customStartDate?: string;
  customEndDate?: string;
}

export const chartCompatibilityMap: Record<DashboardBreakdown, DashboardChartType[]> = {
  time: ['bar', 'line', 'area', 'stackedBar', 'stackedArea'],
  category: ['bar', 'pie', 'donut'],
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

export function buildAnalyticsChartData(
  summary: DashboardSummary,
  settings: ChartSettingsOptions
): {
  data: UnifiedChartDataPoint[];
  pieData: { name: string; value: number; color: string }[];
  series: ChartSeriesDefinition[];
  totalValues: Record<string, number>;
  canUseLog: boolean;
} {
  const period = settings.period || '30d';
  const grouping = settings.grouping || 'daily';

  let startDate = new Date();
  let endDate = new Date();
  let isHourly = grouping === 'hourly' || period === 'today';
  let isMonthly = grouping === 'monthly' || period === 'thisYear';
  let isWeekly = grouping === 'weekly';

  if (period === 'today') {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    isHourly = true;
  } else if (period === '7d') {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === '30d') {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  } else if (period === '90d') {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
  } else if (period === 'thisMonth') {
    startDate = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  } else if (period === 'lastMonth') {
    const now = new Date();
    startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59));
  } else if (period === 'thisYear') {
    startDate = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
    isMonthly = true;
  } else if (period === 'custom' && settings.customStartDate && settings.customEndDate) {
    startDate = new Date(settings.customStartDate);
    endDate = new Date(settings.customEndDate);
  } else {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  }

  const bucketMap: Record<string, { sales: number; profit: number; purchases: number; customers: number; stock_value: number; lab: number }> = {};

  if (isHourly) {
    for (let h = 0; h < 24; h++) {
      const key = `${String(h).padStart(2, '0')}:00`;
      bucketMap[key] = { sales: 0, profit: 0, purchases: 0, customers: 0, stock_value: 0, lab: 0 };
    }
  } else if (isMonthly && period === 'thisYear') {
    for (let m = 0; m < 12; m++) {
      const d = new Date(Date.UTC(startDate.getUTCFullYear(), m, 1));
      const key = d.toISOString().slice(0, 7);
      bucketMap[key] = { sales: 0, profit: 0, purchases: 0, customers: 0, stock_value: 0, lab: 0 };
    }
  } else {
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 30;
    const actualDays = Math.min(Math.max(diffDays, 1), 365);
    for (let i = actualDays - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      let key = d.toISOString().slice(0, 10);
      if (isMonthly) {
        key = key.slice(0, 7);
      }
      bucketMap[key] = { sales: 0, profit: 0, purchases: 0, customers: 0, stock_value: 0, lab: 0 };
    }
  }

  // Populate data
  (summary.sales || [])
    .filter((s) => s?.created_at && s.created_at >= startDate.toISOString())
    .forEach((s) => {
      let key = s.created_at.slice(0, 10);
      if (isHourly) {
        const hour = new Date(s.created_at).getHours();
        key = `${String(hour).padStart(2, '0')}:00`;
      } else if (isMonthly) {
        key = s.created_at.slice(0, 7);
      }
      if (bucketMap[key]) {
        const grandTotal = s.grand_total ?? 0;
        bucketMap[key].sales += grandTotal;
        bucketMap[key].customers += 1;

        let saleProfit = 0;
        (s.lines || []).forEach((line) => {
          const invItem = (summary.inventoryItems || []).find((i) => i.id === line.inventory_item_id || i.medicine_id === line.medicine_id);
          const buyPrice = invItem?.buy_price ?? 0;
          saleProfit += ((line.unit_price ?? 0) - buyPrice) * (line.quantity ?? 0);
        });
        bucketMap[key].profit += saleProfit;
      }
    });

  (summary.purchaseOrdersList || [])
    .filter((po) => po?.created_at && po.created_at >= startDate.toISOString())
    .forEach((po) => {
      let key = po.created_at.slice(0, 10);
      if (isHourly) {
        const hour = new Date(po.created_at).getHours();
        key = `${String(hour).padStart(2, '0')}:00`;
      } else if (isMonthly) {
        key = po.created_at.slice(0, 7);
      }
      if (bucketMap[key]) {
        const poTotal = po.total ?? (po.lines || []).reduce((sum, l) => sum + (l.quantity ?? 0) * (l.unit_cost ?? 0), 0);
        bucketMap[key].purchases += poTotal;
      }
    });

  (summary.labOrdersList || [])
    .filter((lo) => lo?.created_at && lo.created_at >= startDate.toISOString())
    .forEach((lo) => {
      let key = lo.created_at.slice(0, 10);
      if (isHourly) {
        const hour = new Date(lo.created_at).getHours();
        key = `${String(hour).padStart(2, '0')}:00`;
      } else if (isMonthly) {
        key = lo.created_at.slice(0, 7);
      }
      if (bucketMap[key]) {
        bucketMap[key].lab += 1;
      }
    });

  const totalStockVal = (summary.inventoryItems || []).reduce(
    (sum, item) => sum + (item.sell_price ?? 0) * (item.quantity ?? 0),
    0
  );

  const data = Object.entries(bucketMap).map(([date, vals]) => ({
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

  const pieData = UNIFIED_SERIES.map((s) => ({
    name: s.name,
    value: totalValues[s.dataKey] || 0,
    color: s.color,
  })).filter((d) => d.value > 0);

  const allValues = data.flatMap((d) => [d.sales, d.profit, d.purchases, d.customers, d.stock_value, d.lab]);
  const canUseLog = allValues.length > 0 && allValues.every((v) => v > 0);

  return {
    data,
    pieData,
    series: UNIFIED_SERIES,
    totalValues,
    canUseLog,
  };
}

export function buildUnifiedChartData(
  summary: DashboardSummary,
  period: DashboardPeriod = '30d'
): { data: UnifiedChartDataPoint[]; series: ChartSeriesDefinition[]; totalValues: Record<string, number> } {
  const analytics = buildAnalyticsChartData(summary, { period: period as AnalyticsPeriod });
  return {
    data: analytics.data,
    series: analytics.series,
    totalValues: analytics.totalValues,
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
  multiSeries?: boolean;
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

  const dateMap: Record<string, { value: number; sales?: number; profit?: number }> = {};

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dateMap[dateStr] = { value: 0, sales: 0, profit: 0 };
  }

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
