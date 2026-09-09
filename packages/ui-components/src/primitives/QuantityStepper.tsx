import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { IconButton } from './IconButton';
import { NumberInput } from '../forms/NumberInput';

export interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  allowDecimal?: boolean;
  onChange: (value: number) => void;
  unit?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  min,
  max,
  step = 1,
  disabled = false,
  allowDecimal = false,
  onChange,
  unit,
  error,
  size = 'md',
  className = '',
}) => {
  const handleDecrement = () => {
    const newValue = value - step;
    if (min !== undefined && newValue < min) return;
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = value + step;
    if (max !== undefined && newValue > max) return;
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseFloat(e.target.value);
    if (isNaN(newValue)) return;
    if (!allowDecimal) newValue = Math.floor(newValue);

    if (min !== undefined && newValue < min) newValue = min;
    if (max !== undefined && newValue > max) newValue = max;

    onChange(newValue);
  };

  const isDecrementDisabled = disabled || (min !== undefined && value <= min);
  const isIncrementDisabled = disabled || (max !== undefined && value >= max);

  const containerSizes = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  };

  const inputSizes = {
    sm: '!h-8 !w-14 !text-xs',
    md: '!h-10 !w-20 !text-sm',
    lg: '!h-12 !w-24 !text-base',
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div
        className={[
          'flex items-center bg-panel-strong/20 rounded-input border transition-all duration-200',
          error ? 'border-danger ring-1 ring-danger/20' : 'border-border/20',
          'elevation-inset shadow-inner',
          containerSizes[size],
          'p-1'
        ].join(' ')}
      >
        <IconButton
          icon={<Minus size={size === 'sm' ? 14 : 18} />}
          label="Decrement"
          intent="ghost"
          size={size}
          onClick={handleDecrement}
          disabled={isDecrementDisabled}
          className="!rounded-input"
        />

        <div className="relative flex items-center">
          <NumberInput
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className={[
              inputSizes[size],
              '!text-center !px-1 !bg-transparent !elevation-flat !shadow-none !border-none !ring-0',
              error ? 'text-danger' : 'text-text'
            ].join(' ')}
          />
          {unit && (
            <span className="ml-1 text-[10px] font-bold text-text-muted uppercase tracking-widest pointer-events-none">
              {unit}
            </span>
          )}
        </div>

        <IconButton
          icon={<Plus size={size === 'sm' ? 14 : 18} />}
          label="Increment"
          intent="ghost"
          size={size}
          onClick={handleIncrement}
          disabled={isIncrementDisabled}
          className="!rounded-input"
        />
      </div>

      {error && (
        <span className="text-[10px] text-danger font-medium px-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};
