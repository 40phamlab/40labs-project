export const DEFAULT_CHART_TYPE = 'line' as const;
export const DEFAULT_TIME_RANGE = '7d' as const;
export type ChartType = 'line' | 'bar' | 'area' | 'pie';
export type TimeRange = 'today' | '7d' | '30d' | '90d' | 'all' | 'custom';
