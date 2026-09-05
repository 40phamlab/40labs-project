import * as React from 'react';

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
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && onClose) {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          onClose();
        }
      };
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onClose();
      };
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {trigger}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          <Menu>{children}</Menu>
        </div>
      )}
    </div>
  );
};

export const DropdownMenu = Dropdown;
export const DropdownMenuItem = MenuItem;
