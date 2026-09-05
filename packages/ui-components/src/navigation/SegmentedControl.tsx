import * as React from 'react';

export interface SegmentedControlOption {
  label: string;
  value: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SegmentedControl = ({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps) => {
  return (
    <div className={`flex p-1 bg-panel-strong rounded-input elevation-inset ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-input transition-all ${
            value === option.value
              ? 'bg-panel text-text elevation-raised'
              : 'text-text-muted hover:text-text'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
