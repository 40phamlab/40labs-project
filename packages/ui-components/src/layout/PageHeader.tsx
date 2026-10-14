import * as React from 'react';

export interface PageHeaderProps {
  /** Primary page title (string or custom React node) */
  title: React.ReactNode;
  /** Optional status or category badge displayed adjacent to title */
  badge?: React.ReactNode;
  /** Optional breadcrumbs rendered above header title */
  breadcrumbs?: React.ReactNode;
  /** Action buttons or header controls displayed on the right */
  actions?: React.ReactNode;
  /** Additional custom header content rendered below main title row */
  extra?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  badge,
  breadcrumbs,
  actions,
  extra,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`shrink-0 flex flex-col gap-1 w-full pb-3 border-b border-border/30 ${className}`}>
      {breadcrumbs && (
        <div className="text-xs text-text-muted mb-0.5">{breadcrumbs}</div>
      )}

      <div className="min-h-[44px] flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {typeof title === 'string' ? (
              <h1 className="text-xl font-bold text-text font-heading tracking-tight truncate">
                {title}
              </h1>
            ) : (
              title
            )}
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {extra && <div className="mt-2 w-full">{extra}</div>}
    </header>
  );
}
