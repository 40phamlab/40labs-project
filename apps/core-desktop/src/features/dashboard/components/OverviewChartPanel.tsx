// [phase: 8D] Refactored Overview Chart Panel (~320px Fixed Height)
import * as React from 'react';
import {
  TrendingUp,
  AreaChart,
  BarChart3,
  CircleDot,
} from 'lucide-react';
import { SegmentedControl, Tooltip, Alert } from '@40labs/ui-components';
import type { DashboardSummary } from '../../../devData/dashboard/summary';
import {
  buildChartData,
  type DashboardChartMetric,
  type DashboardChartType,
  type DashboardPeriod,
} from '../utils/chartData';
import { formatMetricUnit } from '../utils/chartFormat';
import { DashboardChart } from './DashboardChart';

export interface OverviewChartPanelProps {
  summary: DashboardSummary;
  loading?: boolean;
  error?: string;
  selectedMetric?: DashboardChartMetric;
  onMetricChange?: (metric: DashboardChartMetric) => void;
}

const METRIC_TITLES: Record<DashboardChartMetric, string> = {
  sales: 'MAUZO',
  profit: 'FAIDA',
  customers: 'WATEJA',
  stock: 'AKIBA',
  purchases: 'MANUNUZI',
  stock_value: 'THAMANI YA AKIBA',
};

export const OverviewChartPanel: React.FC<OverviewChartPanelProps> = ({
  summary,
  loading = false,
  error,
  selectedMetric = 'sales',
  onMetricChange,
}) => {
  const [metric, setMetric] = React.useState<DashboardChartMetric>(selectedMetric);
  const [period, setPeriod] = React.useState<DashboardPeriod>('30d');
  const [chartType, setChartType] = React.useState<DashboardChartType>('bar');

  // Sync external selectedMetric prop (e.g. from KPI card click)
  React.useEffect(() => {
    if (selectedMetric && selectedMetric !== metric) {
      setMetric(selectedMetric);
      if (selectedMetric === 'customers' && chartType === 'ring') {
        setChartType('bar');
      }
    }
  }, [selectedMetric]);

  const handleMetricChange = (newMetric: DashboardChartMetric) => {
    setMetric(newMetric);
    if (newMetric === 'customers' && chartType === 'ring') {
      setChartType('bar');
    }
    if (onMetricChange) onMetricChange(newMetric);
  };

  const handlePeriodChange = (val: string) => {
    const newPeriod = val as DashboardPeriod;
    setPeriod(newPeriod);
    // Default per range rule: bar for 7 and 30, area for 90
    if (newPeriod === '90d' && chartType === 'bar') {
      setChartType('area');
    } else if ((newPeriod === '7d' || newPeriod === '30d') && chartType === 'area') {
      setChartType('bar');
    }
  };

  const chartResult = buildChartData(summary, {
    metric,
    chartType,
    period,
  });

  const unitStr = formatMetricUnit(metric);
  const metricTitle = METRIC_TITLES[metric] || 'MUHTASARI';

  return (
    <div className="bg-panel rounded-card border border-border/50 p-4 elevation-raised flex flex-col gap-3 h-[320px] min-h-[320px] max-h-[320px] overflow-hidden">
      {/* Controls Toolbar on ONE Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-2 shrink-0">
        {/* Panel Title with Unit */}
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="font-heading text-xs font-bold text-text uppercase tracking-wider truncate">
            {metricTitle} <span className="text-text-muted font-mono font-normal">{unitStr}</span>
          </h3>
        </div>

        {/* Controls Toolbar (One Row) */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          {/* Metric Tabs: Mauzo | Faida | Wateja | Hifadhi */}
          <SegmentedControl
            size="sm"
            value={metric}
            onChange={(val) => handleMetricChange(val as DashboardChartMetric)}
            options={[
              { value: 'sales', label: 'Mauzo' },
              { value: 'profit', label: 'Faida' },
              { value: 'customers', label: 'Wateja' },
              { value: 'stock', label: 'Hifadhi' },
            ]}
          />

          {/* Range Segmented: Siku 7 | 30 | 90 */}
          <SegmentedControl
            size="sm"
            value={period}
            onChange={handlePeriodChange}
            options={[
              { value: '7d', label: 'Siku 7' },
              { value: '30d', label: '30' },
              { value: '90d', label: '90' },
            ]}
          />

          {/* Icon-Only Chart-Type Switcher: Bar | Line | Area | Ring */}
          <div className="flex items-center bg-surface-secondary rounded-[6px] p-0.5 border border-border/40">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-surface-elevated text-primary font-bold shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
              title="Bar chart"
              aria-label="Bar chart"
            >
              <BarChart3 size={13} />
            </button>

            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                chartType === 'line'
                  ? 'bg-surface-elevated text-primary font-bold shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
              title="Line chart"
              aria-label="Line chart"
            >
              <TrendingUp size={13} />
            </button>

            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                chartType === 'area'
                  ? 'bg-surface-elevated text-primary font-bold shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
              title="Area chart"
              aria-label="Area chart"
            >
              <AreaChart size={13} />
            </button>

            {/* Ring Chart Button (disabled if customers) */}
            {metric === 'customers' ? (
              <Tooltip content="Hakuna data ya kategoria">
                <button
                  type="button"
                  disabled
                  className="p-1 rounded text-xs text-text-disabled cursor-not-allowed opacity-40"
                  aria-label="Ring chart disabled"
                >
                  <CircleDot size={13} />
                </button>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => setChartType('ring')}
                className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                  chartType === 'ring'
                    ? 'bg-surface-elevated text-primary font-bold shadow-xs'
                    : 'text-text-muted hover:text-text'
                }`}
                title="Ring chart (kategoria)"
                aria-label="Ring chart"
              >
                <CircleDot size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="flex-1 w-full min-h-0 relative">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center text-text-muted text-xs font-ui">
            Inapakia chati...
          </div>
        ) : error ? (
          <Alert intent="danger" title="Itilafu ya Chati">
            {error}
          </Alert>
        ) : (
          <DashboardChart
            chartResult={chartResult}
            metric={metric}
            chartType={chartType}
            period={period}
          />
        )}
      </div>
    </div>
  );
};
