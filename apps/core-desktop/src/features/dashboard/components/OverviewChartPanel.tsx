import * as React from 'react';
import {
  TrendingUp,
  AreaChart,
  BarChart3,
  CircleDot,
  PieChart,
  Radar,
} from 'lucide-react';
import {
  Chart,
  SegmentedControl,
  Select,
  Tooltip,
  defaultChartColors,
  SegmentedControlOption,
} from '@40labs/ui-components';
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

// GAP: ChartPanel component is not present in @40labs/ui-components package.

interface OverviewChartPanelProps {
  summary: DashboardSummary;
  loading?: boolean;
  error?: string;
}

const ringColors = defaultChartColors.filter((c) => c !== colors.danger);

export const OverviewChartPanel: React.FC<OverviewChartPanelProps> = ({
  summary,
  loading = false,
  error,
}) => {
  // TODO: [reason: no per-user UI-preference store defined; persisting chart choice per workspace needs a settings schema decision] [phase: post-MVP]
  const [metric, setMetric] = React.useState<DashboardMetric>('sales');
  const [breakdown, setBreakdown] = React.useState<DashboardBreakdown>('time');
  const [period, setPeriod] = React.useState<DashboardPeriod>('30d');
  const [chartType, setChartType] = React.useState<DashboardChartType>('line');

  const effectiveBreakdown = metric === 'stock_value' ? 'category' : breakdown;
  const validTypes = chartCompatibilityMap[effectiveBreakdown];

  // Auto-switch to first valid type when breakdown becomes invalid
  React.useEffect(() => {
    if (!validTypes.includes(chartType)) {
      setChartType(effectiveBreakdown === 'time' ? 'line' : 'ring');
    }
  }, [effectiveBreakdown, chartType, validTypes]);

  const chartResult = buildChartData(summary, {
    metric,
    breakdown: effectiveBreakdown,
    period,
  });

  const isPieOrRing = chartType === 'pie' || chartType === 'ring';
  const actualChartType = chartType === 'ring' ? 'pie' : chartType;

  const tooltipNotAvailable = t('dashboard.notAvailableForView');

  const typeOptions: SegmentedControlOption[] = [
    {
      value: 'line',
      label: t('dashboard.typeLine'),
      icon: <TrendingUp size={14} />,
      disabled: !validTypes.includes('line'),
    },
    {
      value: 'area',
      label: t('dashboard.typeArea'),
      icon: <AreaChart size={14} />,
      disabled: !validTypes.includes('area'),
    },
    {
      value: 'bar',
      label: t('dashboard.typeBar'),
      icon: <BarChart3 size={14} />,
      disabled: !validTypes.includes('bar'),
    },
    {
      value: 'ring',
      label: t('dashboard.typeRing'),
      icon: <CircleDot size={14} />,
      disabled: !validTypes.includes('ring'),
    },
    {
      value: 'pie',
      label: t('dashboard.typePie'),
      icon: <PieChart size={14} />,
      disabled: !validTypes.includes('pie'),
    },
    {
      value: 'radar',
      label: t('dashboard.typeRadar'),
      icon: <Radar size={14} />,
      disabled: !validTypes.includes('radar'),
    },
  ].map((opt) => {
    if (opt.disabled) {
      return {
        ...opt,
        label: (
          <Tooltip content={tooltipNotAvailable}>
            <span className="inline-flex items-center gap-1">{opt.label}</span>
          </Tooltip>
        ),
      };
    }
    return opt;
  });

  const currencyFormatter = (val: number, name: string): [string, string] => [
    `TZS ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.abs(val))}`,
    name,
  ];

  return (
    <div className="bg-panel rounded-card border border-border/50 p-4 elevation-raised flex flex-col gap-3">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-border/30 pb-3 gap-3">
        <div>
          <h3 className="font-heading text-sm font-bold text-text uppercase tracking-wider">
            {t('dashboard.overview')}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Metric Select */}
          <div className="w-32">
            <Select
              size="sm"
              value={metric}
              onChange={(e) => setMetric(e.target.value as DashboardMetric)}
              aria-label="Select metric"
            >
              <option value="sales">{t('dashboard.metricSales')}</option>
              <option value="profit">{t('dashboard.metricProfit')}</option>
              <option value="purchases">{t('dashboard.metricPurchases')}</option>
              <option value="stock_value">{t('dashboard.metricStockValue')}</option>
            </Select>
          </div>

          {/* Group By Segmented Control */}
          <SegmentedControl
            size="sm"
            value={effectiveBreakdown}
            onChange={(val) => setBreakdown(val as DashboardBreakdown)}
            disabled={metric === 'stock_value'}
            options={[
              { value: 'time', label: t('dashboard.groupByTime') },
              { value: 'category', label: t('dashboard.groupByCategory') },
            ]}
          />

          {/* Type Segmented Control */}
          <SegmentedControl
            size="sm"
            value={chartType}
            onChange={(val) => setChartType(val as DashboardChartType)}
            options={typeOptions}
          />

          {/* Period Segmented Control (hidden if stock_value or breakdown='category') */}
          {metric !== 'stock_value' && effectiveBreakdown !== 'category' && (
            <SegmentedControl
              size="sm"
              value={period}
              onChange={(val) => setPeriod(val as DashboardPeriod)}
              options={[
                { value: '7d', label: t('dashboard.period7d') },
                { value: '30d', label: t('dashboard.period30d') },
                { value: '90d', label: t('dashboard.period90d') },
              ]}
            />
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <Chart
        type={actualChartType as any}
        data={chartResult.data}
        xKey={chartResult.xKey}
        series={[{ dataKey: 'value', name: chartResult.series }]}
        innerRadius={chartType === 'ring' ? '60%' : undefined}
        outerRadius={chartType === 'ring' ? '90%' : undefined}
        colors={isPieOrRing ? ringColors : defaultChartColors}
        tooltipFormatter={currencyFormatter}
        height={260}
        emptyMessage={t('dashboard.noData')}
        loading={loading}
        error={error}
      />
    </div>
  );
};
