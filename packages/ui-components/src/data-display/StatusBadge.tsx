import * as React from 'react';

export type StatusType =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'draft'
  | 'cancelled'
  | 'processing';

export type StatusBadgeSize = 'sm' | 'md';

interface StatusConfig {
  variantClass: string;
  dotClass: string;
  label: string;
}

const statusMap: Record<StatusType, StatusConfig> = {
  active: {
    variantClass: 'bg-primary/20 text-primary border-primary/30',
    dotClass: 'bg-primary',
    label: 'Active',
  },
  inactive: {
    variantClass: 'bg-panel-strong text-text-muted border-border',
    dotClass: 'bg-text-muted',
    label: 'Inactive',
  },
  pending: {
    variantClass: 'bg-accent/20 text-accent border-accent/30',
    dotClass: 'bg-accent animate-pulse',
    label: 'Pending',
  },
  error: {
    variantClass: 'bg-danger/20 text-danger border-danger/30',
    dotClass: 'bg-danger',
    label: 'Error',
  },
  success: {
    variantClass: 'bg-primary/20 text-primary border-primary/30',
    dotClass: 'bg-primary',
    label: 'Success',
  },
  warning: {
    variantClass: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    dotClass: 'bg-amber-500',
    label: 'Warning',
  },
  info: {
    variantClass: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    dotClass: 'bg-sky-400',
    label: 'Info',
  },
  draft: {
    variantClass: 'bg-panel-strong text-text-muted border-border/80',
    dotClass: 'bg-text-muted/60',
    label: 'Draft',
  },
  cancelled: {
    variantClass: 'bg-danger/10 text-danger/80 border-danger/20',
    dotClass: 'bg-danger/80',
    label: 'Cancelled',
  },
  processing: {
    variantClass: 'bg-accent/20 text-accent border-accent/30',
    dotClass: 'bg-accent animate-spin',
    label: 'Processing',
  },
};

export interface StatusBadgeProps {
  status: StatusType;
  label?: React.ReactNode;
  size?: StatusBadgeSize;
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  showDot = true,
  className = '',
}) => {
  const config = statusMap[status] || statusMap.inactive;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-bold uppercase tracking-wider border rounded-full
        ${config.variantClass}
        ${sizeClasses}
        ${className}
      `}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`}
          aria-hidden="true"
        />
      )}
      <span>{label ?? config.label}</span>
    </span>
  );
};
