import * as React from 'react';

export type TabVariant = 'line' | 'pills';
export type TabSize = 'sm' | 'md' | 'lg';

export interface TabProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'label' | 'value'> {
  label: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: TabVariant;
  size?: TabSize;
  value?: string | number;
  'aria-controls'?: string;
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
      value,
      'aria-controls': ariaControls,
      id,
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
        id={id}
        aria-selected={active}
        aria-disabled={disabled}
        aria-controls={ariaControls}
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

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  children: React.ReactNode;
  variant?: TabVariant;
  size?: TabSize;
  className?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  orientation?: 'horizontal' | 'vertical';
  activation?: 'auto' | 'manual';
  dir?: 'ltr' | 'rtl';
}

export const Tabs = ({
  children,
  variant = 'line',
  size = 'md',
  className = '',
  value: controlledValue,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  activation = 'auto',
  dir = 'ltr',
  ...rest
}: TabsProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = React.useState<string | number | undefined>(
    defaultValue !== undefined ? defaultValue : undefined
  );

  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

  const handleTabClick = (tabValue: string | number | undefined, originalOnClick?: React.MouseEventHandler<HTMLButtonElement>) => (e: React.MouseEvent<HTMLButtonElement>) => {
    if (tabValue !== undefined) {
      if (!isControlled) {
        setInternalValue(tabValue);
      }
      onChange?.(tabValue);
    }
    originalOnClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const tabs = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled]):not([aria-disabled="true"])')
    );
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
    if (currentIndex === -1) return;

    const isRtl = dir === 'rtl' || container.getAttribute('dir') === 'rtl';
    const isVertical = orientation === 'vertical';

    let nextIndex = currentIndex;
    let handled = false;

    if (isVertical) {
      if (e.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % tabs.length;
        handled = true;
      } else if (e.key === 'ArrowUp') {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        handled = true;
      }
    } else {
      const forwardKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
      const backwardKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

      if (e.key === forwardKey) {
        nextIndex = (currentIndex + 1) % tabs.length;
        handled = true;
      } else if (e.key === backwardKey) {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        handled = true;
      }
    }

    if (e.key === 'Home') {
      nextIndex = 0;
      handled = true;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      const targetTab = tabs[nextIndex];
      targetTab?.focus();
      if (activation === 'auto') {
        targetTab?.click();
      }
    } else if (activation === 'manual' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      (document.activeElement as HTMLElement)?.click();
    }
  };

  const isLine = variant === 'line';

  const containerStyle = isLine
    ? orientation === 'vertical'
      ? 'flex flex-col items-stretch border-r border-border-subtle overflow-y-auto custom-scrollbar'
      : 'flex items-center gap-1 border-b border-border-subtle overflow-x-auto custom-scrollbar'
    : orientation === 'vertical'
      ? 'flex flex-col items-stretch gap-1.5 p-1 bg-surface-secondary border border-border-subtle rounded-input overflow-y-auto custom-scrollbar'
      : 'flex items-center gap-1.5 p-1 bg-surface-secondary border border-border-subtle rounded-input overflow-x-auto custom-scrollbar';

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      dir={dir}
      className={[containerStyle, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement<TabProps>(child)) {
          const tabValue = child.props.value !== undefined ? child.props.value : index;
          const isActive = isControlled || internalValue !== undefined
            ? activeValue === tabValue
            : child.props.active;

          return React.cloneElement(child, {
            variant: child.props.variant || variant,
            size: child.props.size || size,
            active: isActive,
            onClick: handleTabClick(tabValue, child.props.onClick),
          });
        }
        return child;
      })}
    </div>
  );
};

