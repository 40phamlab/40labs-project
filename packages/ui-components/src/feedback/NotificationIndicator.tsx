import * as React from 'react';

export interface NotificationIndicatorProps {
  count?: number;
  className?: string;
}

export const NotificationIndicator = ({ count, className = '' }: NotificationIndicatorProps) => {
  if (count === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-danger text-[10px] font-bold text-surface elevation-raised ${className}`}
    >
      {count && count > 99 ? '99+' : count}
    </span>
  );
};
