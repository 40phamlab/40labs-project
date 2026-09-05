import * as React from 'react';

export type AlertIntent = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  intent?: AlertIntent;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const intentClasses: Record<AlertIntent, string> = {
  info: 'bg-field/10 border-field/30 text-text',
  success: 'bg-primary/10 border-primary/30 text-text',
  warning: 'bg-accent/10 border-accent/30 text-text',
  danger: 'bg-danger/10 border-danger/30 text-text',
};

const iconColors: Record<AlertIntent, string> = {
  info: 'text-field',
  success: 'text-primary',
  warning: 'text-accent',
  danger: 'text-danger',
};

export const Alert = ({
  intent = 'info',
  title,
  children,
  icon,
  onClose,
  className = '',
}: AlertProps) => {
  return (
    <div
      role="alert"
      className={`relative p-4 rounded-card border flex gap-3 ${intentClasses[intent]} ${className}`}
    >
      {icon && <div className={`shrink-0 w-5 h-5 flex items-center justify-center ${iconColors[intent]}`}>{icon}</div>}
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-xs font-bold uppercase tracking-wider mb-1">{title}</h4>}
        <div className="text-xs opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface/20 transition-colors"
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  );
};

export const InlineAlert = ({ intent = 'info', children, className = '' }: Omit<AlertProps, 'title' | 'onClose'>) => {
  return (
    <div className={`flex items-center gap-2 text-[10px] font-medium ${iconColors[intent]} ${className}`}>
      <span className="w-1 h-1 rounded-full bg-current" />
      {children}
    </div>
  );
};
