// [phase: 8D] DashboardChart Component
import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { colors } from '@40labs/design-tokens';
import type {
  DashboardChartMetric,
  DashboardChartType,
  DashboardPeriod,
  ChartResult,
} from '../utils/chartData';
import {
  formatCompactNumber,
  formatXAxisDate,
  calculateXAxisInterval,
  formatMetricUnit,
  formatTooltipValue,
  calculatePointDelta,
} from '../utils/chartFormat';

export interface DashboardChartProps {
  chartResult: ChartResult;
  metric: DashboardChartMetric;
  chartType: DashboardChartType;
  period: DashboardPeriod;
  multiSeries?: boolean;
  className?: string;
}

const PALETTE = [
  colors.primary, // #16A34A (Green)
  colors.accent,  // #F97316 (Orange)
  colors.info,    // #0EA5E9 (Blue)
  '#8B5CF6',      // Violet
  '#EC4899',      // Pink
  '#14B8A6',      // Teal
  '#6366F1',      // Indigo
];

const CustomTooltip = ({ active, payload, label, metric, isCategory }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  if (isCategory) {
    const entry = payload[0];
    const catName = entry?.name || label;
    const val = entry?.value ?? 0;
    const pct = entry?.payload?.percentage;

    return (
      <div className="bg-surface-elevated border border-border rounded-md p-2.5 shadow-xl text-xs font-ui min-w-[140px] space-y-1">
        <div className="font-bold text-text border-b border-border/40 pb-1">{catName}</div>
        <div className="flex items-center justify-between gap-3 font-mono">
          <span className="text-text-muted font-ui">Thamani:</span>
          <span className="font-bold text-text">{formatTooltipValue(val, metric)}</span>
        </div>
        {pct !== undefined && (
          <div className="flex items-center justify-between gap-3 font-mono text-[10px]">
            <span className="text-text-muted font-ui">Sehemu:</span>
            <span className="font-bold text-primary">{pct}% ya jumla</span>
          </div>
        )}
      </div>
    );
  }

  const formattedDate = formatXAxisDate(String(label));
  const dataPoint = payload[0]?.payload;
  const val = payload[0]?.value ?? 0;
  const prevVal = dataPoint?.prevValue;

  const pointDelta = calculatePointDelta(val, prevVal, 'up-good');

  return (
    <div className="bg-surface-elevated border border-border rounded-md p-2.5 shadow-xl text-xs font-ui min-w-[150px] space-y-1">
      <div className="font-bold text-text-muted border-b border-border/40 pb-1 flex justify-between items-center">
        <span>{formattedDate}</span>
      </div>
      <div className="space-y-1 pt-0.5">
        {payload.map((entry: any, i: number) => {
          const name = entry.name || entry.dataKey;
          const entryVal = entry.value ?? 0;
          return (
            <div key={i} className="flex items-center justify-between gap-3 font-mono">
              <span className="text-text-muted font-ui">{name}</span>
              <span className="font-bold text-text">{formatTooltipValue(entryVal, metric)}</span>
            </div>
          );
        })}
        {payload.length === 1 && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30 text-[10px]">
            <span className="text-text-muted">vs siku iliyopita</span>
            <span
              className={`font-mono font-bold ${
                pointDelta.state === 'good'
                  ? 'text-success'
                  : pointDelta.state === 'bad'
                  ? 'text-danger'
                  : 'text-text-muted'
              }`}
            >
              {pointDelta.formattedPct}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const DashboardChart: React.FC<DashboardChartProps> = ({
  chartResult,
  metric,
  chartType,
  period,
  multiSeries = false,
  className = '',
}) => {
  const { data, isCategory, series, totalValue, hasCategoryData } = chartResult;

  // Rule: Empty or all-zero data renders inline compact "Hakuna data" state
  const isAllZero = !data || data.length === 0 || data.every((d) => (d.value ?? 0) === 0);

  if (isAllZero) {
    return (
      <div className={`h-[240px] w-full flex flex-col items-center justify-center text-text-muted bg-surface-secondary/20 rounded-[8px] border border-border/30 p-4 gap-2 ${className}`}>
        <span className="text-xs font-ui font-medium">Hakuna data ya kipindi hiki</span>
      </div>
    );
  }

  const xAxisInterval = calculateXAxisInterval(period);
  const showDots = period === '7d';

  if (chartType === 'ring' || isCategory) {
    if (!hasCategoryData) {
      return (
        <div className={`h-[240px] w-full flex flex-col items-center justify-center text-text-muted bg-surface-secondary/20 rounded-[8px] border border-border/30 p-4 gap-2 ${className}`}>
          <span className="text-xs font-ui font-medium">Hakuna data ya kategoria kwa metric hii</span>
        </div>
      );
    }

    return (
      <div className={`relative h-[240px] w-full flex items-center justify-center ${className}`}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Tooltip content={<CustomTooltip metric={metric} isCategory={true} />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Jumla</span>
          <span className="font-mono font-bold text-sm text-text">
            {formatTooltipValue(totalValue, metric)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[240px] w-full ${className}`}>
      <ResponsiveContainer width="100%" height={240}>
        {chartType === 'bar' ? (
          <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.borderSubtle} opacity={0.5} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={{ stroke: colors.borderDefault }}
              tickFormatter={formatXAxisDate}
              interval={xAxisInterval}
            />
            <YAxis
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCompactNumber}
            />
            <Tooltip content={<CustomTooltip metric={metric} isCategory={false} />} />
            {multiSeries && (
              <Legend
                wrapperStyle={{ paddingTop: 8, fontSize: 11, fontFamily: 'Inter' }}
              />
            )}
            {series.map((s, idx) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.color || PALETTE[idx % PALETTE.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        ) : chartType === 'area' ? (
          <AreaChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.borderSubtle} opacity={0.5} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={{ stroke: colors.borderDefault }}
              tickFormatter={formatXAxisDate}
              interval={xAxisInterval}
            />
            <YAxis
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCompactNumber}
            />
            <Tooltip content={<CustomTooltip metric={metric} isCategory={false} />} />
            {multiSeries && (
              <Legend
                wrapperStyle={{ paddingTop: 8, fontSize: 11, fontFamily: 'Inter' }}
              />
            )}
            {series.map((s, idx) => {
              const strokeColor = s.color || PALETTE[idx % PALETTE.length];
              return (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={strokeColor}
                  fill={strokeColor}
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={showDots ? { r: 3, fill: strokeColor } : false}
                />
              );
            })}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.borderSubtle} opacity={0.5} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={{ stroke: colors.borderDefault }}
              tickFormatter={formatXAxisDate}
              interval={xAxisInterval}
            />
            <YAxis
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCompactNumber}
            />
            <Tooltip content={<CustomTooltip metric={metric} isCategory={false} />} />
            {multiSeries && (
              <Legend
                wrapperStyle={{ paddingTop: 8, fontSize: 11, fontFamily: 'Inter' }}
              />
            )}
            {series.map((s, idx) => {
              const strokeColor = s.color || PALETTE[idx % PALETTE.length];
              return (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={strokeColor}
                  strokeWidth={2}
                  dot={showDots ? { r: 3, fill: strokeColor } : false}
                  activeDot={{ r: 5, stroke: colors.surfacePrimary, strokeWidth: 2 }}
                />
              );
            })}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
