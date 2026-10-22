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
  children: React.ReactNode | ((showAll: boolean) => React.ReactNode);
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
  rowHeight = 28,
  children,
  ariaLabel,
}) => {
  const [showAll, setShowAll] = React.useState(false);
  const displayRows = rowCount > 8 && !showAll ? 8 : rowCount;
  const naturalHeight = Math.max(220, displayRows * rowHeight);
  const needsScroll = naturalHeight > 360;
  const containerHeight = Math.min(360, naturalHeight);

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

  return (
    <div className="bg-surface-elevated rounded-[12px] border border-border/40 p-3 flex flex-col shrink-0">
      {/* Pinned Title Row */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h4 className="font-heading text-[11px] font-bold text-text uppercase tracking-wider">
          {title}
        </h4>
        {rowCount > 8 && !isEmpty && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] text-action-primary hover:underline font-bold cursor-pointer"
          >
            {showAll ? 'Show Top 8' : `Show All (${rowCount})`}
          </button>
        )}
      </div>

      {/* Chart Body Container / Empty State */}
      {isEmpty ? (
        <div className="flex items-center justify-center h-[180px] text-text-muted text-xs">
          {emptyAction ? (
            <Button variant="primary" size="sm" onClick={emptyAction}>{emptyActionLabel}</Button>
          ) : (
            '—'
          )}
        </div>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-label={ariaLabel}
          className={`w-full relative focus:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring ${
            needsScroll ? 'max-h-[360px] overflow-y-auto custom-scrollbar' : ''
          }`}
          style={{ height: `${needsScroll ? 360 : containerHeight}px` }}
        >
          <div style={{ height: `${naturalHeight}px`, width: '100%' }}>
            {typeof children === 'function' ? children(showAll) : children}
          </div>
        </div>
      )}
    </div>
  );
};
