import * as React from 'react';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import type { DashboardKpi } from '@40labs/types';
import { Tooltip } from '../overlays/Tooltip';

export interface TrendIndicatorProps {
  value: number;
  isUp: boolean;
  label?: string;
  className?: string;
}

export const TrendIndicator = ({ value, isUp, label, className = '' }: TrendIndicatorProps) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={`flex items-center gap-0.5 text-[10px] font-bold ${isUp ? 'text-primary' : 'text-danger'}`}>
        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {value}%
      </span>
      {label && <span className="text-[10px] text-text-muted">{label}</span>}
    </div>
  );
};

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; isUp: boolean };
  icon?: React.ReactNode;
  tone?: 'default' | 'primary' | 'accent' | 'danger';
  actions?: React.ReactNode;
  className?: string;
  // [phase: 8D] Additive KPI enhancements
  kpi?: DashboardKpi;
  sparkline?: React.ReactNode;
  breakdownItems?: { label: string; value: string | number }[];
}

export const KPICard = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  tone = 'default',
  actions,
  className = '',
  kpi,
  sparkline,
  breakdownItems,
}: KPICardProps) => {
  const toneClasses = {
    default: 'text-text',
    primary: 'text-primary',
    accent: 'text-accent',
    danger: 'text-danger',
  };

  // [phase: 8D] Delta color & direction calculation
  let deltaPctText = '—';
  let isGood = true;
  let hasDelta = false;
  let compareLabel = 'vs yesterday';

  if (kpi?.delta) {
    hasDelta = true;
    const { pct, direction, polarity, compareKey } = kpi.delta;
    compareLabel = compareKey === 'vs_last_month' ? 'vs last month' : 'vs yesterday';

    if (pct !== null && Number.isFinite(pct)) {
      deltaPctText = `${pct > 0 ? '+' : ''}${pct}%`;
    } else if (direction === 'up') {
      deltaPctText = '↑';
    } else if (direction === 'down') {
      deltaPctText = '↓';
    }

    if (direction === 'flat') {
      isGood = true;
    } else if (polarity === 'up-good') {
      isGood = direction === 'up';
    } else {
      // down-good
      isGood = direction === 'down';
    }
  }

  // 7-point sparkline rendering helper
  const renderSparklineSvg = (data: number[]) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 56;
    const height = 22;
    const stepX = width / (data.length - 1);
    const points = data
      .map((val, idx) => {
        const x = idx * stepX;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor = isGood ? 'var(--color-primary, #00A86B)' : 'var(--color-danger, #EF4444)';

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0 opacity-80">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const historyTooltipContent = kpi?.history && kpi.history.length > 0 ? (
    <div className="p-1 space-y-1 text-[10px] font-mono min-w-[170px]">
      <div className="font-bold border-b border-border/40 pb-1 text-text uppercase tracking-wider">
        5-Day History
      </div>
      {kpi.history.map((pt, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="text-text-muted">{pt.date}:</span>
          <span className="font-bold text-text">
            {kpi.format === 'money' ? `TZS ${pt.value.toLocaleString()}` : pt.value}
          </span>
          <span className={pt.pct === null ? 'text-text-muted' : pt.pct >= 0 ? 'text-primary' : 'text-danger'}>
            {pt.pct === null ? '—' : `${pt.pct > 0 ? '+' : ''}${pt.pct}%`}
          </span>
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div
      className={`relative p-3.5 bg-surface-primary rounded-card border border-border/50 elevation-raised group flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted truncate">
              {title}
            </span>
            {historyTooltipContent && (
              <Tooltip content={historyTooltipContent} position="top">
                <button
                  type="button"
                  aria-label="View history"
                  className="text-text-muted hover:text-text cursor-pointer transition-colors"
                >
                  <Info size={10} />
                </button>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {icon && <div className="text-text-muted group-hover:text-primary transition-colors">{icon}</div>}
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className={`text-xl font-mono font-bold ${toneClasses[tone]}`}>{value}</div>
          {sparkline ? (
            sparkline
          ) : (
            kpi?.spark && renderSparklineSvg(kpi.spark)
          )}
        </div>

        {(subtitle || trend || hasDelta) && (
          <div className="flex items-center gap-2 mt-1">
            {hasDelta ? (
              <div className="flex items-center gap-1">
                <span
                  className={`flex items-center gap-0.5 text-[10px] font-bold ${
                    kpi?.delta.direction === 'flat'
                      ? 'text-text-muted'
                      : isGood
                      ? 'text-primary'
                      : 'text-danger'
                  }`}
                >
                  {kpi?.delta.direction === 'up' && <TrendingUp size={10} />}
                  {kpi?.delta.direction === 'down' && <TrendingDown size={10} />}
                  {deltaPctText}
                </span>
                <span className="text-[9px] text-text-muted">{compareLabel}</span>
              </div>
            ) : trend ? (
              <div className="flex items-center gap-1.5">
                <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trend.isUp ? 'text-primary' : 'text-danger'}`}>
                  {trend.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {trend.value}%
                </span>
              </div>
            ) : null}
            {subtitle && <span className="text-[10px] text-text-muted truncate">{subtitle}</span>}
          </div>
        )}
      </div>

      {/* Breakdown Items */}
      {(kpi?.breakdown || breakdownItems) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-border/30 text-[10px]">
          {(breakdownItems || kpi?.breakdown?.map((item) => ({
            label: item.labelKey.split('.').pop() || item.labelKey,
            value: item.format === 'money' ? `TZS ${item.value.toLocaleString()}` : item.value,
          })) || []).map((b, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-secondary/40 text-text-muted font-mono leading-tight"
            >
              <span className="capitalize">{b.label}:</span>
              <span className="font-bold text-text">{b.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};


export interface KPIGridProps {
  children: React.ReactNode;
  className?: string;
}

export const KPIGrid = ({ children, className = '' }: KPIGridProps) => {
  return <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>{children}</div>;
};

export interface SummaryPanelProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SummaryPanel = ({ title, children, actions, className = '' }: SummaryPanelProps) => {
  return (
    <div
      className={`flex flex-col bg-surface-primary border border-border/50 rounded-card elevation-raised overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 bg-surface-secondary/30 border-b border-border/30 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text">{title}</h3>
        {actions}
      </div>
      <div className="flex-1 p-4 overflow-y-auto">{children}</div>
    </div>
  );
};

export const ActivityPanel = SummaryPanel;

export interface ChartContainerProps {
  children: React.ReactNode;
  aspectRatio?: string;
  className?: string;
}

export const ChartContainer = ({
  children,
  aspectRatio = 'aspect-[16/9]',
  className = '',
}: ChartContainerProps) => {
  return (
    <div
      className={`w-full bg-surface-secondary/25 rounded-input border border-border/30 elevation-inset flex items-center justify-center text-text-muted text-[10px] font-mono italic ${aspectRatio} ${className}`}
    >
      {children}
    </div>
  );
};

export const ChartPanel = ({ title, children, actions, className = '' }: SummaryPanelProps) => {
  return (
    <div
      className={`flex flex-col bg-surface-primary border border-border/50 rounded-card elevation-raised overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 bg-surface-secondary/30 border-b border-border/30 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text">{title}</h3>
        {actions}
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div
          className={`w-full bg-surface-secondary/25 rounded-input border border-border/30 elevation-inset flex items-center justify-center text-text-muted text-[10px] font-mono italic aspect-[16/9]`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  permissionRequired?: string;
  variant?: 'primary' | 'secondary' | 'neutral' | 'accent';
}

export interface QuickActionsGridProps {
  actions: QuickActionItem[];
  userPermissions?: string[];
  className?: string;
}

export const QuickActionsGrid = ({ actions, userPermissions = [], className = '' }: QuickActionsGridProps) => {
  const filteredActions = actions.filter(action =>
    !action.permissionRequired || userPermissions.includes(action.permissionRequired)
  );

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 ${className}`}>
      {filteredActions.map((action) => (
        <button
          key={action.id}
          onClick={action.onClick}
          className={`
            flex flex-col items-center justify-center gap-3 p-4 rounded-card bg-surface-primary border border-border/50
            elevation-raised hover:elevation-hover active:elevation-pressed transition-all group
          `}
        >
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center transition-colors
            ${action.variant === 'accent' ? 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-surface' :
              action.variant === 'primary' ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-surface' :
              'bg-surface-secondary text-text-muted group-hover:text-text'}
          `}>
            {action.icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text text-center leading-tight">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export interface QuickActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const QuickActions = ({ children, className = '' }: QuickActionsProps) => {
  return <div className={`flex flex-wrap gap-2 ${className}`}>{children}</div>;
};
