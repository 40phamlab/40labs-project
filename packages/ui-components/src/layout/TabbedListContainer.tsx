import React from 'react';
import { FilterTabs, FilterTab } from '../navigation/FilterTabs';

export interface TabbedListContainerProps {
  tabs: FilterTab[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
  /** Whether the content region is scrollable (default: true). Set false when children manage their own scrolling */
  scrollable?: boolean;
  className?: string;
}

/**
 * TabbedListContainer
 * A layout composite that combines FilterTabs with a scrollable content area.
 */
export const TabbedListContainer: React.FC<TabbedListContainerProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  children,
  scrollable = true,
  className = '',
}) => {
  return (
    <div className={`flex flex-col h-full min-h-0 min-w-0 overflow-hidden ${className}`}>
      <div className="shrink-0 mb-4">
        <FilterTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onChange={onTabChange}
          className="bg-transparent !p-0 elevation-none"
        />
      </div>
      <div
        className={`flex-1 min-h-0 min-w-0 space-y-2 pr-1 ${
          scrollable ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
