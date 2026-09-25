import * as React from 'react';
import { SearchInput, Button } from '@40labs/ui-components';
import { CategorySquare } from './CategorySquare';

interface InventorySidebarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterExpired: boolean;
  onToggleExpired: () => void;
}

export const InventorySidebar: React.FC<InventorySidebarProps> = ({
  searchTerm,
  onSearchChange,
  filterExpired,
  onToggleExpired,
}) => {
  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Quick Search</label>
        <SearchInput
          placeholder="Search product name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange('')}
          className="shadow-sm"
        />
      </div>

      <div className="flex flex-col gap-4">
        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Filter by Status</label>
        <div className="grid grid-cols-2 gap-4">
          <CategorySquare
            label="Expired"
            isActive={filterExpired}
            onClick={onToggleExpired}
          />
          <CategorySquare
            label="Stock off"
            onClick={() => {
              /* no-op per requirement: visual-only for now */
            }}
          />
          <CategorySquare
            label="Most used"
            onClick={() => {
              /* no-op per requirement: visual-only for now */
            }}
          />
          <CategorySquare
            label="Dead"
            onClick={() => {
              /* no-op per requirement: visual-only for now */
            }}
          />
          <CategorySquare
            label="Metric"
            onClick={() => {
              /* no-op per requirement: visual-only for now */
            }}
          />
          <CategorySquare
            label="Metric"
            onClick={() => {
              /* no-op per requirement: visual-only for now */
            }}
          />
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button
          intent="neutral"
          fullWidth
          onClick={() => {
            // TODO: sync logic is a later, separate task
          }}
        >
          Sync
        </Button>
      </div>
    </div>
  );
};
