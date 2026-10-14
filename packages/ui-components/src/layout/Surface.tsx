import * as React from 'react';

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'flat' | 'raised' | 'inset';
  padding?: 'none' | 'sm' | 'md';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  interactive?: boolean;
  children?: React.ReactNode;
}

export function Surface({
  variant = 'flat',
  padding = 'md',
  header,
  footer,
  interactive = false,
  className = '',
  children,
  ...props
}: SurfaceProps) {
  const variantClasses = {
    flat: 'bg-surface-secondary/40 border border-border/40',
    raised: 'bg-panel elevation-raised',
    inset: 'bg-surface-secondary/60 elevation-inset border border-border/20',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2.5',
    md: 'p-4',
  };

  return (
    <div
      className={[
        'rounded-card text-text overflow-hidden',
        variantClasses[variant],
        interactive ? 'hover:elevation-hover cursor-pointer transition-shadow duration-150 ease-out' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {header && (
        <div className="px-4 py-3 border-b border-border/20">
          {header}
        </div>
      )}
      <div className={paddingClasses[padding]}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-border/20 bg-surface-secondary/30">
          {footer}
        </div>
      )}
    </div>
  );
}
