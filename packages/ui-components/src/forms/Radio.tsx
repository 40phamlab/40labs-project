import * as React from 'react';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const radioId = id ?? (props.name && props.value ? `radio-${props.name}-${props.value}` : undefined);
    return (
      <label className={['inline-flex items-center gap-2 cursor-pointer select-none group', props.disabled ? 'opacity-50 cursor-not-allowed' : ''].join(' ')}>
        <div className="relative flex items-center justify-center">
          <input
            type="radio"
            ref={ref}
            id={radioId}
            className={[
              'peer appearance-none w-5 h-5 rounded-full bg-input elevation-inset',
              'checked:bg-primary checked:elevation-raised transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary/45',
              className
            ].join(' ')}
            {...props}
          />
          <div className="absolute w-2 h-2 rounded-full bg-surface hidden peer-checked:block" />
        </div>
        {label && <span className="text-sm text-text font-medium">{label}</span>}
      </label>
    );
  }
);
Radio.displayName = 'Radio';
