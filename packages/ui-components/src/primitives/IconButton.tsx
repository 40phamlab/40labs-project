import * as React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  intent?: 'primary' | 'secondary' | 'neutral' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, className = '', size = 'md', intent = 'primary', loading, ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
    };

    const intentClasses = {
      primary: 'bg-primary text-surface elevation-raised hover:elevation-hover active:elevation-pressed',
      secondary: 'bg-surface-strong text-primary border border-primary/20 elevation-raised hover:elevation-hover active:elevation-pressed',
      neutral: 'bg-panel-strong text-text elevation-raised hover:elevation-hover active:elevation-pressed',
      danger: 'bg-danger text-surface elevation-raised hover:elevation-hover active:elevation-pressed',
      ghost: 'bg-transparent text-text hover:bg-panel-strong/30 active:bg-panel-strong/50',
    };

    return (
      <button
        ref={ref}
        className={`
          relative inline-flex items-center justify-center font-ui font-medium rounded-full
          transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-primary/45
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${intentClasses[intent]}
          ${className}
        `}
        aria-label={label}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="flex items-center justify-center w-full h-full">{icon}</span>
        )}
      </button>
    );
  },
);
IconButton.displayName = 'IconButton';
