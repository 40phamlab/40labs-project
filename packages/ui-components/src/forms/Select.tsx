import * as React from 'react';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: SelectSize;
  error?: boolean | string;
  success?: boolean;
}

const sizeClasses: Record<SelectSize, string> = {
  sm: 'h-7 text-xs pl-2.5 pr-7',
  md: 'h-8 text-xs pl-3 pr-8',
  lg: 'h-10 text-sm pl-3.5 pr-9',
};

const iconSizes: Record<SelectSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-4 h-4',
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      error,
      success,
      disabled,
      children,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const hasError = !!error;

    const stateClasses = hasError
      ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger'
      : success
      ? 'border-success focus:border-success focus:ring-1 focus:ring-success'
      : 'border-border-default hover:border-border-strong focus:border-border-focus focus:ring-1 focus:ring-focus-ring';

    const sizeClass = sizeClasses[size] || sizeClasses.md;
    const iconSize = iconSizes[size] || 'w-4 h-4';

    return (
      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={[
            'w-full bg-surface-primary text-text-primary appearance-none',
            'border rounded-input font-ui transition-all duration-150 ease-out',
            'focus:outline-none',
            'disabled:bg-surface-disabled disabled:text-text-disabled disabled:border-border-subtle disabled:cursor-not-allowed disabled:opacity-50',
            sizeClass,
            stateClasses,
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        >
          {children}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted flex items-center justify-center shrink-0">
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  },
);

Select.displayName = 'Select';
