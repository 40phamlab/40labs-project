import * as React from 'react';
import { createPortal } from 'react-dom';

export interface MenuItemProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  className?: string;
}

export const MenuItem = ({
  label,
  icon,
  badge,
  onClick,
  disabled = false,
  variant = 'default',
  className = '',
}: MenuItemProps) => {
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

export const Menu = ({ children, className = '' }: MenuProps) => {
  return (
    <div
      className={`min-w-[180px] py-1 bg-surface-elevated border border-border rounded-md shadow-md overflow-hidden ${className}`}
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
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 200;
      const menuHeight = 240;
      const padding = 8;

      let top = rect.bottom + 4;
      let left = rect.left;

      if (left + menuWidth > window.innerWidth - padding) {
        left = Math.max(padding, window.innerWidth - menuWidth - padding);
      }

      if (top + menuHeight > window.innerHeight - padding) {
        top = Math.max(padding, rect.top - menuHeight - 4);
      }

      setCoords({ top, left });
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

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEsc);
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
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 9999,
            }}
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
