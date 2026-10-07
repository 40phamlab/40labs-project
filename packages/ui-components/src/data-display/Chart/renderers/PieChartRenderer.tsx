'use client';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { colors } from '@40labs/design-tokens';
import { ChartProps, ChartSeries } from '../types';
import { ChartTooltip } from '../ChartTooltip';

export interface PieChartRendererProps extends Omit<ChartProps, 'onDataClick'> {
  resolvedSeries: ChartSeries[];
  resolvedXAxisKey: string;
  palette: string[];
  onDataClick?: (dataPoint: any, index: number) => void;
}

export function PieChartRenderer({
  data,
  resolvedSeries,
  resolvedXAxisKey,
  height = 300,
  width = '100%',
  showTooltip = true,
  showLegend = true,
  palette,
  onDataClick,
  innerRadius = 0,
  outerRadius = 80,
  tooltipFormatter,
}: PieChartRendererProps) {
  const containerHeight = typeof height === 'number' ? height : Number(height) || 300;
  const valueKey = resolvedSeries[0]?.dataKey || 'value';
  const nameKey = resolvedXAxisKey;

  return (
    <ResponsiveContainer width={width as any} height={containerHeight}>
      <PieChart>
        {showTooltip && <Tooltip content={<ChartTooltip formatter={tooltipFormatter} />} />}
        {showLegend && (
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: 12, fontSize: 12, fontFamily: 'Inter', color: colors.textSecondary }}
          />
        )}
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          label={({ name, percent }) => `${name}: ${(((percent ?? 0)) * 100).toFixed(0)}%`}
          labelLine={false}
          onClick={(props: any, index: number) => {
            if (onDataClick && props && props.payload) {
              onDataClick(props.payload, index);
            }
          }}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={palette[index % palette.length]} stroke={colors.surfacePrimary} strokeWidth={2} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
