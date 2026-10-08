import * as React from 'react';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'flat' | 'raised' | 'inset';
  children?: React.ReactNode;
}

export function Panel({ variant = 'flat', className = '', children, ...props }: PanelProps) {
  const variantClasses = {
    flat: 'bg-surface-secondary/40',
    raised: 'bg-surface-primary elevation-raised',
    inset: 'bg-surface-secondary/60 elevation-inset',
  };

  return (
    <div
      className={['rounded-card text-text', variantClasses[variant], className].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
