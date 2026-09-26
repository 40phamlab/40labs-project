import * as React from 'react';
import { AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { Spinner } from '../feedback/Spinner';
import { Skeleton } from '../feedback/Skeleton';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableDensity } from './Table';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  message = 'Try adjusting your filters or search terms.',
  icon = <Database size={32} className="opacity-40" />,
  action,
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center p-12 text-center
        bg-surface-strong rounded-card border border-border border-dashed
        ${className}
      `}
    >
      {icon && <div className="mb-3 text-text-muted flex items-center justify-center">{icon}</div>}
      <h3 className="text-sm font-bold text-text mb-1">{title}</h3>
      <p className="text-xs text-text-muted max-w-xs">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center p-12 bg-surface-strong rounded-card border border-border
        ${className}
      `}
    >
      <Spinner size="md" className="mb-3 text-primary" />
      <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{message}</span>
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'We encountered an error while fetching your data. Please try again.',
  onRetry,
  retryText = 'Retry Connection',
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center p-10 text-center bg-danger/5 rounded-card border border-danger/20
        ${className}
      `}
    >
      <div className="text-danger mb-3 p-2 bg-danger/10 rounded-full">
        <AlertTriangle size={28} />
      </div>
      <h3 className="text-sm font-bold text-text mb-1">{title}</h3>
      <p className="text-xs text-text-muted max-w-sm mb-5">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 bg-danger text-surface rounded-input hover:opacity-90 transition-opacity"
        >
          {retryText}
        </button>
      )}
    </div>
  );
};

export interface SuccessStateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title = 'Success!',
  message = 'Your operation has been completed successfully.',
  action,
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center p-12 text-center bg-primary/5 rounded-card border border-primary/20
        ${className}
      `}
    >
      <div className="text-primary mb-3">
        <CheckCircle size={32} />
      </div>
      <h3 className="text-sm font-bold text-text mb-1">{title}</h3>
      <p className="text-xs text-text-muted max-w-xs">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  density?: TableDensity;
  dense?: boolean;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  density = 'normal',
  dense,
}) => {
  const actualDensity = dense ? 'compact' : density;

  return (
    <Table density={actualDensity}>
      <TableHeader>
        <TableRow hoverable={false}>
          {Array.from({ length: columns }).map((_, i) => (
            <TableCell key={i} isHeader density={actualDensity}>
              <Skeleton className="h-3 w-20" />
            </TableCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex} hoverable={false}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex} density={actualDensity}>
                <Skeleton className={`h-3 ${colIndex === 0 ? 'w-32' : 'w-16'}`} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
