// [PHASE: MVP]
// [SPEC: CONTEXT/04-CONVENTIONS.md]
import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';

export type ButtonIntent = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: ButtonIntent;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

const intentClasses: Record<ButtonIntent, string> = {
  primary: 'bg-primary text-white',
  secondary: 'bg-surface text-primary border border-primary/20',
  danger: 'bg-danger text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-base px-4 py-2.5',
  lg: 'text-lg px-6 py-3',
};

// Depth language per CONTEXT/02-DESIGN-TOKENS.md → Elevation:
// raised at rest, pressed on :active. Never scale/translate — shadow
// transitions only, per the "Clinical Claymorphism" rule.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { intent = 'primary', size = 'md', fullWidth = false, loading = false, disabled, className = '', children, ...rest },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'font-ui font-medium rounded-input',
          'elevation-raised active:elevation-pressed',
          'transition-shadow duration-150 ease-out',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:elevation-raised',
          intentClasses[intent],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {loading ? 'Loading…' : children}
      </button>
    );
  },
);

Button.displayName = 'Button';