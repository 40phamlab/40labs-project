import * as React from 'react';
import { Spinner } from '../feedback/Spinner';

export type IconButtonVariant = 'primary' | 'secondary' | 'neutral' | 'danger' | 'ghost';
export type IconButtonIntent = IconButtonVariant;
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: IconButtonVariant;
  intent?: IconButtonIntent;
  size?: IconButtonSize;
  rounded?: 'input' | 'full';
  loading?: boolean;
}

const variantClasses: Record<IconButtonVariant, string> = {
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
};

const sizeClasses: Record<IconButtonSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-7 h-7 text-xs',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      variant,
      intent,
      size = 'md',
      rounded = 'input',
      loading = false,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const activeVariant = variant || intent || 'primary';
    const variantClass = variantClasses[activeVariant as IconButtonVariant] || variantClasses.primary;
    const sizeClass = sizeClasses[size as IconButtonSize] || sizeClasses.md;
    const radiusClass = rounded === 'full' ? 'rounded-full' : 'rounded-input';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-label={label}
        aria-busy={loading}
        className={[
          'relative inline-flex items-center justify-center font-ui font-medium shrink-0',
          'transition-all duration-150 ease-out select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app-bg',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none',
          radiusClass,
          variantClass,
          sizeClass,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading ? (
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
        ) : (
          <span className="flex items-center justify-center shrink-0 text-current">{icon}</span>
        )}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
