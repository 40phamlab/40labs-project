// [phase: 8D] DashboardChart Component (Unified Multi-Series)
import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { colors } from '@40labs/design-tokens';
import type {
  DashboardChartType,
  DashboardPeriod,
  ChartSeriesDefinition,
} from '../utils/chartData';
import {
  formatCompactNumber,
  formatXAxisDate,
  calculateXAxisInterval,
} from '../utils/chartFormat';

export interface DashboardChartProps {
  data: any[];
  series: ChartSeriesDefinition[];
  chartType: DashboardChartType;
  period: DashboardPeriod;
  hiddenSeries?: string[];
  className?: string;
}

const UnifiedCustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const formattedDate = formatXAxisDate(String(label));

  return (
    <div className="bg-surface-elevated border border-border rounded-md p-2.5 shadow-xl text-xs font-ui min-w-[160px] space-y-1.5 z-50">
      <div className="font-bold text-text-muted border-b border-border/40 pb-1 flex justify-between items-center">
        <span>{formattedDate}</span>
      </div>
      <div className="space-y-1 pt-0.5">
        {payload.map((entry: any, i: number) => {
          const name = entry.name || entry.dataKey;
          const val = entry.value ?? 0;
          const color = entry.color || entry.stroke || entry.fill;
          const isMoney = entry.dataKey !== 'customers' && entry.dataKey !== 'lab';
          const formattedVal = isMoney
            ? `TZS ${new Intl.NumberFormat('en-US').format(Math.round(val))}`
            : new Intl.NumberFormat('en-US').format(val);

          return (
            <div key={i} className="flex items-center justify-between gap-3 font-mono">
              <span className="flex items-center gap-1.5 text-text-muted font-ui">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                {name}:
              </span>
              <span className="font-bold text-text">{formattedVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DashboardChart: React.FC<DashboardChartProps> = ({
  data,
  series,
  chartType,
  period,
  hiddenSeries = [],
  className = '',
}) => {
  const isAllZero =
    !data ||
    data.length === 0 ||
    data.every((d) =>
      Object.values(d).every((v) => (typeof v === 'number' ? v === 0 : true))
    );

  if (isAllZero) {
    return (
      <div
        className={`h-[240px] w-full flex flex-col items-center justify-center text-text-muted bg-surface-secondary/20 rounded-[8px] border border-border/30 p-4 gap-2 ${className}`}
      >
        <span className="text-xs font-ui font-medium">Hakuna data ya kipindi hiki</span>
      </div>
    );
  }

  const xAxisInterval = calculateXAxisInterval(period);
  const showDots = period === '7d';

  const visibleSeries = series.filter((s) => !hiddenSeries.includes(s.dataKey));
  const hasLeftAxis = visibleSeries.some((s) => s.yAxisId === 'left');
  const hasRightAxis = visibleSeries.some((s) => s.yAxisId === 'right');

  return (
    <div className={`h-[240px] w-full ${className}`}>
      <ResponsiveContainer width="100%" height={240}>
        {chartType === 'bar' ? (
          <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.borderSubtle}
              opacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={{ stroke: colors.borderDefault }}
              tickFormatter={formatXAxisDate}
              interval={xAxisInterval}
            />
            {hasLeftAxis && (
              <YAxis
                yAxisId="left"
                stroke={colors.textMuted}
                tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactNumber}
              />
            )}
            {hasRightAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={colors.textMuted}
                tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => String(v)}
              />
            )}
            <Tooltip content={<UnifiedCustomTooltip />} />
            {series.map((s) => (
              <Bar
                key={s.dataKey}
                yAxisId={s.yAxisId}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.color}
                hide={hiddenSeries.includes(s.dataKey)}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        ) : chartType === 'area' ? (
          <AreaChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.borderSubtle}
              opacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={{ stroke: colors.borderDefault }}
              tickFormatter={formatXAxisDate}
              interval={xAxisInterval}
            />
            {hasLeftAxis && (
              <YAxis
                yAxisId="left"
                stroke={colors.textMuted}
                tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactNumber}
              />
            )}
            {hasRightAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={colors.textMuted}
                tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => String(v)}
              />
            )}
            <Tooltip content={<UnifiedCustomTooltip />} />
            {series.map((s) => (
              <Area
                key={s.dataKey}
                yAxisId={s.yAxisId}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.15}
                strokeWidth={2}
                hide={hiddenSeries.includes(s.dataKey)}
                dot={showDots ? { r: 3, fill: s.color } : false}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.borderSubtle}
              opacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={{ stroke: colors.borderDefault }}
              tickFormatter={formatXAxisDate}
              interval={xAxisInterval}
            />
            {hasLeftAxis && (
              <YAxis
                yAxisId="left"
                stroke={colors.textMuted}
                tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactNumber}
              />
            )}
            {hasRightAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={colors.textMuted}
                tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => String(v)}
              />
            )}
            <Tooltip content={<UnifiedCustomTooltip />} />
            {series.map((s) => (
              <Line
                key={s.dataKey}
                yAxisId={s.yAxisId}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                hide={hiddenSeries.includes(s.dataKey)}
                dot={showDots ? { r: 3, fill: s.color } : false}
                activeDot={{ r: 5, stroke: colors.surfacePrimary, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
