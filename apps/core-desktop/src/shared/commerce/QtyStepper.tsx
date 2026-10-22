import * as React from 'react';
import { Plus, Minus } from 'lucide-react';

export interface QtyStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (qty: number) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export const QtyStepper: React.FC<QtyStepperProps> = ({
  value,
  min = 1,
  max,
  onChange,
  size = 'sm',
  disabled = false,
  className = '',
}) => {
  const isMin = value <= min;
  const isMax = max !== undefined && value >= max;

  return (
    <div className={`flex items-center gap-1 bg-panel-strong p-1 rounded-input border border-border/30 ${className}`}>
      <button
        type="button"
        disabled={disabled || isMin}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`w-6 h-6 flex items-center justify-center rounded bg-panel text-text hover:bg-panel-strong transition-colors ${
          disabled || isMin ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        }`}
        aria-label="Decrease quantity"
      >
        <Minus size={12} />
      </button>
      <span className="font-mono text-xs font-bold px-2 text-text text-center min-w-[24px]">
        {value}
      </span>
      <button
        type="button"
        disabled={disabled || isMax}
        onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
        className={`w-6 h-6 flex items-center justify-center rounded bg-panel text-text hover:bg-panel-strong transition-colors ${
          disabled || isMax ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        }`}
        aria-label="Increase quantity"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};
