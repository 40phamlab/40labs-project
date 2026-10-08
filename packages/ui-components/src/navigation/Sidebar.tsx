'use client';

import React, { Children, isValidElement, cloneElement, KeyboardEvent } from 'react';
import { useAppShell, NavigationState } from '../layout/AppShell';
import { Tooltip } from '../overlays/Tooltip';

export interface SidebarProps {
  children: React.ReactNode;
  navState?: NavigationState;
  variant?: 'default' | 'floating';
  className?: string;
}

export const Sidebar = ({ children, navState, variant = 'default', className = '' }: SidebarProps) => {
  const shell = useAppShell();
  const effectiveNavState: NavigationState = navState ?? shell.navState;

  const isClosed = effectiveNavState === 'closed';

  if (isClosed) {
    return null;
  }

  const isFloating = variant === 'floating';

  return (
    <nav
      aria-label="Sidebar navigation"
      className={`flex flex-col h-full w-full ${isFloating ? 'bg-app-bg border-r-0' : 'bg-sidebar border-r border-border'} transition-[width] duration-200 ease-in-out select-none ${className}`}
    >
      {Children.map(children, (child) => {
        if (isValidElement(child) && typeof child.type !== 'string') {
          return cloneElement(child as React.ReactElement<any>, {
            navState: effectiveNavState,
            variant,
          });
        }
        return child;
      })}
    </nav>
  );
};

export interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
  navState?: NavigationState;
  variant?: 'default' | 'floating';
  className?: string;
}

export const SidebarSection = ({ title, children, navState, variant = 'default', className = '' }: SidebarSectionProps) => {
  const shell = useAppShell();
  const effectiveNavState: NavigationState = navState ?? shell.navState;
  const isIcon = effectiveNavState === 'icon';

  return (
    <div className={`py-2 ${className}`}>
      {title && !isIcon && (
        <h3 className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted truncate select-none">
          {title}
        </h3>
      )}
      <div className="space-y-1 px-2">
        {Children.map(children, (child) => {
          if (isValidElement(child) && typeof child.type !== 'string') {
            return cloneElement(child as React.ReactElement<any>, {
              navState: effectiveNavState,
              variant,
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};

export interface SidebarItemProps {
  icon?: React.ReactNode;
  label: string;
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
  navState?: NavigationState;
  variant?: 'default' | 'floating';
  onClick?: () => void;
  className?: string;
}

export const SidebarItem = ({
  icon,
  label,
  badge,
  active = false,
  disabled = false,
  navState,
  variant = 'default',
  onClick,
  className = '',
}: SidebarItemProps) => {
  const shell = useAppShell();
  const effectiveNavState: NavigationState = navState ?? shell.navState;
  const isIcon = effectiveNavState === 'icon';
  const isFloating = variant === 'floating';

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const hasBadge = badge !== undefined && badge !== null && badge !== '' && (typeof badge === 'number' ? badge > 0 : true);
  const ariaLabelText = hasBadge ? `${label}, ${badge} unread` : label;

  const buttonElement = (
    <button
      type="button"
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={handleKeyDown}
      title={label}
      aria-label={ariaLabelText}
      aria-current={active ? 'page' : undefined}
      className={`
        w-full h-9 flex items-center gap-2.5 px-2.5 rounded-md text-xs font-medium
        transition-colors duration-150 outline-none relative group select-none
        focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 ${isFloating ? 'focus-visible:ring-offset-app-bg' : 'focus-visible:ring-offset-sidebar'}
        ${
          active
            ? isIcon
              ? 'bg-surface-selected text-text-primary font-bold shadow-inner-soft'
              : 'bg-surface-selected text-text-primary font-semibold'
            : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${isIcon ? 'justify-center px-0 w-10 mx-auto' : ''}
        ${className}
      `}
    >
      {icon && (
        <span
          className={`w-5 h-5 flex items-center justify-center shrink-0 ${
            active ? 'text-action-primary' : 'text-current'
          }`}
        >
          {icon}
        </span>
      )}
      {!isIcon && (
        <span className="flex-1 text-left truncate">{label}</span>
      )}
      {!isIcon && badge !== undefined && (
        <span
          className={`
            inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none
            bg-[#F97316] text-white
          `}
        >
          {badge}
        </span>
      )}
      {isIcon && badge !== undefined && (
        <span
          className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#F97316] ring-2 ${isFloating ? 'ring-app-bg' : 'ring-sidebar'}`}
          title={`${label}: ${badge}`}
          aria-label={`${badge} unread`}
        />
      )}
    </button>
  );

  if (isIcon) {
    return (
      <Tooltip content={label} position="right" delay={300}>
        {buttonElement}
      </Tooltip>
    );
  }

  return buttonElement;
};

export interface SidebarGroupProps {
  children: React.ReactNode;
  navState?: NavigationState;
  variant?: 'default' | 'floating';
  className?: string;
}

export const SidebarGroup = ({ children, navState, variant = 'default', className = '' }: SidebarGroupProps) => {
  const shell = useAppShell();
  const effectiveNavState: NavigationState = navState ?? shell.navState;

  return (
    <div className={`space-y-1 ${className}`}>
      {Children.map(children, (child) => {
        if (isValidElement(child) && typeof child.type !== 'string') {
          return cloneElement(child as React.ReactElement<any>, {
            navState: effectiveNavState,
            variant,
          });
        }
        return child;
      })}
    </div>
  );
};
