import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
  success?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, success, disabled, readOnly, className = '', ...rest }, ref) => {
    const hasError = !!error;

    const stateClasses = hasError
      ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger'
      : success
      ? 'border-success focus:border-success focus:ring-1 focus:ring-success'
      : 'border-border-default hover:border-border-strong focus:border-border-focus focus:ring-1 focus:ring-focus-ring';

    return (
      <textarea
        ref={ref}
        disabled={disabled}
        readOnly={readOnly}
        className={[
          'w-full bg-surface-primary text-text-primary placeholder:text-text-muted/60',
          'border rounded-input font-ui transition-all duration-150 ease-out p-3 text-xs min-h-[80px] resize-y',
          'focus:outline-none',
          'disabled:bg-surface-disabled disabled:text-text-disabled disabled:border-border-subtle disabled:cursor-not-allowed disabled:opacity-50',
          'read-only:bg-surface-disabled read-only:text-text-secondary read-only:border-border-subtle',
          stateClasses,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
