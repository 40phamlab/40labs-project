import * as React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Spinner } from '../feedback/Spinner';
import { Skeleton } from '../feedback/Skeleton';
import { Table, TableHeader, TableBody, TableRow, TableCell } from './Table';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState = ({
  title = 'No data found',
  message = 'Try adjusting your filters or search terms.',
  icon,
  action,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-strong rounded-card border border-border border-dashed">
      {icon && <div className="mb-4 text-text-muted">{icon}</div>}
      <h3 className="text-sm font-bold text-text mb-1">{title}</h3>
      <p className="text-xs text-text-muted max-w-xs">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = 'Loading...' }: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-surface-strong rounded-card border border-border">
      <Spinner size="md" className="mb-4" />
      <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{message}</span>
    </div>
  );
};

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error while fetching your data.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-danger/5 rounded-card border border-danger/20">
      <div className="text-danger mb-4">
        <AlertTriangle size={32} />
      </div>
      <h3 className="text-sm font-bold text-text mb-1">{title}</h3>
      <p className="text-xs text-text-muted max-w-xs mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 bg-danger text-surface rounded-input hover:opacity-90 transition-opacity"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
};

export const SuccessState = ({
  title = 'Success!',
  message = 'Your operation has been completed successfully.',
  action,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-primary/5 rounded-card border border-primary/20">
      <div className="text-primary mb-4">
        <CheckCircle size={32} />
      </div>
      <h3 className="text-sm font-bold text-text mb-1">{title}</h3>
      <p className="text-xs text-text-muted max-w-xs">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable = ({ rows = 5, columns = 4 }: SkeletonTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableCell key={i} isHeader>
              <Skeleton className="h-3 w-16" />
            </TableCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: columns }).map((_, j) => (
              <TableCell key={j}>
                <Skeleton className="h-3 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
