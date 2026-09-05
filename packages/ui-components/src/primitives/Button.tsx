import * as React from 'react';
import { Spinner } from '../feedback/Spinner';

export type ButtonIntent = 'primary' | 'secondary' | 'neutral' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: ButtonIntent;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const intentClasses: Record<ButtonIntent, string> = {
  primary: 'bg-primary text-surface elevation-raised hover:elevation-hover active:elevation-pressed',
  secondary: 'bg-surface-strong text-primary border border-primary/20 elevation-raised hover:elevation-hover active:elevation-pressed',
  neutral: 'bg-panel-strong text-text elevation-raised hover:elevation-hover active:elevation-pressed',
  danger: 'bg-danger text-surface elevation-raised hover:elevation-hover active:elevation-pressed',
  ghost: 'bg-transparent text-text hover:bg-panel-strong/30 active:bg-panel-strong/50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 h-8',
  md: 'text-sm px-4 py-2.5 h-10',
  lg: 'text-base px-6 py-3 h-12',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      intent = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      className = '',
      children,
      leftIcon,
      rightIcon,
      ...rest
    },
    ref,
  ) => {
    const intentClass = intentClasses[intent as ButtonIntent] || intentClasses.primary;
    const sizeClass = sizeClasses[size as ButtonSize] || sizeClasses.md;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'relative inline-flex items-center justify-center font-ui font-medium rounded-input',
          'transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-primary/45',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:elevation-flat',
          intentClass,
          sizeClass,
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size={size === 'lg' ? 'md' : 'sm'} />
          </div>
        )}
        <div className={[
          'flex items-center gap-2',
          loading ? 'invisible' : 'visible'
        ].join(' ')}>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </div>
      </button>
    );
  },
);

Button.displayName = 'Button';
