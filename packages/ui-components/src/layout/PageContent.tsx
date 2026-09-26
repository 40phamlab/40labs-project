import * as React from 'react';
import { EmptyState, LoadingState, ErrorState } from '../data-display/States';

export interface PageContentProps {
  children?: React.ReactNode;
  className?: string;
  /** Whether the content region is scrollable (default: true). Set false for multi-panel split views or POS */
  scrollable?: boolean;
  /** Container style variant */
  variant?: 'panel' | 'transparent' | 'none';
  /** Padding inside the content container */
  padding?: 'normal' | 'compact' | 'none';
  /** Standardized loading state */
  loading?: boolean;
  loadingMessage?: string;
  /** Standardized error state */
  error?: Error | string | null;
  onRetry?: () => void;
  /** Standardized empty state */
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
}

/**
 * PageContent
 *
 * Standardized main content container in the 40Labs canonical page layout.
 * Enforces ONE controlled content scroll region by default, standardizes spacing,
 * and provides built-in rendering for loading, empty, and error states.
 */
export function PageContent({
  children,
  className = '',
  scrollable = true,
  variant = 'panel',
  padding = 'normal',
  loading = false,
  loadingMessage = 'Loading page data...',
  error = null,
  onRetry,
  isEmpty = false,
  emptyTitle = 'No records found',
  emptyMessage = 'There is no data available to display at this time.',
  emptyIcon,
  emptyAction,
}: PageContentProps) {
  const variantClasses = {
    panel: 'bg-panel rounded-card border border-border/50 shadow-sm elevation-raised',
    transparent: 'bg-transparent border-none shadow-none',
    none: '',
  };

  const paddingClasses = {
    normal: 'p-3.5 gap-3.5',
    compact: 'p-2.5 gap-2.5',
    none: 'p-0 gap-0',
  };

  const scrollClasses = scrollable
    ? 'overflow-y-auto custom-scrollbar'
    : 'overflow-hidden';

  const baseClasses = `flex-1 min-h-0 w-full flex flex-col ${scrollClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  if (loading) {
    return (
      <div className={baseClasses}>
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <LoadingState message={loadingMessage} />
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    return (
      <div className={baseClasses}>
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <ErrorState
            title="Failed to Load Content"
            message={errorMessage}
            onRetry={onRetry}
          />
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={baseClasses}>
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <EmptyState
            title={emptyTitle}
            message={emptyMessage}
            icon={emptyIcon}
            action={emptyAction}
          />
        </div>
      </div>
    );
  }

  return <div className={baseClasses}>{children}</div>;
}
