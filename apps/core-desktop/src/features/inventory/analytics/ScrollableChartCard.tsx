// [phase: 8E] Scrollable Chart Card Wrapper with Thin Scrollbar & Accessibility
import * as React from 'react';
import { Button } from '@40labs/ui-components';

export interface ScrollableChartCardProps {
  title: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyAction?: () => void;
  emptyActionLabel?: string;
  rowCount: number;
  rowHeight?: number;
  minHeight?: number;
  children: React.ReactNode;
  fallbackTableData?: Array<{ label: string; count: number; value?: number }>;
  ariaLabel: string;
}

export const ScrollableChartCard: React.FC<ScrollableChartCardProps> = ({
  title,
  isLoading,
  isError,
  onRetry,
  isEmpty,
  emptyAction,
  emptyActionLabel = 'Add Stock',
  rowCount,
  rowHeight = 36,
  minHeight = 180,
  children,
  fallbackTableData = [],
  ariaLabel,
}) => {
  const [showAll, setShowAll] = React.useState(false);
  const effectiveRowCount = rowCount > 10 && !showAll ? 10 : rowCount;
  const computedHeight = Math.max(minHeight, effectiveRowCount * rowHeight);

  if (isLoading) {
    return (
      <div className="bg-surface-elevated rounded-[12px] border border-border/40 p-3 flex flex-col h-full min-h-[220px]">
        <h4 className="font-heading text-[11px] font-bold text-text uppercase tracking-wider mb-2">{title}</h4>
        <div className="flex-1 bg-surface-secondary/40 rounded animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface-elevated rounded-[12px] border border-border/40 p-3 flex flex-col h-full min-h-[220px] items-center justify-center">
        <span className="text-danger text-xs mb-2">Failed to load analytics</span>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="bg-surface-elevated rounded-[12px] border border-border/40 p-3 flex flex-col h-full min-h-[220px] items-center justify-center">
        <span className="text-text-muted text-xs mb-2">No stock yet</span>
        {emptyAction && (
          <Button variant="primary" size="sm" onClick={emptyAction}>{emptyActionLabel}</Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface-elevated rounded-[12px] border border-border/40 p-3 flex flex-col h-full min-h-[220px]">
      {/* Pinned Title Row */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h4 className="font-heading text-[11px] font-bold text-text uppercase tracking-wider">
          {title}
        </h4>
        {rowCount > 10 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] text-action-primary hover:underline font-bold cursor-pointer"
          >
            {showAll ? 'Show Top 10' : `Show All (${rowCount})`}
          </button>
        )}
      </div>

      {/* Scrollable Body */}
      <div
        tabIndex={0}
        role="region"
        aria-label={ariaLabel}
        className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] custom-scrollbar relative focus:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
      >
        <div style={{ height: `${computedHeight}px`, width: '100%' }}>
          {children}
        </div>
      </div>

      {/* Visually hidden table fallback for accessibility */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Label</th>
            <th>Count</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {fallbackTableData.map((row, i) => (
            <tr key={i}>
              <td>{row.label}</td>
              <td>{row.count}</td>
              <td>{row.value ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
