import * as React from 'react';

interface SelectAllBannerProps {
  selectedCount: number;
  totalMatching: number;
  isAllMatching: boolean;
  onSelectAllMatching: () => void;
  onClear: () => void;
}

export const SelectAllBanner: React.FC<SelectAllBannerProps> = ({
  selectedCount,
  totalMatching,
  isAllMatching,
  onSelectAllMatching,
  onClear,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="w-full bg-surface-selected border-b border-border px-4 py-2 flex items-center justify-between text-xs text-text-primary">
      <div className="flex items-center gap-2">
        <span className="font-bold text-action-primary">
          {isAllMatching ? `All ${totalMatching.toLocaleString()} matching customers selected.` : `${selectedCount} customer(s) selected on this page.`}
        </span>
        {!isAllMatching && totalMatching > selectedCount && (
          <button
            type="button"
            onClick={onSelectAllMatching}
            className="text-action-primary underline font-semibold hover:text-action-hover cursor-pointer ml-1"
          >
            Select all {totalMatching.toLocaleString()} matching
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClear}
        className="text-text-muted hover:text-text-primary underline font-medium cursor-pointer"
      >
        Clear selection
      </button>
    </div>
  );
};
