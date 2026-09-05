import * as React from 'react';

export interface DashboardShellProps {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const DashboardShell = ({ sidebar, children, className = '' }: DashboardShellProps) => {
  return (
    <div className={`flex h-screen w-full bg-surface overflow-hidden ${className}`}>
      {sidebar}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export interface DashboardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const DashboardHeader = ({ title, subtitle, actions, className = '' }: DashboardHeaderProps) => {
  return (
    <div className={`flex items-end justify-between px-6 py-6 bg-surface border-b border-border/50 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-xl font-heading font-bold text-text truncate">{title}</h1>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0 ml-4">{actions}</div>}
    </div>
  );
};

export interface DashboardToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardToolbar = ({ children, className = '' }: DashboardToolbarProps) => {
  return (
    <div className={`flex items-center gap-4 px-6 py-3 bg-panel-strong/10 border-b border-border/50 ${className}`}>
      {children}
    </div>
  );
};
