import React from 'react';
import { SearchInput } from '../forms/SearchInput';

export interface SearchableListPanelProps {
  searchPlaceholder?: string;
  onSearch: (query: string) => void;
  children: React.ReactNode;
  panelTitle?: string;
  className?: string;
}

/**
 * SearchableListPanel
 * A layout composite that provides a sticky search header above a scrollable content area.
 * Wrapped in a claymorphic panel.
 */
export const SearchableListPanel: React.FC<SearchableListPanelProps> = ({
  searchPlaceholder = 'Search...',
  onSearch,
  children,
  panelTitle,
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col h-full bg-panel rounded-card elevation-raised overflow-hidden
        ${className}
      `}
    >
      {/* Sticky Header */}
      <div className="p-4 space-y-3 bg-panel border-b border-border/10 shrink-0">
        {panelTitle && (
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">
            {panelTitle}
          </h3>
        )}
        <SearchInput
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch(e.target.value)}
          onClear={() => onSearch('')}
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <div className="flex flex-col gap-1.5">
          {children}
        </div>
      </div>
    </div>
  );
};
