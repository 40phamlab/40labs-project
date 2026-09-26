import * as React from 'react';

export type TabVariant = 'line' | 'pills';
export type TabSize = 'sm' | 'md' | 'lg';

export interface TabProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'label'> {
  label: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: TabVariant;
  size?: TabSize;
}

const lineSizeClasses: Record<TabSize, string> = {
  sm: 'h-7 text-xs px-2.5 gap-1.5',
  md: 'h-8 text-xs font-medium px-3 gap-1.5',
  lg: 'h-10 text-sm font-medium px-4 gap-2',
};

const pillSizeClasses: Record<TabSize, string> = {
  sm: 'h-6 text-xs px-2.5 gap-1.5 rounded-input',
  md: 'h-7 text-xs font-medium px-3 gap-1.5 rounded-input',
  lg: 'h-8 text-sm font-medium px-3.5 gap-2 rounded-input',
};

export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  (
    {
      label,
      active = false,
      disabled = false,
      icon,
      badge,
      variant = 'line',
      size = 'md',
      onClick,
      className = '',
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isLine = variant === 'line';

    const baseClasses = [
      'relative inline-flex items-center justify-center font-ui select-none shrink-0 transition-all duration-150 ease-out',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app-bg',
      disabled ? 'opacity-50 cursor-not-allowed pointer-events-none text-text-disabled' : 'cursor-pointer',
    ];

    const stateClasses = isLine
      ? active
        ? 'text-action-primary font-semibold border-b-2 border-action-primary -mb-px'
        : 'text-text-muted hover:text-text-primary hover:border-b-2 hover:border-border-default border-b-2 border-transparent'
      : active
      ? 'bg-surface-elevated text-text-primary border border-border-default shadow-sm font-medium'
      : 'text-text-muted hover:text-text-primary hover:bg-surface-hover/50 border border-transparent';

    const sizeClass = isLine
      ? lineSizeClasses[size] || lineSizeClasses.md
      : pillSizeClasses[size] || pillSizeClasses.md;

    return (
      <button
        ref={ref}
        type={type}
        role="tab"
        aria-selected={active}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={!disabled ? onClick : undefined}
        className={[...baseClasses, stateClasses, sizeClass, className].filter(Boolean).join(' ')}
        {...rest}
      >
        {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
        <span>{label}</span>
        {badge && <span className="shrink-0 flex items-center justify-center">{badge}</span>}
      </button>
    );
  },
);

Tab.displayName = 'Tab';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: TabVariant;
  size?: TabSize;
  className?: string;
}

export const Tabs = ({
  children,
  variant = 'line',
  size = 'md',
  className = '',
  ...rest
}: TabsProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

    const container = containerRef.current;
    if (!container) return;

    const tabs = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'),
    );
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
    if (currentIndex === -1) return;

    e.preventDefault();
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    tabs[nextIndex]?.focus();
    tabs[nextIndex]?.click();
  };

  const isLine = variant === 'line';

  const containerStyle = isLine
    ? 'flex items-center gap-1 border-b border-border-subtle overflow-x-auto custom-scrollbar'
    : 'flex items-center gap-1.5 p-1 bg-surface-secondary border border-border-subtle rounded-input overflow-x-auto custom-scrollbar';

  return (
    <div
      ref={containerRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={[containerStyle, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement<TabProps>(child)) {
          return React.cloneElement(child, {
            variant: child.props.variant || variant,
            size: child.props.size || size,
          });
        }
        return child;
      })}
    </div>
  );
};
