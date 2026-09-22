import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import { IconButton } from '../primitives/IconButton';

export interface FilterChipProps {
  label: string;
  value: string;
  onRemove?: () => void;
  className?: string;
}

export const FilterChip = ({ label, value, onRemove, className = '' }: FilterChipProps) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-2 py-1 bg-panel rounded-full border border-border text-[10px] font-bold uppercase tracking-wider text-text ${className}`}
    >
      <span className="text-text-muted">{label}:</span>
      <span>{value}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:text-danger transition-colors ml-1 w-3 h-3 flex items-center justify-center rounded-full hover:bg-danger/10"
        >
          ×
        </button>
      )}
    </div>
  );
};

export interface FilterBarProps {
  children: React.ReactNode;
  onClearAll?: () => void;
  className?: string;
  clearAllVariant?: 'link' | 'button';
}

export const FilterBar = ({
  children,
  onClearAll,
  className = '',
  clearAllVariant = 'link',
}: FilterBarProps) => {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 p-2 bg-panel-strong/30 rounded-card border border-border/50 ${className}`}
    >
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mr-2 ml-1">
        Filters
      </span>
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {children}
      </div>
      {onClearAll && (
        <>
          {clearAllVariant === 'button' ? (
            <IconButton
              icon={<RotateCcw size={14} />}
              label="Reset filters"
              intent="neutral"
              size="sm"
              onClick={onClearAll}
              className="ml-2"
            />
          ) : (
            <button
              onClick={onClearAll}
              className="text-[10px] font-bold text-text-muted hover:text-text uppercase tracking-wider px-2 py-1 transition-colors"
            >
              Clear All
            </button>
          )}
        </>
      )}
    </div>
  );
};
