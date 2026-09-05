import * as React from 'react';
import { Input, type InputProps } from './Input';

export interface CurrencyInputProps extends Omit<InputProps, 'type' | 'prefix'> {
  currencySymbol?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ currencySymbol = 'GH₵', ...props }, ref) => {
    return (
      <Input
        {...props}
        ref={ref}
        type="number"
        step="0.01"
        monospace
        prefix={<span className="text-[10px] font-mono font-bold opacity-70">{currencySymbol}</span>}
      />
    );
  }
);
CurrencyInput.displayName = 'CurrencyInput';
