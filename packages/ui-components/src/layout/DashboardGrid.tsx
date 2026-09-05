import * as React from 'react';

export interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardGrid = ({ children, className = '' }: DashboardGridProps) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 p-6 overflow-y-auto ${className}`}>
      {children}
    </div>
  );
};

export interface DashboardSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

export const DashboardSection = ({
  title,
  children,
  className = '',
  colSpan = 12
}: DashboardSectionProps) => {
  const spanClasses = {
    1: 'lg:col-span-1',
    2: 'lg:col-span-2',
    3: 'lg:col-span-3',
    4: 'lg:col-span-4',
    5: 'lg:col-span-5',
    6: 'lg:col-span-6',
    7: 'lg:col-span-7',
    8: 'lg:col-span-8',
    9: 'lg:col-span-9',
    10: 'lg:col-span-10',
    11: 'lg:col-span-11',
    12: 'lg:col-span-12',
  };

  return (
    <div className={`${spanClasses[colSpan]} space-y-4 ${className}`}>
      {title && (
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

export interface DashboardCardProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const DashboardCard = ({
  title,
  children,
  footer,
  actions,
  className = '',
  noPadding = false,
}: DashboardCardProps) => {
  return (
    <div className={`flex flex-col bg-panel rounded-card border border-border/50 elevation-raised overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-panel-strong/10">
          {title && <h3 className="text-[10px] font-bold uppercase tracking-wider text-text">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`flex-1 ${noPadding ? '' : 'p-4'}`}>
        {children}
      </div>
      {footer && (
        <div className="px-4 py-2 border-t border-border/30 bg-panel-strong/5 text-[10px] text-text-muted">
          {footer}
        </div>
      )}
    </div>
  );
};
