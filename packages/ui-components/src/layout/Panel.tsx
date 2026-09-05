import * as React from 'react';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'flat' | 'raised' | 'inset';
  children?: React.ReactNode;
}

export function Panel({ variant = 'flat', className = '', children, ...props }: PanelProps) {
  const variantClasses = {
    flat: 'bg-panel-strong/40',
    raised: 'bg-panel elevation-raised',
    inset: 'bg-panel-strong/60 elevation-inset',
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
