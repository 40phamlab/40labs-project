import * as React from 'react';

export interface PageToolbarProps {
  /** Filter or search controls placed on the left side */
  left?: React.ReactNode;
  /** Action buttons, sort or view switchers placed on the right side */
  right?: React.ReactNode;
  /** Direct children layout if custom flex arrangement is preferred */
  children?: React.ReactNode;
  className?: string;
}

/**
 * PageToolbar
 *
 * Standardized toolbar component for filter tabs, search bars, range pickers, and view controls.
 * Establishes consistent vertical alignment, spacing, and background styling across views.
 */
export function PageToolbar({
  left,
  right,
  children,
  className = '',
}: PageToolbarProps) {
  if (!left && !right && !children) {
    return null;
  }

  if (children) {
    return (
      <div
        className={`shrink-0 min-h-[38px] px-3 py-1.5 bg-panel-strong/40 rounded-card border border-border/40 flex flex-wrap sm:flex-nowrap items-center gap-2.5 ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 min-h-[38px] px-3 py-1.5 bg-panel-strong/40 rounded-card border border-border/40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
        {left}
      </div>
      {right && (
        <div className="flex items-center gap-2 shrink-0">
          {right}
        </div>
      )}
    </div>
  );
}
