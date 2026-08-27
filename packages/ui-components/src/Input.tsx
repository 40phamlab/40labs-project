import { type InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  monospace?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, monospace = false, className = '', id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="font-ui text-sm text-text-muted">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={[
            'rounded-input px-3 py-2 bg-input text-text placeholder:text-text-muted/60',
            'elevation-inset focus:outline-none focus:ring-2 focus:ring-primary/45',
            monospace ? 'font-mono' : 'font-ui',
            error ? 'ring-2 ring-danger/50' : '', className,
          ].filter(Boolean).join(' ')}
          {...rest}
        />
        {error && <span className="text-danger text-xs font-ui">{error}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';
