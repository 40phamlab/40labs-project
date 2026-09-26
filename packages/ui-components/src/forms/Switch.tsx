import * as React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  id?: string;
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  id,
}: SwitchProps) {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  return (
    <label
      htmlFor={switchId}
      className={[
        'inline-flex items-center gap-2 select-none group',
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          id={switchId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <div
          className={[
            'w-8 h-4 rounded-full border transition-all duration-150 ease-out',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-app-bg',
            checked
              ? 'bg-action-primary border-action-primary'
              : 'bg-surface-secondary border-border-strong group-hover:border-border-focus',
          ].join(' ')}
        />
        <div
          className={[
            'absolute left-0.5 w-3 h-3 rounded-full transition-transform duration-150 ease-out',
            checked ? 'translate-x-4 bg-text-inverse' : 'translate-x-0 bg-text-muted',
          ].join(' ')}
        />
      </div>
      {label && <span className="font-ui text-xs font-medium text-text-primary">{label}</span>}
    </label>
  );
}
