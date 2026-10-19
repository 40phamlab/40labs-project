import * as React from 'react';
import { Dropdown, IconButton, Switch } from '@40labs/ui-components';
import { SlidersHorizontal, Check, RefreshCw } from 'lucide-react';
import { ChartType, Granularity } from '../state/useReportChartState';
import { ReportSeries } from '../config/seriesRegistry';
import { t } from '@40labs/i18n';

export interface ChartOptionsMenuProps {
  chartType: ChartType;
  onSelectChartType: (type: ChartType) => void;
  granularity: Granularity;
  onSelectGranularity: (g: Granularity) => void;
  series: readonly ReportSeries[];
  seriesVisibility: Record<string, boolean>;
  onToggleSeries: (key: string) => void;
  compare: boolean;
  onToggleCompare: (compare: boolean) => void;
  onReset: () => void;
  showHourGranularity?: boolean;
}

export const ChartOptionsMenu: React.FC<ChartOptionsMenuProps> = ({
  chartType,
  onSelectChartType,
  granularity,
  onSelectGranularity,
  series,
  seriesVisibility,
  onToggleSeries,
  compare,
  onToggleCompare,
  onReset,
  showHourGranularity = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const chartTypes: { id: ChartType; labelKey: string }[] = [
    { id: 'combo', labelKey: 'reports.type.combo' },
    { id: 'bar', labelKey: 'reports.type.bars' },
    { id: 'line', labelKey: 'reports.type.line' },
    { id: 'area', labelKey: 'reports.type.area' },
    { id: 'stacked', labelKey: 'reports.type.stacked' },
    { id: 'ring', labelKey: 'reports.type.ring' },
  ];

  const granularities: { id: Granularity; labelKey: string }[] = [
    ...(showHourGranularity ? [{ id: 'hour' as Granularity, labelKey: 'reports.granularity.hour' }] : []),
    { id: 'day', labelKey: 'reports.granularity.day' },
    { id: 'week', labelKey: 'reports.granularity.week' },
    { id: 'month', labelKey: 'reports.granularity.month' },
  ];

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      placement="bottom-end"
      trigger={
        <IconButton
          icon={<SlidersHorizontal size={14} />}
          label="Chart Options"
          intent="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        />
      }
    >
      <div className="min-w-[220px] max-h-[400px] overflow-y-auto py-2 bg-surface-elevated border border-border rounded-md shadow-lg text-xs font-ui">
        {/* Chart Type */}
        <div className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-text-muted">
          {t('reports.options.chartType')}
        </div>
        {chartTypes.map((ct) => (
          <button
            key={ct.id}
            type="button"
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-hover text-text-primary text-left cursor-pointer"
            onClick={() => {
              onSelectChartType(ct.id);
            }}
          >
            <span>{t(ct.labelKey as any)}</span>
            {chartType === ct.id && <Check size={12} className="text-action-primary" />}
          </button>
        ))}

        <div className="my-1 border-t border-border" />

        {/* Granularity */}
        <div className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-text-muted">
          {t('reports.options.granularity')}
        </div>
        {granularities.map((g) => (
          <button
            key={g.id}
            type="button"
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-hover text-text-primary text-left cursor-pointer"
            onClick={() => {
              onSelectGranularity(g.id);
            }}
          >
            <span>{t(g.labelKey as any)}</span>
            {granularity === g.id && <Check size={12} className="text-action-primary" />}
          </button>
        ))}

        <div className="my-1 border-t border-border" />

        {/* Series visibility */}
        <div className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-text-muted">
          {t('reports.options.series')}
        </div>
        {series.map((s) => {
          const isVisible = seriesVisibility[s.key] ?? true;
          return (
            <button
              key={s.key}
              type="button"
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-hover text-text-primary text-left cursor-pointer"
              onClick={() => onToggleSeries(s.key)}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isVisible ? 'bg-action-primary' : 'bg-text-muted/40'}`} />
                <span className="truncate">{t(s.labelKey as any)}</span>
              </div>
              <input type="checkbox" checked={isVisible} onChange={() => {}} className="accent-action-primary cursor-pointer" />
            </button>
          );
        })}

        <div className="my-1 border-t border-border" />

        {/* Compare switch */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-text-primary">{t('reports.options.compare')}</span>
          <Switch checked={compare} onChange={onToggleCompare} />
        </div>

        <div className="my-1 border-t border-border" />

        {/* Reset */}
        <button
          type="button"
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-hover text-text-primary text-left cursor-pointer"
          onClick={() => {
            onReset();
            setIsOpen(false);
          }}
        >
          <RefreshCw size={12} />
          <span>{t('reports.options.reset')}</span>
        </button>

        <div className="my-1 border-t border-border" />

        {/* Deferred TODOs */}
        <div className="px-3 py-2 text-[10px] text-text-muted space-y-1">
          <div>TODO: [reason: needs aggregation queries not in 7A] [phase: 7E] (Group-by dimension)</div>
          <div>TODO: [reason: needs aggregation queries not in 7A] [phase: 7E] (PNG export)</div>
        </div>
      </div>
    </Dropdown>
  );
};
