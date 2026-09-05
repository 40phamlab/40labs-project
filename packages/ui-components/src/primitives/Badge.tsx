import * as React from 'react';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'surface';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-panel-strong text-text-muted',
  primary: 'bg-primary/20 text-primary border border-primary/30',
  success: 'bg-primary/20 text-primary border border-primary/30',
  warning: 'bg-accent/20 text-accent border border-accent/30',
  danger: 'bg-danger/20 text-danger border border-danger/30',
  info: 'bg-field/20 text-field border border-field/30',
  surface: 'bg-surface text-primary',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const variantClass = variantClasses[variant as BadgeVariant] || variantClasses.neutral;
  const sizeClass = size === 'sm' ? 'px-1.5 py-0 text-[9px]' : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-bold uppercase tracking-wider',
        variantClass,
        sizeClass,
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
