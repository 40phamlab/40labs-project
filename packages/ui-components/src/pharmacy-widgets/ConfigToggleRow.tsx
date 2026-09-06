import React from 'react';
import { Switch } from '../forms/Switch';

export interface ConfigToggleRowProps {
  label: string;
  type: 'switch' | 'text' | 'select';
  value: boolean | string;
  options?: string[];
  onChange?: (newValue: any) => void;
  className?: string;
}

/**
 * ConfigToggleRow
 * A specialized row for configuration settings.
 * Supports a Switch (success green), text value, or a compact Select on the right.
 */
export const ConfigToggleRow: React.FC<ConfigToggleRowProps> = ({
  label,
  type,
  value,
  options = [],
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`
        flex items-center justify-between py-1.5 w-full
        ${className}
      `}
    >
      <span className="text-sm text-text">{label}</span>

      {type === 'switch' ? (
        <Switch
          checked={!!value}
          onChange={onChange || (() => {})}
          intent="success"
        />
      ) : type === 'select' ? (
        <select
          value={String(value)}
          onChange={(e) => onChange?.(e.target.value)}
          className="bg-transparent text-xs text-text-muted italic border-none focus:ring-0 cursor-pointer p-0 appearance-none text-right hover:text-text transition-colors"
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-panel text-text">
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <span
          className={`
            text-xs tracking-tight
            ${
              typeof value === 'string' &&
              (value.toLowerCase() === 'mode' ||
                value.toLowerCase() === 'pending')
                ? 'text-text-muted italic'
                : 'text-text font-bold'
            }
          `}
        >
          {value}
        </span>
      )}
    </div>
  );
};
