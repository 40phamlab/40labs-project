import * as React from 'react';

export interface SidebarProps {
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export const Sidebar = ({ children, compact, className = '' }: SidebarProps) => {
  return (
    <aside
      className={`flex flex-col h-full bg-sidebar border-r border-border transition-[width] duration-200 ease-in-out select-none ${
        compact ? 'w-16' : 'w-60'
      } ${className}`}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { compact });
        }
        return child;
      })}
    </aside>
  );
};

export interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export const SidebarSection = ({ title, children, compact, className = '' }: SidebarSectionProps) => {
  return (
    <div className={`py-2 ${className}`}>
      {title && !compact && (
        <h3 className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted truncate select-none">
          {title}
        </h3>
      )}
      <div className="space-y-1 px-2">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, { compact });
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
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}

export const SidebarItem = ({
  icon,
  label,
  badge,
  active = false,
  disabled = false,
  compact = false,
  onClick,
  className = '',
}: SidebarItemProps) => {
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
      title={compact ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`
        w-full h-9 flex items-center gap-2.5 px-2.5 rounded-md text-xs font-medium
        transition-colors duration-150 outline-none relative group select-none
        focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar
        ${
          active
            ? 'bg-surface-selected text-text-primary font-semibold border-l-2 border-action-primary pl-2'
            : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${compact ? 'justify-center px-0 w-10 mx-auto border-l-0' : ''}
        ${className}
      `}
    >
      {icon && (
        <span className="w-5 h-5 flex items-center justify-center shrink-0 text-current">
          {icon}
        </span>
      )}
      {!compact && (
        <span className="flex-1 text-left truncate">{label}</span>
      )}
      {!compact && badge !== undefined && (
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
      {compact && badge !== undefined && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
      )}
    </button>
  );
};

export interface SidebarGroupProps {
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export const SidebarGroup = ({ children, compact, className = '' }: SidebarGroupProps) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { compact });
        }
        return child;
      })}
    </div>
  );
};
