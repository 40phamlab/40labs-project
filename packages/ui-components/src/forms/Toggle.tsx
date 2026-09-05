import * as React from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}

export function Toggle({ checked, onChange, label, disabled = false, id }: ToggleProps) {
  const toggleId = id ?? (label ? `toggle-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <label
      htmlFor={toggleId}
      className={[
        'inline-flex items-center gap-3 select-none',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'
      ].join(' ')}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={toggleId}
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={[
            'w-10 h-6 rounded-full transition-all duration-150 ease-out',
            'elevation-inset ring-offset-surface focus-within:ring-2 focus-within:ring-primary/45',
            checked ? 'bg-primary' : 'bg-input',
          ].join(' ')}
        >
          <div
            className={[
              'absolute top-1 left-1 w-4 h-4 rounded-full bg-field',
              'elevation-raised',
              'transition-transform duration-150 ease-out',
              checked ? 'translate-x-4' : 'translate-x-0',
            ].join(' ')}
          />
        </div>
      </div>
      {label && <span className="font-ui text-sm text-text font-medium">{label}</span>}
    </label>
  );
}
