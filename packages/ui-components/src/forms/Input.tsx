import * as React from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  size?: InputSize;
  error?: boolean | string;
  success?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  monospace?: boolean;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-7 text-xs px-2.5',
  md: 'h-8 text-xs px-3',
  lg: 'h-10 text-sm px-3.5',
};

const prefixPaddingClasses: Record<InputSize, string> = {
  sm: 'pl-7',
  md: 'pl-8',
  lg: 'pl-9',
};

const suffixPaddingClasses: Record<InputSize, string> = {
  sm: 'pr-7',
  md: 'pr-8',
  lg: 'pr-9',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      error,
      success,
      prefix,
      suffix,
      monospace = false,
      disabled,
      readOnly,
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
    const prefixClass = prefix ? prefixPaddingClasses[size] : '';
    const suffixClass = suffix ? suffixPaddingClasses[size] : '';

    return (
      <div className="relative flex items-center w-full">
        {prefix && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted flex items-center justify-center pointer-events-none shrink-0">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          readOnly={readOnly}
          className={[
            'w-full bg-surface-primary text-text-primary placeholder:text-text-muted/60',
            'border rounded-input font-ui transition-all duration-150 ease-out',
            'focus:outline-none',
            'disabled:bg-surface-disabled disabled:text-text-disabled disabled:border-border-subtle disabled:cursor-not-allowed disabled:opacity-50',
            'read-only:bg-surface-disabled read-only:text-text-secondary read-only:border-border-subtle',
            sizeClass,
            prefixClass,
            suffixClass,
            monospace ? 'font-mono' : '',
            stateClasses,
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
        {suffix && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted flex items-center justify-center pointer-events-none shrink-0">
            {suffix}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
