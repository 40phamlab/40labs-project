// [phase: 8D] Additive dashboard KPI types

export type DeltaPolarity = 'up-good' | 'down-good';

export interface KpiDelta {
  pct: number | null;            // null when previous period = 0 → UI shows "—"
  direction: 'up' | 'down' | 'flat';
  polarity: DeltaPolarity;       // expiry & balances = 'down-good'
  compareKey: 'vs_yesterday' | 'vs_last_month';
}

export interface KpiHistoryPoint {
  date: string;
  value: number;
  pct: number | null;
}

export interface DashboardKpiBreakdownItem {
  labelKey: string;
  value: number;
  format: 'money' | 'count';
}

export interface DashboardKpi {
  id: 'sales' | 'profit' | 'customers' | 'stock' | 'expiry' | 'lab' | 'balances' | 'purchases';
  value: number;
  format: 'money' | 'count';
  delta: KpiDelta;
  spark: number[];                       // 7 points, oldest → newest
  history: KpiHistoryPoint[];            // last 5 days for tooltip
  breakdown: DashboardKpiBreakdownItem[];
}
