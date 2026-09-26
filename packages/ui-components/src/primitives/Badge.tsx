import * as React from 'react';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'surface';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: 'full' | 'md';
  children?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-secondary text-text-muted border border-border-subtle',
  primary: 'bg-success-bg text-success border border-success-border',
  success: 'bg-success-bg text-success border border-success-border',
  warning: 'bg-warning-bg text-warning border border-warning-border',
  danger: 'bg-danger-bg text-danger border border-danger-border',
  info: 'bg-info-bg text-info border border-info-border',
  surface: 'bg-surface-elevated text-text-primary border border-border-default',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'h-4 text-[10px] px-1.5 font-medium leading-none gap-1',
  md: 'h-5 text-xs px-2 font-medium leading-none gap-1',
  lg: 'h-6 text-xs px-2.5 font-medium leading-none gap-1.5',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  rounded = 'full',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const variantClass = variantClasses[variant] || variantClasses.neutral;
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const radiusClass = rounded === 'full' ? 'rounded-full' : 'rounded-input';

  return (
    <span
      className={[
        'inline-flex items-center justify-center font-ui uppercase tracking-wider shrink-0 select-none',
        radiusClass,
        variantClass,
        sizeClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
