import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children?: React.ReactNode;
}

export function Card({ interactive = false, className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={[
        'bg-panel rounded-card text-text overflow-hidden',
        'elevation-raised',
        interactive ? 'hover:elevation-hover cursor-pointer transition-shadow duration-150 ease-out' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['px-4 py-3 border-b border-border/20', className].join(' ')} {...props}>
      {children}
    </div>
  );
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  children?: React.ReactNode;
}

export function CardBody({ noPadding = false, className = '', children, ...props }: CardBodyProps) {
  return (
    <div className={[noPadding ? '' : 'p-4', className].join(' ')} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['px-4 py-3 border-t border-border/20 bg-panel-strong/30', className].join(' ')} {...props}>
      {children}
    </div>
  );
}
