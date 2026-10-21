import * as React from 'react';
import { X } from 'lucide-react';

interface ActiveFilterChipsProps {
  timeRange: string;
  balanceFilter: string;
  sexFilter: string;
  searchTerm: string;
  onClearTime: () => void;
  onClearBalance: () => void;
  onClearSex: () => void;
  onClearSearch: () => void;
  onClearAll: () => void;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  timeRange,
  balanceFilter,
  sexFilter,
  searchTerm,
  onClearTime,
  onClearBalance,
  onClearSex,
  onClearSearch,
  onClearAll,
}) => {
  const hasFilters = timeRange !== 'all' || balanceFilter !== 'all' || sexFilter !== 'all' || Boolean(searchTerm);

  if (!hasFilters) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap pt-2 px-1 text-xs">
      <span className="text-text-muted font-medium">Active filters:</span>

      {timeRange !== 'all' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-secondary border border-border text-text-primary">
          <span>Time: {timeRange}</span>
          <button type="button" onClick={onClearTime} className="text-text-muted hover:text-text-primary">
            <X size={12} />
          </button>
        </span>
      )}

      {balanceFilter !== 'all' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-secondary border border-border text-text-primary">
          <span>Balance: {balanceFilter}</span>
          <button type="button" onClick={onClearBalance} className="text-text-muted hover:text-text-primary">
            <X size={12} />
          </button>
        </span>
      )}

      {sexFilter !== 'all' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-secondary border border-border text-text-primary">
          <span>Sex: {sexFilter}</span>
          <button type="button" onClick={onClearSex} className="text-text-muted hover:text-text-primary">
            <X size={12} />
          </button>
        </span>
      )}

      {Boolean(searchTerm) && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-secondary border border-border text-text-primary">
          <span>Search: "{searchTerm}"</span>
          <button type="button" onClick={onClearSearch} className="text-text-muted hover:text-text-primary">
            <X size={12} />
          </button>
        </span>
      )}

      <button
        type="button"
        onClick={onClearAll}
        className="text-action-primary underline font-medium hover:text-action-hover ml-2 cursor-pointer"
      >
        Clear all
      </button>
    </div>
  );
};
