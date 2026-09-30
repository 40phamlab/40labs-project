import * as React from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Chart, IconButton, Button, Dropdown, Select, SegmentedControl, defaultChartColors } from '@40labs/ui-components';
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

interface ChartPairRowProps {
  summary: DashboardSummary;
}

const ringColors = defaultChartColors.filter((c) => c !== colors.danger);

interface SlotConfig {
  metric: DashboardMetric;
  breakdown: DashboardBreakdown;
  chartType: DashboardChartType;
  period: DashboardPeriod;
  titleKey: string;
}

const PRESET_PAIRS: [SlotConfig, SlotConfig][] = [
  // Pair 1: Sales (line) + Profit (ring by category)
  [
    { metric: 'sales', breakdown: 'time', chartType: 'line', period: '30d', titleKey: 'dashboard.salesTrend' },
    { metric: 'profit', breakdown: 'category', chartType: 'ring', period: '30d', titleKey: 'dashboard.profitByCategory' },
  ],
  // Pair 2: Purchases (bar) + Stock value (ring by category)
  [
    { metric: 'purchases', breakdown: 'time', chartType: 'bar', period: '30d', titleKey: 'dashboard.metricPurchases' },
    { metric: 'stock_value', breakdown: 'category', chartType: 'ring', period: '30d', titleKey: 'dashboard.metricStockValue' },
  ],
  // Pair 3: Sales (bar by category) + Profit (area)
  [
    { metric: 'sales', breakdown: 'category', chartType: 'bar', period: '30d', titleKey: 'dashboard.metricSales' },
    { metric: 'profit', breakdown: 'time', chartType: 'area', period: '30d', titleKey: 'dashboard.profit' },
  ],
];

