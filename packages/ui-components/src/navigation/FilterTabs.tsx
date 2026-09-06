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
 * Uses soft claymorphism tokens.
 */
export const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs,
  activeTabId,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center gap-1.5 p-1.5 bg-panel rounded-card elevation-flat ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-input text-xs font-semibold transition-all duration-200
              ${
                isActive
                  ? 'bg-panel-strong text-primary elevation-raised'
                  : 'text-text-muted hover:text-text hover:bg-panel-strong/50'
              }
            `}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`
                  inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-mono
                  ${
                    isActive
                      ? 'bg-primary text-surface'
                      : 'bg-panel-strong text-text-muted'
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
