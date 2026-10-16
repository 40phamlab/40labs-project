// [phase: 8D] Rich Tooltip for KPI Cards
import * as React from 'react';
import { Tooltip } from '@40labs/ui-components';
import type { DashboardKpi } from '@40labs/types';
import type { KpiMeta } from './kpiMeta';
import { getDeltaState } from './DeltaChip';

export interface KpiTooltipProps {
  kpi: DashboardKpi;
  meta: KpiMeta;
  children: React.ReactElement;
}

function formatSwahiliDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10);
  const swMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ago', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthName = swMonths[monthIdx - 1] || '';
  return `${day} ${monthName}`;
}

export const KpiTooltip: React.FC<KpiTooltipProps> = ({ kpi, meta, children }) => {
  const deltaState = getDeltaState(kpi.delta);

  const formattedValue =
    kpi.format === 'money'
      ? `TZS ${kpi.value.toLocaleString('en-US')}`
      : kpi.value.toString();

  const compareLabel = kpi.delta?.compareKey === 'vs_last_month' ? 'vs mwezi uliopita' : 'vs jana';

  let deltaStr = '—';
  if (kpi.delta?.pct !== null && kpi.delta?.pct !== undefined && Number.isFinite(kpi.delta.pct)) {
    const symbol = kpi.delta.direction === 'up' ? '▲ ' : kpi.delta.direction === 'down' ? '▼ ' : '';
    deltaStr = `${symbol}${Math.abs(kpi.delta.pct)}%`;
  }

  const deltaTextColor =
    deltaState === 'good'
      ? 'text-success'
      : deltaState === 'bad'
      ? 'text-danger'
      : 'text-text-muted';

  const tooltipContent = (
    <div className="w-[190px] p-1.5 text-xs font-ui text-text-primary space-y-1.5 whitespace-normal">
      {/* Title Header */}
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
        {meta.titleSw.toUpperCase()} · Leo
      </div>

      {/* Main Value & Delta Subheader */}
      <div className="flex items-baseline justify-between gap-1 font-mono">
        <span className="font-bold text-sm text-text">{formattedValue}</span>
        <span className={`text-[10px] font-bold ${deltaTextColor}`}>
          {deltaStr} <span className="text-[9px] text-text-muted font-ui">{compareLabel}</span>
        </span>
      </div>

      <div className="border-b border-border/40 my-1" />

      {/* 5-Day History Rows */}
      <div className="space-y-1 font-mono text-[11px]">
        {kpi.history.map((pt, idx) => {
          const ptDeltaStr =
            pt.pct === null || pt.pct === undefined
              ? '—'
              : `${pt.pct > 0 ? '▲ ' : pt.pct < 0 ? '▼ ' : ''}${Math.abs(pt.pct)}%`;
          const ptColor =
            pt.pct === null || pt.pct === undefined || pt.pct === 0
              ? 'text-text-muted'
              : pt.pct > 0
              ? 'text-success'
              : 'text-danger';

          return (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-text-muted font-ui">{formatSwahiliDate(pt.date)}</span>
              <span className={`font-bold ${ptColor}`}>{ptDeltaStr}</span>
            </div>
          );
        })}
      </div>

      {/* Breakdown Rows */}
      {kpi.breakdown && kpi.breakdown.length > 0 && (
        <>
          <div className="border-b border-border/40 my-1" />
          <div className="space-y-1 text-[11px] font-mono">
            {kpi.breakdown.map((item, idx) => {
              const rawKey = item.labelKey.split('.').pop() || '';
              const labelSw = meta.breakdownLabels[rawKey] || rawKey;
              const valStr =
                item.format === 'money'
                  ? `TZS ${item.value.toLocaleString('en-US')}`
                  : item.value.toString();

              return (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-text-muted font-ui truncate pr-2">{labelSw}</span>
                  <span className="font-bold text-text shrink-0">{valStr}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position="top" delay={150}>
      {children}
    </Tooltip>
  );
};
