import * as React from 'react';
import { Chart, defaultChartColors } from '@40labs/ui-components';
import { colors } from '@40labs/design-tokens';
import { t } from '@40labs/i18n';
import type { DashboardSummary } from '../../../devData/dashboard/summary';
import {
  buildChartData,
  chartCompatibilityMap,
  DashboardMetric,
  DashboardChartType,
  DashboardPeriod,
  DashboardBreakdown,
} from '../utils/chartData';

interface OverviewChartPanelProps {
  summary: DashboardSummary;
}

const ringColors = defaultChartColors.filter((c) => c !== colors.danger);

export const OverviewChartPanel: React.FC<OverviewChartPanelProps> = ({ summary }) => {
  const [metric, setMetric] = React.useState<DashboardMetric>('sales');
  const [breakdown, setBreakdown] = React.useState<DashboardBreakdown>('time');
  const [period, setPeriod] = React.useState<DashboardPeriod>('30d');
  const [chartType, setChartType] = React.useState<DashboardChartType>('line');

  const effectiveBreakdown = metric === 'stock_value' ? 'category' : breakdown;
  const allowedTypes = chartCompatibilityMap[effectiveBreakdown];

  React.useEffect(() => {
    if (!allowedTypes.includes(chartType)) {
      setChartType(allowedTypes[0]);
    }
  }, [effectiveBreakdown, chartType, allowedTypes]);

  const chartResult = buildChartData(summary, {
    metric,
    breakdown: effectiveBreakdown,
    period,
  });

  const isPieOrRing = chartType === 'pie' || chartType === 'ring';
  const actualChartType = chartType === 'ring' ? 'pie' : chartType;

  return (
    <div className="bg-panel rounded-card border border-border/50 p-4 elevation-raised flex flex-col gap-3">
      {/* Header & Selectors */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border/30 pb-3 gap-3">
        <div>
          <h3 className="font-heading text-sm font-bold text-text uppercase tracking-wider">
            {t('dashboard.overview')}
          </h3>
          <p className="font-ui text-xs text-text-muted">
            {metric} — {effectiveBreakdown} ({period})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as DashboardMetric)}
            className="bg-surface-secondary border border-border/40 rounded px-2 py-1 text-text font-ui"
            aria-label="Select metric"
          >
            <option value="sales">Sales</option>
            <option value="profit">Profit</option>
            <option value="purchases">Purchases</option>
            <option value="stock_value">Stock Value</option>
          </select>

          {metric !== 'stock_value' && (
            <select
              value={breakdown}
              onChange={(e) => setBreakdown(e.target.value as DashboardBreakdown)}
              className="bg-surface-secondary border border-border/40 rounded px-2 py-1 text-text font-ui"
              aria-label="Select breakdown"
            >
              <option value="time">Time</option>
              <option value="category">Category</option>
            </select>
          )}

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
            className="bg-surface-secondary border border-border/40 rounded px-2 py-1 text-text font-ui"
            aria-label="Select period"
          >
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
          </select>

          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as DashboardChartType)}
            className="bg-surface-secondary border border-border/40 rounded px-2 py-1 text-text font-ui"
            aria-label="Select chart type"
          >
            {allowedTypes.map((type) => (
              <option key={type} value={type}>
                {type.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      <Chart
        type={actualChartType as any}
        data={chartResult.data}
        xKey={chartResult.xKey}
        series={[{ dataKey: 'value', name: chartResult.series }]}
        innerRadius={chartType === 'ring' ? 60 : undefined}
        colors={isPieOrRing ? ringColors : defaultChartColors}
        height={260}
        emptyMessage={t('dashboard.noData')}
      />
    </div>
  );
};
