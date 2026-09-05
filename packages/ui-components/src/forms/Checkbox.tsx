import * as React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (props, ref) => {
    const { label, className = '', id, ...rest } = props;
    const checkboxId = id ?? rest.name;
    return (
      <label className={['inline-flex items-center gap-2 cursor-pointer select-none group', rest.disabled ? 'opacity-50 cursor-not-allowed' : ''].join(' ')}>
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            ref={ref}
            id={checkboxId}
            className={[
              'peer appearance-none w-5 h-5 rounded bg-input elevation-inset',
              'checked:bg-primary checked:elevation-raised transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary/45',
              className
            ].join(' ')}
            {...rest}
          />
          <svg
            className="absolute w-3.5 h-3.5 pointer-events-none hidden peer-checked:block text-surface"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        {label && <span className="text-sm text-text font-medium">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
