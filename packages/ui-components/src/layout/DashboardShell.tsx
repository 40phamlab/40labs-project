import React from 'react';

export interface DashboardShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  subNav?: React.ReactNode;
  children: React.ReactNode;
  showSubNav?: boolean;
  className?: string;
}

export function DashboardShell({
  sidebar,
  header,
  subNav,
  children,
  className = '',
  showSubNav = false,
}: DashboardShellProps) {
  return (
    <div className={`flex h-screen w-full bg-surface text-text overflow-hidden ${className}`}>
      {/* Primary Outer Sidebar Slot */}
      <div className="flex-shrink-0 h-full z-40">
        {sidebar}
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Top Header Bar Slot */}
        <div className="flex-shrink-0 w-full z-30">
          {header}
        </div>

        <div className="flex-1 flex min-w-0 overflow-hidden">
          {/* Optional Inner Contextual Sidebar Slot */}
          {showSubNav && subNav && (
            <aside className="flex-shrink-0 w-64 h-full bg-surface-strong/40 border-r border-border/10 overflow-y-auto no-scrollbar p-2">
              {subNav}
            </aside>
          )}

          {/* Main Workspace Stage */}
          <main className="flex-1 min-w-0 h-full overflow-y-auto bg-surface relative no-scrollbar">
            <div className="p-8 max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Keep existing exports for backward compatibility if they were used,
// but the new DashboardShell is the primary focus.
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
