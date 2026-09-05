import * as React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  error?: boolean | string;
  success?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  monospace?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    const {
      error,
      success,
      prefix,
      suffix,
      monospace = false,
      className = '',
      ...rest
    } = props;

    const hasError = !!error;

    return (
      <div className="relative group w-full">
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted flex items-center pointer-events-none">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          className={[
            'w-full rounded-input bg-input text-text placeholder:text-text-muted/60 transition-all duration-150 ease-out',
            'elevation-inset focus:outline-none focus:ring-2',
            prefix ? 'pl-9' : 'px-3',
            suffix ? 'pr-9' : 'px-3',
            'py-2 h-10 text-sm font-ui',
            monospace ? 'font-mono' : '',
            hasError ? 'ring-2 ring-danger/50 focus:ring-danger/60' :
            success ? 'ring-2 ring-primary/50 focus:ring-primary/60' :
            'focus:ring-primary/45',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'read-only:bg-panel-strong/30 read-only:elevation-flat',
            className,
          ].filter(Boolean).join(' ')}
          {...rest}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted flex items-center pointer-events-none">
            {suffix}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
