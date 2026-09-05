import * as React from 'react';

export interface ListItemProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ListItem = ({ children, icon, action, onClick, className = '' }: ListItemProps) => {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 transition-colors
        ${onClick ? 'cursor-pointer hover:bg-panel' : ''}
        ${className}
      `}
    >
      {icon && <div className="shrink-0 w-8 h-8 rounded-input bg-panel-strong flex items-center justify-center text-text-muted">{icon}</div>}
      <div className="flex-1 min-w-0 text-xs text-text">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export interface ListProps {
  children: React.ReactNode;
  className?: string;
  divided?: boolean;
}

export const List = ({ children, className = '', divided = true }: ListProps) => {
  return (
    <div className={`bg-surface-strong rounded-card border border-border overflow-hidden ${className}`}>
      <div className={divided ? 'divide-y divide-border' : ''}>
        {children}
      </div>
    </div>
  );
};
