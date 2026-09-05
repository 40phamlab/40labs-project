import * as React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function Switch({ checked, onChange, disabled, label, id }: SwitchProps) {
  const switchId = id ?? (label ? `switch-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <label
      htmlFor={switchId}
      className={[
        'inline-flex items-center gap-2 select-none',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      ].join(' ')}
    >
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          id={switchId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={[
            'w-8 h-4 rounded-full transition-colors duration-200 ease-in-out elevation-inset',
            checked ? 'bg-primary/60' : 'bg-panel-strong'
          ].join(' ')}
        />
        <div
          className={[
            'absolute left-0 w-4 h-4 rounded-full transition-transform duration-200 ease-in-out elevation-raised',
            checked ? 'translate-x-4 bg-primary' : 'translate-x-0 bg-field'
          ].join(' ')}
        />
      </div>
      {label && <span className="text-xs text-text font-medium">{label}</span>}
    </label>
  );
}
