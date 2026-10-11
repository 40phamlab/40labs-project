import * as React from 'react';
import { Input, type InputProps } from './Input';

export interface PhoneInputProps extends Omit<InputProps, 'type' | 'prefix'> {
  countryCode?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const displayValue = (raw: string) => {
      if (!raw || typeof raw !== 'string') return '';
      const digits = raw.replace(/\D/g, '');
      // The fixed +255 prefix is already displayed; show a national number
      // without its trunk zero, or strip a pasted country code when present.
      if (digits.startsWith('255') && digits.length > 9) return digits.slice(3, 12);
      if (digits.startsWith('0') && digits.length > 9) return digits.slice(1, 10);
      return digits.slice(0, 9);
    };

    const nationalValue = typeof value === 'string' ? displayValue(value) : '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Do not synthesize a React event or prepend a country code per keypress:
      // both interfere with controlled input updates and cursor behavior.
      onChange?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={12}
        pattern="[0-9]*"
        monospace
        value={nationalValue}
        onChange={handleChange}
        prefix={
          <span className="flex items-center space-x-1 text-xs font-mono opacity-90 select-none pr-1">
            <span>🇹🇿</span>
            <span className="font-bold">+255</span>
          </span>
        }
      />
    );
  }
);
PhoneInput.displayName = 'PhoneInput';
