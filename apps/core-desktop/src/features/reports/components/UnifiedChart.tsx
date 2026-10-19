import * as React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { colors } from '@40labs/design-tokens';
import { ChartType, Granularity } from '../state/useReportChartState';
import { ReportTabId, SERIES_BY_TAB } from '../config/seriesRegistry';
import { ChartOptionsMenu } from './ChartOptionsMenu';
import { ChartTooltip } from './ChartTooltip';
import { ChartEmptyState } from './ChartEmptyState';
import { t } from '@40labs/i18n';

export interface UnifiedChartProps {
  categoryId: ReportTabId;
  chartType: ChartType;
  granularity: Granularity;
  seriesVisibility: Record<string, boolean>;
  compare: boolean;
  onSelectChartType: (type: ChartType) => void;
  onSelectGranularity: (g: Granularity) => void;
  onToggleSeries: (key: string) => void;
  onToggleCompare: (compare: boolean) => void;
  onReset: () => void;
  primaryData: any[];
  previousData?: any[];
  hasTimestamps?: boolean;
}

const getTokenColor = (token: string): string => {
  switch (token) {
    case 'primary':
      return colors.primary; // #16A34A
    case 'accent':
    case 'warning':
      return '#F97316';
    case 'danger':
      return colors.danger; // #EF4444
    case 'info':
      return colors.info; // #0EA5E9
    default:
      return '#8B5CF6';
  }
};

const formatTzsCompact = (val: number): string => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return `${val}`;
};

export const UnifiedChart: React.FC<UnifiedChartProps> = ({
  categoryId,
  chartType,
  granularity,
  seriesVisibility,
  compare,
  onSelectChartType,
  onSelectGranularity,
  onToggleSeries,
  onToggleCompare,
  onReset,
  primaryData,
  previousData = [],
  hasTimestamps = false,
}) => {
  const allSeries = SERIES_BY_TAB[categoryId] || [];

  const chartData = React.useMemo(() => {
    if (!primaryData || primaryData.length === 0) return [];
    return primaryData.map((item, idx) => {
      const newItem: Record<string, any> = { ...item };
      if (compare && previousData[idx]) {
        Object.keys(previousData[idx]).forEach((k) => {
          if (k !== 'label') {
            newItem[`${k}_prev`] = previousData[idx][k];
          }
        });
      }
      return newItem;
    });
  }, [primaryData, previousData, compare]);

  const hasData = chartData.length > 0 && chartData.some((d) => d.label !== 'No Data');

  const visibleSeries = allSeries.filter((s) => seriesVisibility[s.key] ?? s.defaultVisible);
  const hasRightAxisSeries = visibleSeries.some((s) => s.axis === 'right');

  return (
    <div className="bg-panel rounded-[12px] border border-border/50 p-4 elevation-raised flex flex-col w-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-heading text-sm font-semibold text-text">
            {t(`reports.tab.${categoryId}` as any)} Analytics
          </h3>
          {/* Clickable Legend in Header */}
          <div className="flex items-center gap-3 ml-4 flex-wrap">
            {allSeries.map((s) => {
              const isVisible = seriesVisibility[s.key] ?? s.defaultVisible;
              const color = getTokenColor(s.colorToken);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onToggleSeries(s.key)}
                  className={`flex items-center gap-1.5 text-xs font-ui cursor-pointer transition-opacity ${
                    isVisible ? 'opacity-100 font-medium text-text-primary' : 'opacity-40 text-text-muted line-through'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span>{t(s.labelKey as any)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ChartOptionsMenu
            chartType={chartType}
            onSelectChartType={onSelectChartType}
            granularity={granularity}
            onSelectGranularity={onSelectGranularity}
            series={allSeries}
            seriesVisibility={seriesVisibility}
            onToggleSeries={onToggleSeries}
            compare={compare}
            onToggleCompare={onToggleCompare}
            onReset={onReset}
            showHourGranularity={hasTimestamps}
          />
        </div>
      </div>

      {/* Chart Body */}
      <div className="w-full min-h-[320px]">
        {!hasData ? (
          <ChartEmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'Inter' }}
                stroke="#CBD5E1"
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                tickFormatter={(val: number) => formatTzsCompact(val)}
                tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                stroke="#CBD5E1"
              />
              {hasRightAxisSeries && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                  stroke="#CBD5E1"
                />
              )}
              <Tooltip content={<ChartTooltip />} />

              {visibleSeries.map((s) => {
                const color = getTokenColor(s.colorToken);
                const isArea = chartType === 'area' || (chartType === 'combo' && s.kind === 'area');
                const isBar = chartType === 'bar' || chartType === 'stacked' || (chartType === 'combo' && s.kind === 'bar');
                const yAxisId = s.axis === 'right' && hasRightAxisSeries ? 'right' : 'left';
                const labelText = t(s.labelKey as any);

                if (isArea) {
                  return (
                    <Area
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={labelText}
                      yAxisId={yAxisId}
                      fill={color}
                      stroke={color}
                      fillOpacity={0.2}
                    />
                  );
                }

                if (isBar) {
                  return (
                    <Bar
                      key={s.key}
                      dataKey={s.key}
                      name={labelText}
                      yAxisId={yAxisId}
                      fill={color}
                      stackId={chartType === 'stacked' ? 'stack' : undefined}
                    />
                  );
                }

                return (
                  <React.Fragment key={s.key}>
                    <Line
                      type="monotone"
                      dataKey={s.key}
                      name={labelText}
                      yAxisId={yAxisId}
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray={s.dashed ? '4 4' : undefined}
                      dot={chartType !== 'ring'}
                    />
                    {compare && (
                      <Line
                        type="monotone"
                        dataKey={`${s.key}_prev`}
                        name={`${labelText} (Prev)`}
                        yAxisId={yAxisId}
                        stroke={color}
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        strokeOpacity={0.4}
                        dot={false}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
