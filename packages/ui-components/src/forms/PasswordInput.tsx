import * as React from 'react';

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, success, className = '', ...props }, ref) => {
    const [show, setShow] = React.useState(false);

    const stateClasses = error
      ? 'border-danger focus:ring-danger/20'
      : success
      ? 'border-primary focus:ring-primary/20'
      : 'border-border focus:ring-primary/45';

    return (
      <div className={`relative flex items-center w-full ${className}`}>
        <input
          {...props}
          ref={ref}
          type={show ? 'text' : 'password'}
          className={`
            w-full bg-field/10 border rounded-input px-3 py-2 pr-10 text-sm text-text font-ui
            placeholder:text-text-muted/50 transition-all focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed elevation-inset
            ${stateClasses}
          `}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-panel transition-colors text-text-muted"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';
