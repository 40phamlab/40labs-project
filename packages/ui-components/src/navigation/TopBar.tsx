import * as React from 'react';

export interface TopBarProps {
  children: React.ReactNode;
  className?: string;
}

export const TopBar = ({ children, className = '' }: TopBarProps) => {
  return (
    <header
      className={`h-16 flex items-center px-6 bg-surface border-b border-border elevation-flat ${className}`}
    >
      {children}
    </header>
  );
};
