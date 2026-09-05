import * as React from 'react';

export interface SidebarProps {
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export const Sidebar = ({ children, compact, className = '' }: SidebarProps) => {
  return (
    <aside
      className={`flex flex-col h-full bg-surface-strong border-r border-border transition-all duration-300 ${
        compact ? 'w-16' : 'w-64'
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
    <div className={`py-4 ${className}`}>
      {title && !compact && (
        <h3 className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted truncate">
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
  active,
  disabled,
  compact,
  onClick,
  className = '',
}: SidebarItemProps) => {
  const baseClasses =
    'flex items-center gap-3 px-3 py-2 rounded-input text-xs font-medium transition-all cursor-pointer select-none relative group';
  const activeClasses = 'bg-primary text-surface elevation-raised';
  const inactiveClasses = 'text-text-muted hover:text-text hover:bg-panel';
  const disabledClasses = 'opacity-50 cursor-not-allowed grayscale';

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={!disabled ? onClick : undefined}
      title={compact ? label : undefined}
      className={`
        ${baseClasses}
        ${active ? activeClasses : inactiveClasses}
        ${disabled ? disabledClasses : ''}
        ${compact ? 'justify-center px-0 w-12 mx-auto' : ''}
        ${className}
      `}
    >
      {icon && <span className="w-5 h-5 flex items-center justify-center shrink-0">{icon}</span>}
      {!compact && <span className="flex-1 truncate">{label}</span>}
      {!compact && badge !== undefined && (
        <span
          className={`
          inline-flex items-center justify-center px-1.5 py-0 rounded-full font-bold uppercase tracking-wider text-[9px]
          ${active ? 'bg-surface text-primary' : 'bg-primary/20 text-primary border border-primary/30'}
        `}
        >
          {badge}
        </span>
      )}
      {compact && badge !== undefined && (
        <div className="absolute -top-1 -right-1">
          <span className="inline-flex items-center justify-center min-w-[12px] h-3 px-1 rounded-full bg-danger text-[8px] font-bold text-surface elevation-raised">
            {badge}
          </span>
        </div>
      )}
    </div>
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
