import * as React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton({ variant = 'rect', className = '', ...props }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-panel-strong';

  const variantClasses = {
    text: 'h-3 w-full rounded-sm',
    rect: 'rounded-md',
    circle: 'rounded-full',
  };

  return (
    <div
      className={[baseClasses, variantClasses[variant], className].join(' ')}
      {...props}
    />
  );
}
