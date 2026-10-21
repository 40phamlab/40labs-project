// [phase: 8D] Unified Interactive Overview Chart Panel with Clean Toolbar & Compact Settings Menu
import * as React from 'react';
import {
  SlidersHorizontal,
} from 'lucide-react';
import { Dropdown, Alert } from '@40labs/ui-components';
import type { DashboardSummary } from '../../../devData/dashboard/summary';
import { useChartPrefs } from '../../../hooks/useChartPrefs';
import type { ChartType, TimeRange } from '@40labs/types';
import {
  buildAnalyticsChartData,
  type DashboardChartType,
  type AnalyticsPeriod,
  type TimeGrouping,
  type ChartScale,
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
  const { chartType, range, setChartType, setRange } = useChartPrefs('dashboard_overview');

  const [grouping, setGrouping] = React.useState<TimeGrouping>('daily');
  const [scale, setScale] = React.useState<ChartScale>('auto');
  const [hiddenSeries, setHiddenSeries] = React.useState<string[]>([]);
  const [showGrid, setShowGrid] = React.useState<boolean>(true);
  const [showLegend, setShowLegend] = React.useState<boolean>(false);
  const [showMarkers, setShowMarkers] = React.useState<boolean>(true);

  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = React.useState<string>('');
  const [customEndDate, setCustomEndDate] = React.useState<string>('');

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries((prev) =>
      prev.includes(dataKey) ? prev.filter((k) => k !== dataKey) : [...prev, dataKey]
    );
  };

  const analyticsPeriod: AnalyticsPeriod =
    range === 'today'
      ? 'today'
      : range === '7d'
      ? '7d'
      : range === '30d'
      ? '30d'
      : range === '90d'
      ? '90d'
      : 'thisYear';

  const effectiveChartType: DashboardChartType =
    chartType === 'line'
      ? 'line'
      : chartType === 'bar'
      ? 'bar'
      : chartType === 'area'
      ? 'area'
      : 'pie';

  const { data, pieData, series, totalValues, canUseLog } = buildAnalyticsChartData(summary, {
    period: analyticsPeriod,
    grouping,
    scale,
    customStartDate,
    customEndDate,
  });

  return (
    <div className="bg-panel rounded-card border border-border/50 p-4 elevation-raised flex flex-col gap-3 min-h-[360px]">
      {/* Controls Toolbar on ONE Row (Clean & Minimal) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-2 shrink-0">
        {/* Panel Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="font-heading text-xs font-bold text-text uppercase tracking-wider truncate">
            MUHTASARI WA BIASHARA <span className="text-text-muted font-mono font-normal">({range === '7d' ? 'SIKU 7' : range === 'today' ? 'LEO' : range === '30d' ? 'SIKU 30' : range === '90d' ? 'SIKU 90' : 'TAKWIMU ZOTE'})</span>
          </h3>
        </div>

        {/* Controls Toolbar (Only Compact Settings Menu) */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          {/* Compact Chart Settings Menu Dropdown */}
          <Dropdown
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            placement="bottom-end"
            trigger={
              <button
                type="button"
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  isSettingsOpen
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface-secondary border-border/40 text-text-muted hover:text-text hover:border-border'
                }`}
                title="Mipangilio ya Chati (Chart Settings)"
                aria-label="Chart Settings"
              >
                <SlidersHorizontal size={14} />
              </button>
            }
          >
            <div className="w-[300px] p-3 bg-panel border border-border rounded-card elevation-raised space-y-3 text-xs max-h-[420px] overflow-y-auto">
              <div className="font-bold uppercase tracking-wider text-text-muted border-b border-border/20 pb-1.5 flex justify-between items-center">
                <span>Mipangilio ya Chati</span>
                <span className="text-[10px] text-text-muted font-mono">Analytics</span>
              </div>

              {/* 1. Chart Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-muted">Aina ya Chati (Chart Type)</label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as ChartType)}
                  className="w-full bg-surface-secondary border border-border/60 rounded px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>

              {/* 2. Time Range (Order: Leo | Siku 7 | Siku 30 | Siku 90 | Zote) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-muted">Kipindi (Time Range)</label>
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value as TimeRange)}
                  className="w-full bg-surface-secondary border border-border/60 rounded px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="today">Leo (Today)</option>
                  <option value="7d">Siku 7 (7 Days)</option>
                  <option value="30d">Siku 30 (30 Days)</option>
                  <option value="90d">Siku 90 (90 Days)</option>
                  <option value="all">Zote (All)</option>
                </select>
                {range === 'custom' && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-1/2 bg-surface-secondary border border-border/60 rounded px-1.5 py-0.5 text-[10px] text-text"
                    />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-1/2 bg-surface-secondary border border-border/60 rounded px-1.5 py-0.5 text-[10px] text-text"
                    />
                  </div>
                )}
              </div>

              {/* 3. Time Grouping */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-muted">Makundi ya Muda (Grouping)</label>
                <select
                  value={grouping}
                  onChange={(e) => setGrouping(e.target.value as TimeGrouping)}
                  className="w-full bg-surface-secondary border border-border/60 rounded px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="hourly">Kila Saa (Hourly)</option>
                  <option value="daily">Kila Siku (Daily)</option>
                  <option value="weekly">Kila Wiki (Weekly)</option>
                  <option value="monthly">Kila Mwezi (Monthly)</option>
                  <option value="yearly">Kila Mwaka (Yearly)</option>
                </select>
              </div>

              {/* 4. Scale */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-muted">Kiwango (Scale)</label>
                <select
                  value={scale}
                  onChange={(e) => setScale(e.target.value as ChartScale)}
                  className="w-full bg-surface-secondary border border-border/60 rounded px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="auto">Otomatiki (Auto)</option>
                  <option value="linear">Linear</option>
                  <option value="log" disabled={!canUseLog}>
                    Logarithmic {canUseLog ? '' : '(Batilishi: Inahitaji maadili > 0)'}
                  </option>
                </select>
              </div>

              {/* 5. Display Options */}
              <div className="space-y-1.5 pt-1 border-t border-border/20">
                <label className="text-[10px] font-bold uppercase text-text-muted">Chaguzi za Onyesho (Display Options)</label>

                <label className="flex items-center gap-2 cursor-pointer text-text select-none">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span>Onyesha Mistari ya Gridi (Grid Lines)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-text select-none">
                  <input
                    type="checkbox"
                    checked={showLegend}
                    onChange={(e) => setShowLegend(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span>Onyesha Kielezo ndani ya Chati (Legend)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-text select-none">
                  <input
                    type="checkbox"
                    checked={showMarkers}
                    onChange={(e) => setShowMarkers(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span>Onyesha Vituo vya Pointi (Markers)</span>
                </label>
              </div>
            </div>
          </Dropdown>
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
            pieData={pieData}
            series={series}
            chartType={effectiveChartType}
            period={analyticsPeriod === 'today' ? '7d' : analyticsPeriod as any}
            hiddenSeries={hiddenSeries}
            showGrid={showGrid}
            showLegend={showLegend}
            showMarkers={showMarkers}
            scale={scale}
            canUseLog={canUseLog}
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
