import * as React from 'react';

export interface KeyValueProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  horizontal?: boolean;
}

export const KeyValue = ({ label, value, className = '', horizontal }: KeyValueProps) => {
  return (
    <div className={`${horizontal ? 'flex justify-between items-center' : 'flex flex-col gap-0.5'} ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</span>
      <span className="text-xs font-medium text-text">{value}</span>
    </div>
  );
};

export interface MetricProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
}

export const Metric = ({ label, value, subtext, trend, className = '' }: MetricProps) => {
  return (
    <div className={`p-4 bg-panel rounded-card border border-border/50 elevation-raised ${className}`}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-mono font-bold text-text">{value}</div>
        {trend && (
          <div className={`text-[10px] font-bold ${trend.isUp ? 'text-primary' : 'text-danger'}`}>
            {trend.isUp ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>
      {subtext && <div className="text-[10px] text-text-muted mt-1">{subtext}</div>}
    </div>
  );
};

export interface StatGroupProps {
  children: React.ReactNode;
  className?: string;
  columns?: number;
}

export const StatGroup = ({ children, className = '', columns = 3 }: StatGroupProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns as 1 | 2 | 3 | 4];

  return (
    <div className={`grid gap-4 ${gridCols} ${className}`}>
      {children}
    </div>
  );
};
