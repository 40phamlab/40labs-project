import * as React from 'react';
import { EyeClosed, Eye } from 'lucide-react';
import { Input, type InputProps } from './Input';
import { IconButton } from '../primitives/IconButton';

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'suffix'> {
  error?: boolean | string;
  success?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, success, className = '', ...props }, ref) => {
    const [show, setShow] = React.useState(false);

    return (
      <Input
        {...props}
        ref={ref}
        type={show ? 'text' : 'password'}
        error={error}
        success={success}
        className={className}
        suffix={
          <IconButton
            type="button"
            icon={show ? <EyeClosed size={14} /> : <Eye size={14} />}
            label={show ? 'Hide password' : 'Show password'}
            variant="ghost"
            size="xs"
            onClick={() => setShow(!show)}
            tabIndex={-1}
          />
        }
      />
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
