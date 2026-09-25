import * as React from 'react';

export interface PageHeaderProps {
  /** Primary page title (string or custom React node) */
  title: React.ReactNode;
  /** Subtitle or explanatory text */
  subtitle?: React.ReactNode;
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

/**
 * PageHeader
 *
 * Standardized header component for all desktop pages in the 40Labs layout system.
 * Enforces title typography, consistent header height, subtitle formatting, and action layout.
 */
export function PageHeader({
  title,
  subtitle,
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
          {subtitle && (
            <p className="text-xs text-text-muted mt-0.5 leading-normal truncate">
              {subtitle}
            </p>
          )}
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
