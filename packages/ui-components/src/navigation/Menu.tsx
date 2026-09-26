"use client";

import * as React from 'react';
import { Dropdown as OverlayDropdown, DropdownProps as OverlayDropdownProps } from '../overlays/Dropdown';

export interface MenuItemProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  className?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  label,
  icon,
  badge,
  onClick,
  disabled = false,
  variant = 'default',
  className = '',
}) => {
  const variantClasses =
    variant === 'danger'
      ? 'text-danger hover:bg-danger-bg focus-visible:bg-danger-bg'
      : 'text-text-primary hover:bg-surface-hover hover:text-text-primary focus-visible:bg-surface-hover';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={handleKeyDown}
      className={`
        w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium outline-none transition-colors
        ${variantClasses}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {icon && <span className="w-4 h-4 flex items-center justify-center shrink-0 text-current">{icon}</span>}
      <span className="flex-1 text-left truncate">{label}</span>
      {badge !== undefined && (
        <span className="ml-auto shrink-0 px-1.5 py-0.5 rounded-full bg-surface-primary text-text-secondary font-bold text-[9px]">
          {badge}
        </span>
      )}
    </button>
  );
};

export interface MenuProps {
  children: React.ReactNode;
  className?: string;
}

export const Menu: React.FC<MenuProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`min-w-[180px] py-1 bg-surface-elevated border border-border rounded-md shadow-md overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

export interface DropdownProps extends OverlayDropdownProps {}

export const Dropdown: React.FC<DropdownProps> = ({ children, ...props }) => {
  return (
    <OverlayDropdown {...props}>
      {typeof children === 'function' ? children : <Menu>{children}</Menu>}
    </OverlayDropdown>
  );
};

export const DropdownMenu = Dropdown;
export const DropdownMenuItem = MenuItem;
