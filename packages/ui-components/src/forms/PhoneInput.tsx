import * as React from 'react';
import { Input, type InputProps } from './Input';

export interface PhoneInputProps extends Omit<InputProps, 'type' | 'prefix'> {
  countryCode?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const formatNational = (raw: string) => {
      if (!raw || typeof raw !== 'string') return '';
      const cleaned = raw.replace(/\D/g, '');
      if (cleaned.startsWith('255') && cleaned.length === 12) {
        return cleaned.slice(3);
      }
      if (cleaned.startsWith('0') && cleaned.length === 10) {
        return cleaned.slice(1);
      }
      if (cleaned.startsWith('233') || cleaned.startsWith('133')) {
        return cleaned.slice(3);
      }
      if (cleaned.length === 9) {
        return cleaned;
      }
      return cleaned.slice(0, 9);
    };

    const nationalValue = typeof value === 'string' ? formatNational(value) : '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const national = formatNational(val);
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: `255${national}`,
          },
        };
        onChange(syntheticEvent as any);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
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
