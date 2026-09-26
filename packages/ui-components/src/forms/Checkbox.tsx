import * as React from 'react';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: CheckboxSize;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: boolean | string;
  indeterminate?: boolean;
}

const boxSizeClasses: Record<CheckboxSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const iconSizes: Record<CheckboxSize, string> = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
};

const labelTextSizes: Record<CheckboxSize, string> = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      size = 'md',
      label,
      description,
      error,
      indeterminate = false,
      disabled,
      className = '',
      id,
      checked,
      onChange,
      ...rest
    },
    ref,
  ) => {
    const internalRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => internalRef.current!);

    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = Boolean(indeterminate);
      }
    }, [indeterminate]);

    const generatedId = React.useId();
    const checkboxId = id || generatedId;
    const hasError = !!error;

    const boxSize = boxSizeClasses[size] || boxSizeClasses.md;
    const iconSize = iconSizes[size] || iconSizes.md;
    const labelTextSize = labelTextSizes[size] || labelTextSizes.md;

    return (
      <label
        htmlFor={checkboxId}
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
            {...rest}
            ref={internalRef}
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            checked={checked}
            onChange={onChange}
            className={[
              'peer appearance-none rounded border font-ui transition-all duration-150 ease-out',
              'bg-surface-primary border-border-strong',
              'hover:border-border-focus',
              'checked:bg-action-primary checked:border-action-primary',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app-bg',
              'disabled:bg-surface-disabled disabled:border-border-subtle disabled:cursor-not-allowed',
              hasError ? 'border-danger focus-visible:ring-danger' : '',
              boxSize,
            ]
              .filter(Boolean)
              .join(' ')}
          />
          {indeterminate ? (
            <svg
              className={`absolute pointer-events-none hidden peer-checked:block text-text-inverse ${iconSize}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          ) : (
            <svg
              className={`absolute pointer-events-none hidden peer-checked:block text-text-inverse ${iconSize}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className={`font-ui font-medium text-text-primary leading-tight ${labelTextSize}`}>
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

Checkbox.displayName = 'Checkbox';
