import * as React from 'react';

export type ChartType = 'line' | 'bar' | 'area' | 'scatter' | 'pie' | 'radar';

export interface ChartSeries {
  dataKey: string;
  name?: string;
  color?: string;
  strokeWidth?: number;
  type?: 'monotone' | 'linear' | 'step';
  fill?: string;
}

export interface ChartProps<T extends Record<string, any> = Record<string, any>> {
  data: T[];
  type?: ChartType;
  xAxisKey?: string;
  xKey?: string; // Alias for xAxisKey
  series?: string | ChartSeries | (string | ChartSeries)[];
  height?: number | string;
  width?: number | string;
  showTooltip?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  title?: string;
  subtitle?: string;
  className?: string;
  emptyMessage?: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
  error?: string;
  onDataClick?: (dataPoint: T, index: number) => void;
  innerRadius?: number | string;
  outerRadius?: number | string;
  layout?: 'horizontal' | 'vertical';
  stacked?: boolean;
  tooltipFormatter?: (value: any, name: string, item: any) => [string | number, string | number];
  xAxisLabel?: string;
  yAxisLabel?: string;
  xAxisFormatter?: (value: any) => string;
  yAxisFormatter?: (value: any) => string;
}
