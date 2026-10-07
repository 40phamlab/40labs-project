'use client';

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { colors } from '@40labs/design-tokens';
import { ChartProps, ChartSeries } from '../types';
import { ChartTooltip } from '../ChartTooltip';

export interface ScatterChartRendererProps extends Omit<ChartProps, 'onDataClick'> {
  resolvedSeries: ChartSeries[];
  resolvedXAxisKey: string;
  palette: string[];
  onDataClick?: (dataPoint: any, index: number) => void;
}

export function ScatterChartRenderer({
  data,
  resolvedSeries,
  resolvedXAxisKey,
  height = 300,
  width = '100%',
  showTooltip = true,
  showLegend = true,
  showGrid = true,
  palette,
  onDataClick,
  tooltipFormatter,
  xAxisFormatter,
  yAxisFormatter,
}: ScatterChartRendererProps) {
  const containerHeight = typeof height === 'number' ? height : Number(height) || 300;
  const ySeries = resolvedSeries[0] || { dataKey: 'value' };
  const scatterColor = ySeries.color || palette[0];

  return (
    <ResponsiveContainer width={width as any} height={containerHeight}>
      <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.borderSubtle}
            opacity={0.6}
          />
        )}
        <XAxis
          dataKey={resolvedXAxisKey}
          type="category"
          name={resolvedXAxisKey}
          stroke={colors.textMuted}
          tick={{ fill: colors.textMuted, fontSize: 11, fontFamily: 'Inter' }}
          allowDuplicatedCategory={false}
          tickFormatter={xAxisFormatter}
        />
        <YAxis
          dataKey={ySeries.dataKey}
          name={ySeries.name || ySeries.dataKey}
          stroke={colors.textMuted}
          tick={{ fill: colors.textMuted, fontSize: 11, fontFamily: 'Inter' }}
          tickFormatter={yAxisFormatter}
        />
        {showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip formatter={tooltipFormatter} />} />}
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 12, fontSize: 12, fontFamily: 'Inter', color: colors.textSecondary }}
          />
        )}
        <Scatter
          name={ySeries.name || ySeries.dataKey}
          data={data}
          fill={scatterColor}
          onClick={(props: any) => {
            if (onDataClick && props && props.payload) {
              const dataIndex = data.findIndex((d) => d === props.payload);
              onDataClick(props.payload, dataIndex !== -1 ? dataIndex : 0);
            }
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
