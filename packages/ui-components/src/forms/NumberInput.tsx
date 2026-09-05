import * as React from 'react';
import { Input, type InputProps } from './Input';

export interface NumberInputProps extends Omit<InputProps, 'type'> {
  min?: number;
  max?: number;
  step?: number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (props, ref) => {
    return (
      <Input
        {...props}
        ref={ref}
        type="number"
        monospace
      />
    );
  }
);
NumberInput.displayName = 'NumberInput';
