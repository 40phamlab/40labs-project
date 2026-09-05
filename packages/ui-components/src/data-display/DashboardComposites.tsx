import * as React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
}: KPICardProps) => {
  const toneClasses = {
    default: 'text-text',
    primary: 'text-primary',
    accent: 'text-accent',
    danger: 'text-danger',
  };

  return (
    <div
      className={`relative p-4 bg-panel rounded-card border border-border/50 elevation-raised group ${className}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{title}</div>
        <div className="flex items-center gap-2">
          {actions}
          {icon && <div className="text-text-muted group-hover:text-primary transition-colors">{icon}</div>}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className={`text-2xl font-mono font-bold ${toneClasses[tone]}`}>{value}</div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-3">
            {trend && (
              <div className="flex items-center gap-1.5">
                <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trend.isUp ? 'text-primary' : 'text-danger'}`}>
                  {trend.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {trend.value}%
                </span>
              </div>
            )}
            {subtitle && <span className="text-[10px] text-text-muted truncate">{subtitle}</span>}
          </div>
        )}
      </div>
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
      className={`flex flex-col bg-surface-strong border border-border rounded-card overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 bg-panel-strong/20 border-b border-border flex items-center justify-between">
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
      className={`w-full bg-panel-strong/10 rounded-input border border-border/30 flex items-center justify-center text-text-muted text-[10px] font-mono italic ${aspectRatio} ${className}`}
    >
      {children}
    </div>
  );
};

export const ChartPanel = ({ title, children, actions, className = '' }: SummaryPanelProps) => {
  return (
    <div
      className={`flex flex-col bg-surface-strong border border-border rounded-card overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 bg-panel-strong/20 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text">{title}</h3>
        {actions}
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div
          className={`w-full bg-panel-strong/10 rounded-input border border-border/30 flex items-center justify-center text-text-muted text-[10px] font-mono italic aspect-[16/9]`}
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
            flex flex-col items-center justify-center gap-3 p-4 rounded-card bg-panel border border-border/50
            elevation-raised hover:elevation-hover active:elevation-pressed transition-all group
          `}
        >
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center transition-colors
            ${action.variant === 'accent' ? 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-surface' :
              action.variant === 'primary' ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-surface' :
              'bg-panel-strong text-text-muted group-hover:text-text'}
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
