import * as React from 'react';
import { Spinner } from '../feedback/Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'neutral' | 'danger' | 'ghost' | 'accent';
export type ButtonIntent = ButtonVariant;
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  intent?: ButtonIntent;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-action-primary text-text-inverse hover:bg-action-primary-hover active:bg-action-primary-active border border-transparent shadow-sm',
  secondary:
    'bg-surface-elevated text-text-primary border border-border-default hover:border-border-strong hover:bg-surface-hover active:bg-surface-active shadow-sm',
  neutral:
    'bg-surface-secondary text-text-primary border border-border-subtle hover:border-border-default hover:bg-surface-hover active:bg-surface-active shadow-sm',
  danger:
    'bg-danger text-text-primary hover:bg-danger/90 active:bg-danger/80 border border-transparent shadow-sm',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-active border border-transparent',
  accent:
    'bg-accent text-text-inverse hover:bg-accent/90 active:bg-accent/80 border border-transparent shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-6 text-xs px-2 gap-1',
  sm: 'h-7 text-xs px-2.5 gap-1.5',
  md: 'h-8 text-xs font-medium px-3 gap-1.5',
  lg: 'h-10 text-sm font-medium px-4 gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      intent,
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      className = '',
      children,
      leftIcon,
      rightIcon,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const activeVariant = variant || intent || 'primary';
    const variantClass = variantClasses[activeVariant as ButtonVariant] || variantClasses.primary;
    const sizeClass = sizeClasses[size as ButtonSize] || sizeClasses.md;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading}
        className={[
          'relative inline-flex items-center justify-center font-ui font-medium rounded-input',
          'transition-all duration-150 ease-out select-none shrink-0',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app-bg',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none',
          variantClass,
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
        <span
          className={[
            'inline-flex items-center justify-center gap-1.5',
            loading ? 'opacity-0' : 'opacity-100',
          ].join(' ')}
        >
          {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
        </span>
      </button>
    );
  },
);

Button.displayName = 'Button';
