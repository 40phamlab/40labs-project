import * as React from 'react';
import { Input, type InputProps } from './Input';

export interface PhoneInputProps extends Omit<InputProps, 'type' | 'prefix'> {
  countryCode?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ countryCode = '+233', ...props }, ref) => {
    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
        monospace
        prefix={<span className="text-[10px] font-mono opacity-70">{countryCode}</span>}
      />
    );
  }
);
PhoneInput.displayName = 'PhoneInput';
