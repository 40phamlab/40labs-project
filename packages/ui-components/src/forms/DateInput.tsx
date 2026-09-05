import * as React from 'react';
import { Input, type InputProps } from './Input';

export interface DateInputProps extends Omit<InputProps, 'type'> {}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (props, ref) => {
    return (
      <Input
        {...props}
        ref={ref}
        type="date"
        className="block" // Date inputs sometimes have weird default alignment
      />
    );
  }
);
DateInput.displayName = 'DateInput';
