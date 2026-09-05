import * as React from 'react';

export type StatusType = 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'warning';

const statusMap: Record<StatusType, { variantClass: string; label: string }> = {
  active: { variantClass: 'bg-primary/20 text-primary border-primary/30', label: 'Active' },
  inactive: { variantClass: 'bg-panel-strong text-text-muted', label: 'Inactive' },
  pending: { variantClass: 'bg-accent/20 text-accent border-accent/30', label: 'Pending' },
  error: { variantClass: 'bg-danger/20 text-danger border-danger/30', label: 'Error' },
  success: { variantClass: 'bg-primary/20 text-primary border-primary/30', label: 'Success' },
  warning: { variantClass: 'bg-accent/20 text-accent border-accent/30', label: 'Warning' },
};

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export const StatusBadge = ({ status, label, className = '' }: StatusBadgeProps) => {
  const config = statusMap[status] || statusMap.inactive;
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
        ${config.variantClass} ${className}
      `}
    >
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {label || config.label}
      </span>
    </span>
  );
};
