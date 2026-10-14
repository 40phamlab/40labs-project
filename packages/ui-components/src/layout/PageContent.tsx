import * as React from 'react';
import { LoadingState, ErrorState } from '../data-display/States';
import { EmptyState } from '../feedback/EmptyState';

export interface PageContentProps {
  children?: React.ReactNode;
  className?: string;
  scrollable?: boolean;
  variant?: 'panel' | 'transparent' | 'none';
  padding?: 'normal' | 'compact' | 'none';
  loading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
}

export function PageContent({
  children,
  className = '',
  scrollable = true,
  variant = 'panel',
  padding = 'normal',
  loading = false,
  error = null,
  onRetry,
  isEmpty = false,
  emptyTitle = 'No records found',
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

  const baseClasses = `flex-1 min-h-0 min-w-0 w-full flex flex-col ${scrollClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  if (loading) {
    return (
      <div className={baseClasses}>
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={baseClasses}>
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <ErrorState
            title="Failed to Load Content"
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
            icon={emptyIcon}
            action={emptyAction}
          />
        </div>
      </div>
    );
  }

  return <div className={baseClasses}>{children}</div>;
}
