import * as React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  intent?: 'primary' | 'success';
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
  id,
  intent = 'primary',
}: SwitchProps) {
  const switchId =
    id ?? (label ? `switch-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  const activeColor = intent === 'success' ? 'bg-green-500' : 'bg-primary';
  const activeTrack = intent === 'success' ? 'bg-green-500/60' : 'bg-primary/60';

  return (
    <label
      htmlFor={switchId}
      className={[
        'inline-flex items-center gap-2 select-none',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
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
            checked ? activeTrack : 'bg-panel-strong',
          ].join(' ')}
        />
        <div
          className={[
            'absolute left-0 w-4 h-4 rounded-full transition-transform duration-200 ease-in-out elevation-raised',
            checked ? `translate-x-4 ${activeColor}` : 'translate-x-0 bg-field',
          ].join(' ')}
        />
      </div>
      {label && <span className="text-xs text-text font-medium">{label}</span>}
    </label>
  );
}
