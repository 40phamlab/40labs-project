'use client';

import React, { Children, isValidElement, cloneElement, KeyboardEvent } from 'react';
import { useAppShell, NavigationState } from '../layout/AppShell';

export interface SidebarProps {
  children: React.ReactNode;
  compact?: boolean;
  navState?: NavigationState;
  className?: string;
}

export const Sidebar = ({ children, navState, className = '' }: SidebarProps & { compact?: boolean }) => {
  const shell = useAppShell();
  const effectiveNavState: NavigationState = navState ?? shell.navState;

  const isCompact = effectiveNavState === 'compact';
  const isHidden = effectiveNavState === 'hidden';

  if (isHidden) {
    return null;
  }

  return (
    <nav
      aria-label="Sidebar navigation"
      className={`flex flex-col h-full w-full bg-sidebar border-r border-border transition-[width] duration-200 ease-in-out select-none ${
        isCompact ? 'w-16' : 'w-60'
      } ${className}`}
    >
      {Children.map(children, (child) => {
        if (isValidElement(child) && typeof child.type !== 'string') {
          return cloneElement(child as React.ReactElement<any>, {
            navState: effectiveNavState,
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
  className?: string;
}

export const SidebarSection = ({ title, children, navState, className = '' }: SidebarSectionProps & { compact?: boolean }) => {
  const shell = useAppShell();
  const effectiveNavState: NavigationState = navState ?? shell.navState;
  const isCompact = effectiveNavState === 'compact';

  return (
    <div className={`py-2 ${className}`}>
      {title && !isCompact && (
        <h3 className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted truncate select-none">
          {title}
        </h3>
      )}
      <div className="space-y-1 px-2">
        {Children.map(children, (child) => {
          if (isValidElement(child) && typeof child.type !== 'string') {
            return cloneElement(child as React.ReactElement<any>, {
              navState: effectiveNavState,
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
  onClick,
  className = '',
}: SidebarItemProps & { compact?: boolean }) => {
  const shell = useAppShell();
  const effectiveNavState: NavigationState = navState ?? shell.navState;
  const isCompact = effectiveNavState === 'compact';

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
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
      title={label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`
        w-full h-9 flex items-center gap-2.5 px-2.5 rounded-md text-xs font-medium
        transition-colors duration-150 outline-none relative group select-none
        focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar
        ${
          active
            ? isCompact
              ? 'bg-surface-selected text-text-primary font-bold shadow-inner-soft border-l-2 border-action-primary'
              : 'bg-surface-selected text-text-primary font-semibold border-l-2 border-action-primary pl-2'
            : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${isCompact ? 'justify-center px-0 w-10 mx-auto' : ''}
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
      {!isCompact && (
        <span className="flex-1 text-left truncate">{label}</span>
      )}
      {!isCompact && badge !== undefined && (
        <span
          className={`
            inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none
            ${
              active
                ? 'bg-action-primary text-text-inverse'
                : 'bg-surface-elevated text-text-secondary border border-border-subtle'
            }
          `}
        >
          {badge}
        </span>
      )}
      {isCompact && badge !== undefined && (
        <span
          className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger ring-2 ring-sidebar"
          title={`${label}: ${badge}`}
        />
      )}
    </button>
  );
};

export interface SidebarGroupProps {
  children: React.ReactNode;
  navState?: NavigationState;
  className?: string;
}

export const SidebarGroup = ({ children, navState, className = '' }: SidebarGroupProps & { compact?: boolean }) => {
  const shell = useAppShell();
  const effectiveNavState: NavigationState = navState ?? shell.navState;

  return (
    <div className={`space-y-1 ${className}`}>
      {Children.map(children, (child) => {
        if (isValidElement(child) && typeof child.type !== 'string') {
          return cloneElement(child as React.ReactElement<any>, {
            navState: effectiveNavState,
          });
        }
        return child;
      })}
    </div>
  );
};