export const ChartPairRow: React.FC<ChartPairRowProps> = ({ summary }) => {
  const [pairIndex, setPairIndex] = React.useState(0);
  const currentPair = PRESET_PAIRS[pairIndex];

  // Local state override for slots
  const [leftSlot, setLeftSlot] = React.useState<SlotConfig>(currentPair[0]);
  const [rightSlot, setRightSlot] = React.useState<SlotConfig>(currentPair[1]);

  React.useEffect(() => {
    setLeftSlot(PRESET_PAIRS[pairIndex][0]);
    setRightSlot(PRESET_PAIRS[pairIndex][1]);
  }, [pairIndex]);

  const handlePrev = () => setPairIndex((p) => (p > 0 ? p - 1 : PRESET_PAIRS.length - 1));
  const handleNext = () => setPairIndex((p) => (p < PRESET_PAIRS.length - 1 ? p + 1 : 0));

  return (
    <div className="relative flex-1 min-h-0 flex gap-4">
      {/* Previous Pair IconButton */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
        <IconButton
          icon={<ChevronLeft size={18} />}
          label={t('dashboard.previousChart')}
          onClick={handlePrev}
          className="bg-panel border border-border shadow-md rounded-full"
        />
      </div>

      {/* Left Slot (~30%) */}
      <div className="w-[32%] bg-panel rounded-card border border-border/40 p-4 flex flex-col justify-between elevation-raised min-h-0">
        <ChartSlot slot={leftSlot} onChange={setLeftSlot} summary={summary} />
      </div>

      {/* Right Slot (~70%) */}
      <div className="w-[68%] bg-panel rounded-card border border-border/40 p-4 flex flex-col justify-between elevation-raised min-h-0">
        <ChartSlot slot={rightSlot} onChange={setRightSlot} summary={summary} />
      </div>

      {/* Next Pair IconButton */}
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
        <IconButton
          icon={<ChevronRight size={18} />}
          label={t('dashboard.nextChart')}
          onClick={handleNext}
          className="bg-panel border border-border shadow-md rounded-full"
        />
      </div>
    </div>
  );
};

interface ChartSlotProps {
  slot: SlotConfig;
  onChange: React.Dispatch<React.SetStateAction<SlotConfig>>;
  summary: DashboardSummary;
}

const ChartSlot: React.FC<ChartSlotProps> = ({ slot, onChange, summary }) => {
  const [isTypeMenuOpen, setIsTypeMenuOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const effectiveBreakdown = slot.metric === 'stock_value' ? 'category' : slot.breakdown;
  const validTypes = chartCompatibilityMap[effectiveBreakdown];

  const chartResult = buildChartData(summary, {
    metric: slot.metric,
    breakdown: effectiveBreakdown,
    period: slot.period,
  });

  const isPieOrRing = slot.chartType === 'pie' || slot.chartType === 'ring';
  const actualChartType = slot.chartType === 'ring' ? 'pie' : slot.chartType;

  const currencyFormatter = (val: number, name: string): [string, string] => [
    `TZS ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.abs(val))}`,
    name,
  ];

  const compactYAxisFormatter = (val: number): string => {
    if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return String(val);
  };

  const typeLabelMap: Record<DashboardChartType, string> = {
    line: t('dashboard.typeLine'),
    area: t('dashboard.typeArea'),
    bar: t('dashboard.typeBar'),
    ring: t('dashboard.typeRing'),
    pie: t('dashboard.typePie'),
    radar: t('dashboard.typeRadar'),
  };

  return (
    <div className="flex flex-col h-full gap-2 min-h-0">
      {/* Slot Header */}
      <div className="flex items-center justify-between border-b border-border/20 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-text truncate">
            {t(slot.titleKey as any)}
          </h4>
          {/* Settings Popover */}
          <Dropdown
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            placement="bottom-start"
            trigger={
              <button
                type="button"
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                className="p-1 rounded hover:bg-surface-hover text-text-muted cursor-pointer"
                aria-label="Settings"
              >
                <SlidersHorizontal size={13} />
              </button>
            }
          >
            <div className="w-[260px] p-3 bg-panel border border-border rounded-card elevation-raised space-y-3 text-xs">
              <div className="font-bold uppercase tracking-wider text-text-muted border-b border-border/20 pb-1.5">
                Settings
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-muted">Metric</label>
                <Select
                  size="sm"
                  value={slot.metric}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, metric: e.target.value as DashboardMetric }))
                  }
                  className="w-full text-xs"
                >
                  <option value="sales">{t('dashboard.metricSales')}</option>
                  <option value="profit">{t('dashboard.metricProfit')}</option>
                  <option value="purchases">{t('dashboard.metricPurchases')}</option>
                  <option value="stock_value">{t('dashboard.metricStockValue')}</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-muted">Group By</label>
                <SegmentedControl
                  size="sm"
                  value={effectiveBreakdown}
                  onChange={(val) =>
                    onChange((prev) => ({ ...prev, breakdown: val as DashboardBreakdown }))
                  }
                  disabled={slot.metric === 'stock_value'}
                  options={[
                    { value: 'time', label: t('dashboard.groupByTime') },
                    { value: 'category', label: t('dashboard.groupByCategory') },
                  ]}
                />
              </div>
              {slot.metric !== 'stock_value' && effectiveBreakdown !== 'category' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-text-muted">Period</label>
                  <SegmentedControl
                    size="sm"
                    value={slot.period}
                    onChange={(val) =>
                      onChange((prev) => ({ ...prev, period: val as DashboardPeriod }))
                    }
                    options={[
                      { value: '7d', label: t('dashboard.period7d') },
                      { value: '30d', label: t('dashboard.period30d') },
                      { value: '90d', label: t('dashboard.period90d') },
                    ]}
                  />
                </div>
              )}
            </div>
          </Dropdown>
        </div>

        {/* Chart Type Selector Menu */}
        <Dropdown
          isOpen={isTypeMenuOpen}
          onClose={() => setIsTypeMenuOpen(false)}
          placement="bottom-end"
          trigger={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsTypeMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] h-6 px-2 py-0"
            >
              <span>{typeLabelMap[slot.chartType]}</span>
              <ChevronDown size={10} />
            </Button>
          }
        >
          <div className="w-[160px] p-1 bg-panel border border-border rounded-card elevation-raised space-y-0.5 text-xs">
            {(['line', 'area', 'bar', 'ring', 'pie', 'radar'] as DashboardChartType[]).map((type) => {
              const disabled = !validTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) {
                      onChange((prev) => ({ ...prev, chartType: type }));
                      setIsTypeMenuOpen(false);
                    }
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between ${
                    slot.chartType === type ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-surface-hover text-text'
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span>{typeLabelMap[type]}</span>
                </button>
              );
            })}
          </div>
        </Dropdown>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <Chart
          type={actualChartType as any}
          data={chartResult.data}
          xKey={chartResult.xKey}
          series={[{ dataKey: 'value', name: chartResult.series }]}
          innerRadius={slot.chartType === 'ring' ? '55%' : undefined}
          outerRadius={slot.chartType === 'ring' ? '85%' : undefined}
          colors={isPieOrRing ? ringColors : defaultChartColors}
          tooltipFormatter={currencyFormatter}
          yAxisFormatter={compactYAxisFormatter}
          height={160}
          emptyMessage={t('dashboard.noData')}
        />
      </div>
    </div>
  );
};
