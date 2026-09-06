import React from 'react';
import { FilterTabs, FilterTab } from '../navigation/FilterTabs';

export interface TabbedListContainerProps {
  tabs: FilterTab[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
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
  className = '',
}) => {
  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <div className="shrink-0 mb-4">
        <FilterTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onChange={onTabChange}
          className="bg-transparent !p-0 elevation-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-1">
        {children}
      </div>
    </div>
  );
};
