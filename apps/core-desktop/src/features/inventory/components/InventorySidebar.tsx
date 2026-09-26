import * as React from 'react';
import { SearchInput, Button } from '@40labs/ui-components';
import { RefreshCw, FilterX } from 'lucide-react';
import { CategorySquare } from './CategorySquare';

interface InventorySidebarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterExpired: boolean;
  onToggleExpired: () => void;
  filterLowStock: boolean;
  onToggleLowStock: () => void;
  filterOutOfStock: boolean;
  onToggleOutOfStock: () => void;
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  onResetFilters: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const InventorySidebar: React.FC<InventorySidebarProps> = ({
  searchTerm,
  onSearchChange,
  filterExpired,
  onToggleExpired,
  filterLowStock,
  onToggleLowStock,
  filterOutOfStock,
  onToggleOutOfStock,
  categories,
  selectedCategory,
  onSelectCategory,
  onResetFilters,
  onSync,
  isSyncing = false,
}) => {
  const hasActiveFilters =
    filterExpired || filterLowStock || filterOutOfStock || selectedCategory !== null || searchTerm !== '';

  return (
    <div className="flex flex-col gap-6 h-full bg-panel p-4 rounded-card border border-border/50 elevation-raised">
      {/* Quick Search */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Quick Search
          </label>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[10px] font-semibold text-text-muted hover:text-primary flex items-center gap-1 cursor-pointer"
            >
              <FilterX size={12} /> Clear
            </button>
          )}
        </div>
        <SearchInput
          placeholder="Search name, generic, batch..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange('')}
        />
      </div>

      {/* Filter by Status */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Filter by Status
        </label>
        <div className="grid grid-cols-2 gap-3">
          <CategorySquare
            label="Expired"
            isActive={filterExpired}
            onClick={onToggleExpired}
          />
          <CategorySquare
            label="Low Stock"
            isActive={filterLowStock}
            onClick={onToggleLowStock}
          />
          <CategorySquare
            label="Stock Out"
            isActive={filterOutOfStock}
            onClick={onToggleOutOfStock}
          />
          <CategorySquare
            label="All Active"
            isActive={!filterExpired && !filterLowStock && !filterOutOfStock && !selectedCategory}
            onClick={onResetFilters}
          />
        </div>
      </div>

      {/* Filter by Category */}
      {categories.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Categories
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                selectedCategory === null
                  ? 'bg-primary text-primary-contrast border-primary font-bold'
                  : 'bg-panel-strong border-border/40 text-text-muted hover:text-text'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(selectedCategory === cat ? null : cat)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-contrast border-primary font-bold'
                    : 'bg-panel-strong border-border/40 text-text-muted hover:text-text'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-auto pt-4 border-t border-border/30">
        <Button
          intent="neutral"
          fullWidth
          leftIcon={<RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />}
          onClick={onSync}
          disabled={isSyncing}
        >
          {isSyncing ? 'Syncing...' : 'Sync Inventory'}
        </Button>
      </div>
    </div>
  );
};
