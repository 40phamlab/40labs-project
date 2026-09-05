import { type SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean | string;
  success?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, success, children, className = '', ...rest }, ref) => {
    const hasError = !!error;

    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={[
            'w-full rounded-input bg-input text-text appearance-none px-3 py-2 h-10 text-sm transition-all duration-150 ease-out font-ui',
            'elevation-inset focus:outline-none focus:ring-2 pr-10',
            hasError ? 'ring-2 ring-danger/50 focus:ring-danger/60' :
            success ? 'ring-2 ring-primary/50 focus:ring-primary/60' :
            'focus:ring-primary/45',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'read-only:bg-panel-strong/30 read-only:elevation-flat',
            className,
          ].filter(Boolean).join(' ')}
          {...rest}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  },
);
Select.displayName = 'Select';
