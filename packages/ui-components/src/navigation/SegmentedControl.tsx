import * as React from 'react';

export type SegmentedControlSize = 'sm' | 'md' | 'lg';

export interface SegmentedControlOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  size?: SegmentedControlSize;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const containerPaddingClasses: Record<SegmentedControlSize, string> = {
  sm: 'p-0.5 gap-0.5',
  md: 'p-1 gap-1',
  lg: 'p-1 gap-1',
};

const itemSizeClasses: Record<SegmentedControlSize, string> = {
  sm: 'h-6 text-xs px-2 gap-1',
  md: 'h-7 text-xs font-medium px-2.5 gap-1.5',
  lg: 'h-8 text-sm font-medium px-3 gap-2',
};

export const SegmentedControl = ({
  options,
  value,
  onChange,
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
}: SegmentedControlProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;

    const enabledOptions = options.filter((opt) => !opt.disabled && !disabled);
    if (enabledOptions.length === 0) return;

    const currentIndex = enabledOptions.findIndex((opt) => opt.value === value);
    if (currentIndex === -1) return;

    e.preventDefault();
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % enabledOptions.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + enabledOptions.length) % enabledOptions.length;
    }

    const nextOption = enabledOptions[nextIndex];
    if (nextOption) {
      onChange(nextOption.value);
      const buttonEl = containerRef.current?.querySelector<HTMLButtonElement>(
        `button[data-value="${CSS.escape(nextOption.value)}"]`,
      );
      buttonEl?.focus();
    }
  };

  const containerPadding = containerPaddingClasses[size] || containerPaddingClasses.md;
  const itemSize = itemSizeClasses[size] || itemSizeClasses.md;

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      onKeyDown={handleKeyDown}
      className={[
        'inline-flex items-center bg-surface-secondary border border-border-subtle rounded-input font-ui select-none shrink-0',
        containerPadding,
        fullWidth ? 'w-full flex' : '',
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const isDisabled = disabled || option.disabled;

        const stateClasses = isSelected
          ? 'bg-surface-elevated text-text-primary border border-border-default shadow-sm font-medium'
          : 'text-text-muted hover:text-text-primary hover:bg-surface-hover/50 border border-transparent';

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={isDisabled}
            data-value={option.value}
            disabled={isDisabled}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => !isDisabled && onChange(option.value)}
            className={[
              'inline-flex items-center justify-center rounded-input transition-all duration-150 ease-out',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app-bg',
              isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none text-text-disabled' : 'cursor-pointer',
              fullWidth ? 'flex-1' : '',
              itemSize,
              stateClasses,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {option.icon && <span className="shrink-0 flex items-center justify-center">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};
