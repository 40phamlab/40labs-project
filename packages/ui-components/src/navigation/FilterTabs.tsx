import React from 'react';

export interface FilterTab {
  id: string;
  label: string;
  count?: number;
}

export interface FilterTabsProps {
  tabs: FilterTab[];
  activeTabId: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * FilterTabs component for dynamic filtering with optional counts.
 * Follows the 40Labs restrained skeuomorphic design language.
 */
export const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs,
  activeTabId,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1 p-1 bg-surface-secondary border border-border-subtle rounded-input font-ui select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`
              relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-xs font-medium transition-all duration-150 select-none cursor-pointer
              focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
              ${
                isActive
                  ? 'bg-surface-elevated text-text-primary border border-border-default shadow-sm font-semibold'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover/50 border border-transparent'
              }
            `}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`
                  inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-none
                  ${
                    isActive
                      ? 'bg-action-primary/20 text-action-primary border border-action-primary/30 font-bold'
                      : 'bg-surface-primary text-text-muted border border-border-subtle'
                  }
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
