import * as React from 'react';
import { Surface, SurfaceProps } from '../layout/Surface';

export interface CardProps extends SurfaceProps {
  interactive?: boolean;
}

export function Card({ variant = 'raised', padding = 'md', ...props }: CardProps) {
  return <Surface variant={variant} padding={padding} {...props} />;
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
