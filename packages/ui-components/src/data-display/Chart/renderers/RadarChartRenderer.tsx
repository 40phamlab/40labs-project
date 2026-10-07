'use client';

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';
import { colors } from '@40labs/design-tokens';
import { ChartProps, ChartSeries } from '../types';
import { ChartTooltip } from '../ChartTooltip';

export interface RadarChartRendererProps extends ChartProps {
  resolvedSeries: ChartSeries[];
  resolvedXAxisKey: string;
  palette: string[];
  onDataClick?: (dataPoint: any, index: number) => void;
}

export function RadarChartRenderer({
  data,
  resolvedSeries,
  resolvedXAxisKey,
  height = 300,
  width = '100%',
  showTooltip = true,
  showLegend = true,
  palette,
  tooltipFormatter,
}: RadarChartRendererProps) {
  const containerHeight = typeof height === 'number' ? height : Number(height) || 300;

  return (
    <ResponsiveContainer width={width as any} height={containerHeight}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
        <PolarGrid stroke={colors.borderDefault} />
        <PolarAngleAxis
          dataKey={resolvedXAxisKey}
          tick={{ fill: colors.textMuted, fontSize: 11, fontFamily: 'Inter' }}
        />
        <PolarRadiusAxis stroke={colors.textMuted} />
        {showTooltip && <Tooltip content={<ChartTooltip formatter={tooltipFormatter} />} />}
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 12, fontSize: 12, fontFamily: 'Inter', color: colors.textSecondary }}
          />
        )}
        {resolvedSeries.map((s, idx) => {
          const strokeColor = s.color || palette[idx % palette.length];
          const fillColor = s.fill || strokeColor;
          return (
            <Radar
              key={`radar-${s.dataKey}`}
              name={s.name || s.dataKey}
              dataKey={s.dataKey}
              stroke={strokeColor}
              fill={fillColor}
              fillOpacity={0.4}
            />
          );
        })}
      </RadarChart>
    </ResponsiveContainer>
  );
}
