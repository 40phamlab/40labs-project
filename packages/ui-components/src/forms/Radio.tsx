import * as React from 'react';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className = '', id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const radioId = id || generatedId;

    return (
      <label
        htmlFor={radioId}
        className={[
          'inline-flex items-start gap-2 cursor-pointer select-none group',
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="relative flex items-center justify-center shrink-0 mt-0.5">
          <input
            type="radio"
            ref={ref}
            id={radioId}
            disabled={disabled}
            className={[
              'peer appearance-none w-4 h-4 rounded-full border font-ui transition-all duration-150 ease-out',
              'bg-surface-primary border-border-strong',
              'hover:border-border-focus',
              'checked:bg-action-primary checked:border-action-primary',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app-bg',
              'disabled:bg-surface-disabled disabled:border-border-subtle disabled:cursor-not-allowed',
            ].join(' ')}
            {...props}
          />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-text-inverse hidden peer-checked:block pointer-events-none" />
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="font-ui text-xs font-medium text-text-primary leading-tight">
                {label}
              </span>
            )}
            {description && (
              <span className="font-ui text-[10px] text-text-muted mt-0.5 leading-normal">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  },
);

Radio.displayName = 'Radio';
