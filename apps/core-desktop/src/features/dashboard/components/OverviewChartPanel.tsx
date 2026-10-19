// [phase: 8D] Unified Interactive Overview Chart Panel (~360px Height)
import * as React from 'react';
import {
  TrendingUp,
  AreaChart,
  BarChart3,
} from 'lucide-react';
import { SegmentedControl, Alert } from '@40labs/ui-components';
import type { DashboardSummary } from '../../../devData/dashboard/summary';
import {
  buildUnifiedChartData,
  type DashboardChartType,
  type DashboardPeriod,
} from '../utils/chartData';
import { DashboardChart } from './DashboardChart';

export interface OverviewChartPanelProps {
  summary: DashboardSummary;
  loading?: boolean;
  error?: string;
}

export const OverviewChartPanel: React.FC<OverviewChartPanelProps> = ({
  summary,
  loading = false,
  error,
}) => {
  const [period, setPeriod] = React.useState<DashboardPeriod>('30d');
  const [chartType, setChartType] = React.useState<DashboardChartType>('bar');
  const [hiddenSeries, setHiddenSeries] = React.useState<string[]>([]);

  const handlePeriodChange = (val: string) => {
    const newPeriod = val as DashboardPeriod;
    setPeriod(newPeriod);
    if (newPeriod === '90d' && chartType === 'bar') {
      setChartType('area');
    } else if ((newPeriod === '7d' || newPeriod === '30d') && chartType === 'area') {
      setChartType('bar');
    }
  };

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries((prev) =>
      prev.includes(dataKey) ? prev.filter((k) => k !== dataKey) : [...prev, dataKey]
    );
  };

  const { data, series, totalValues } = buildUnifiedChartData(summary, period);

  return (
    <div className="bg-panel rounded-card border border-border/50 p-4 elevation-raised flex flex-col gap-3 min-h-[360px]">
      {/* Controls Toolbar on ONE Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-2 shrink-0">
        {/* Panel Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="font-heading text-xs font-bold text-text uppercase tracking-wider truncate">
            MUHTASARI WA BIASHARA <span className="text-text-muted font-mono font-normal">(TAKWIMU ZOTE)</span>
          </h3>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-2 text-xs shrink-0">
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

          {/* Icon-Only Chart-Type Switcher: Bar | Line | Area */}
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
          </div>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="w-full relative">
        {loading ? (
          <div className="h-[240px] w-full flex items-center justify-center text-text-muted text-xs font-ui">
            Inapakia chati...
          </div>
        ) : error ? (
          <Alert intent="danger" title="Itilafu ya Chati">
            {error}
          </Alert>
        ) : (
          <DashboardChart
            data={data}
            series={series}
            chartType={chartType}
            period={period}
            hiddenSeries={hiddenSeries}
          />
        )}
      </div>

      {/* Interactive Compact Legend beneath chart */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-border/30 text-xs">
        {series.map((s) => {
          const isHidden = hiddenSeries.includes(s.dataKey);
          const totalVal = totalValues[s.dataKey] ?? 0;
          const formattedTotal =
            s.unit === 'money'
              ? `TZS ${new Intl.NumberFormat('en-US').format(Math.round(totalVal))}`
              : new Intl.NumberFormat('en-US').format(totalVal);

          return (
            <button
              key={s.dataKey}
              type="button"
              onClick={() => toggleSeries(s.dataKey)}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-ui transition-all cursor-pointer ${
                isHidden
                  ? 'bg-surface-secondary/30 border-border/20 text-text-muted opacity-45 line-through'
                  : 'bg-surface-elevated border-border/60 text-text shadow-xs hover:border-border'
              }`}
              title={isHidden ? `Onyesha ${s.name}` : `Ficha ${s.name}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="font-bold">{s.name}</span>
              <span className="font-mono text-text-muted">({formattedTotal})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
