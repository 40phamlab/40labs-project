import * as React from 'react';
import { Input, type InputProps } from './Input';

export interface PhoneInputProps extends Omit<InputProps, 'type' | 'prefix'> {
  countryCode?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const displayValue = (raw: string) => {
      if (!raw || typeof raw !== 'string') return '';
      const digits = raw.replace(/\\D/g, '');
      // The +255 prefix is rendered separately. Keep only the national
      // subscriber number in the editable field for typing and paste alike.
      const national = digits.startsWith('255') ? digits.slice(3) : digits;
      const withoutTrunkZero = national.startsWith('0') ? national.slice(1) : national;
      return withoutTrunkZero.slice(0, 9);
    };

    const nationalValue = typeof value === 'string' ? displayValue(value) : '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.currentTarget.value.replace(/\\D/g, '');
      const national = digits.startsWith('255') ? digits.slice(3) : digits;
      const withoutTrunkZero = national.startsWith('0') ? national.slice(1) : national;
      // Preserve the native React change event contract used by existing
      // consumers, but ensure they receive the same normalized value we render.
      e.currentTarget.value = withoutTrunkZero.slice(0, 9);
      onChange?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={16}
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
