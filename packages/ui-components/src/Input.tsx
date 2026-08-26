// [PHASE: MVP]
// [SPEC: CONTEXT/04-CONVENTIONS.md]
import { type InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  monospace?: boolean; // for prices, codes, batch/lot IDs, Business IDs
}

// Inputs use elevation-inset ("carved in") always — this is what visually
// distinguishes "you can type here" from a display card, per the
// Application rules in 02-DESIGN-TOKENS.md. Do not add elevation-raised
// to an input under any circumstance.
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, monospace = false, className = '', id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="font-ui text-sm text-black/70">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'rounded-input px-3 py-2 bg-surface',
            'elevation-inset',
            'focus:outline-none focus:ring-2 focus:ring-primary/40',
            monospace ? 'font-mono' : 'font-ui',
            error ? 'ring-2 ring-danger/50' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
        {error && <span className="text-danger text-xs font-ui">{error}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';