// [phase: 8D] Compact KPI Card (~96px High, 12px Radius)
import * as React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { DashboardKpi } from '@40labs/types';
import { useNavStore } from '../../../stores/useNavStore';
import { KPI_META_MAP } from './kpiMeta';
import { DeltaChip, getDeltaState } from './DeltaChip';
import { Sparkline } from './Sparkline';
import { KpiTooltip } from './KpiTooltip';

export interface KpiCardProps {
  kpi: DashboardKpi;
  onSelectMetric?: (id: DashboardKpi['id']) => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ kpi, onSelectMetric, className = '' }) => {
  const meta = KPI_META_MAP[kpi.id];
  const Icon = meta.icon;
  const deltaState = getDeltaState(kpi.delta);

  const formattedValue =
    kpi.format === 'money'
      ? `TZS ${kpi.value.toLocaleString('en-US')}`
      : kpi.value.toString();

  const handleCardClick = () => {
    if (onSelectMetric) {
      onSelectMetric(kpi.id);
    }
  };

  const handleOpenScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (meta.targetScreen) {
      useNavStore.getState().setActiveScreen(meta.targetScreen);
    }
  };

  return (
    <KpiTooltip kpi={kpi} meta={meta}>
      <div
        tabIndex={0}
        role="button"
        aria-label={`${meta.titleSw} KPI: ${formattedValue}`}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className={`
          relative h-[96px] p-3 rounded-[12px] bg-surface-primary border border-border/50
          elevation-raised hover:elevation-hover active:elevation-pressed transition-all
          cursor-pointer flex flex-col justify-between group focus:outline-none focus-visible:ring-2
          focus-visible:ring-focus-ring ${className}
        `}
      >
        {/* Top Row: [Icon chip] Title ... [DeltaChip] [Open icon] */}
        <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0 ${meta.chipClass}`}
            >
              <Icon size={13} />
            </div>
            <span className="font-ui text-[10px] font-bold uppercase tracking-wider text-text-muted truncate">
              {meta.titleSw}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <DeltaChip delta={kpi.delta} />
            {meta.targetScreen && (
              <button
                type="button"
                onClick={handleOpenScreen}
                aria-label={`Open ${meta.titleSw} module`}
                className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-secondary/60 transition-colors cursor-pointer"
              >
                <ArrowUpRight size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: Main Value ... [Sparkline 7d] */}
        <div className="flex items-end justify-between gap-2 w-full min-w-0 pt-1">
          <div className="font-mono text-lg font-bold text-text tracking-tight truncate leading-none">
            {formattedValue}
          </div>
          <Sparkline data={kpi.spark} state={deltaState} />
        </div>
      </div>
    </KpiTooltip>
  );
};
