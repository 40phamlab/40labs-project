"use client";

import * as React from 'react';
import { createPortal } from 'react-dom';

export interface MenuItemProps {
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

export const MenuItem = ({
  label,
  icon,
  badge,
  onClick,
  disabled,
  variant = 'default',
}: MenuItemProps) => {
  const variantClasses =
    variant === 'danger'
      ? 'text-danger hover:bg-danger/10'
      : 'text-text hover:bg-panel hover:text-primary';

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors ${variantClasses} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {icon && <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>}
      <span className="flex-1 text-left truncate">{label}</span>
      {badge !== undefined && (
        <span className="ml-auto shrink-0 px-1.5 py-0 rounded-full bg-panel-strong text-text-muted font-bold uppercase tracking-wider text-[9px]">
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

export const Menu = ({ children, className = '' }: MenuProps) => {
  return (
    <div
      className={`min-w-[160px] py-1 bg-surface-strong border border-border rounded-input elevation-raised overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export const Dropdown = ({ trigger, children, isOpen, onClose, className = '' }: DropdownProps) => {
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  const updatePosition = React.useCallback(() => {
    if (triggerRef.current) {
      const MENU_WIDTH_ESTIMATE = 176; // min-w-[160px] + comfortable margin
      const EDGE_PADDING = 8;
      const rect = triggerRef.current.getBoundingClientRect();
      const wouldOverflowRight =
        rect.left + MENU_WIDTH_ESTIMATE > window.innerWidth - EDGE_PADDING;

      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: wouldOverflowRight
          ? rect.right + window.scrollX - MENU_WIDTH_ESTIMATE // anchor from the right edge, open leftward
          : rect.left + window.scrollX, // default: open rightward
      });
    }
  }, []);

  React.useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  React.useEffect(() => {
    if (isOpen) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(target);
        const isOutsideMenu = menuRef.current && !menuRef.current.contains(target);

        if (isOutsideTrigger && isOutsideMenu) {
          onClose?.();
        }
      };

      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose?.();
        }
      };

      if (onClose) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
      }

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
        if (onClose) {
          document.removeEventListener('mousedown', handleClickOutside);
          document.removeEventListener('keydown', handleEsc);
        }
      };
    }
  }, [isOpen, onClose, updatePosition]);

  return (
    <div ref={triggerRef} className={`relative inline-block ${className}`}>
      {trigger}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: coords.top,
              left: coords.left,
              zIndex: 9999,
            }}
            className="animate-in fade-in slide-in-from-top-1 duration-200"
          >
            <Menu>{children}</Menu>
          </div>,
          document.body
        )}
    </div>
  );
};

export const DropdownMenu = Dropdown;
export const DropdownMenuItem = MenuItem;
