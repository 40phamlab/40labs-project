import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
  success?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => {
    const { error, success, className = '', ...rest } = props;
    const hasError = !!error;

    return (
      <textarea
        ref={ref}
        className={[
          'w-full rounded-input bg-input text-text placeholder:text-text-muted/60 transition-all duration-150 ease-out font-ui',
          'elevation-inset focus:outline-none focus:ring-2 px-3 py-2 text-sm min-h-[80px] resize-y',
          hasError ? 'ring-2 ring-danger/50 focus:ring-danger/60' :
          success ? 'ring-2 ring-primary/50 focus:ring-primary/60' :
          'focus:ring-primary/45',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'read-only:bg-panel-strong/30 read-only:elevation-flat',
          className,
        ].filter(Boolean).join(' ')}
        {...rest}
      />
    );
  },
);
Textarea.displayName = 'Textarea';
