import * as React from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  id?: string;
}

export function Toggle({ checked, onChange, label, disabled = false, id }: ToggleProps) {
  const generatedId = React.useId();
  const toggleId = id || generatedId;

  return (
    <label
      htmlFor={toggleId}
      className={[
        'inline-flex items-center gap-2.5 select-none group',
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          id={toggleId}
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={[
            'w-9 h-5 rounded-full border transition-all duration-150 ease-out',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-app-bg',
            checked
              ? 'bg-action-primary border-action-primary'
              : 'bg-surface-secondary border-border-strong group-hover:border-border-focus',
          ].join(' ')}
        >
          <div
            className={[
              'absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform duration-150 ease-out',
              checked ? 'translate-x-4 bg-text-inverse' : 'translate-x-0 bg-text-muted',
            ].join(' ')}
          />
        </div>
      </div>
      {label && <span className="font-ui text-xs font-medium text-text-primary">{label}</span>}
    </label>
  );
}
