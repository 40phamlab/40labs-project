import * as React from 'react';

export interface TopBarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * TopBar
 *
 * Solid top navigation chrome bar with standard height and crisp border.
 */
export const TopBar = ({ children, className = '' }: TopBarProps) => {
  return (
    <header
      className={`h-10 flex items-center px-3 bg-top-chrome border-b border-border select-none shrink-0 ${className}`}
    >
      {children}
    </header>
  );
};
