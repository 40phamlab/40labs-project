import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import { IconButton } from '@40labs/ui-components';
import { FilterChipTrigger } from './FilterChipTrigger';

export interface CustomerFilterBarProps {
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
  onClearAll: () => void;
  className?: string;
}

const TIME_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const STATIC_OPTIONS = [{ value: 'all', label: 'All' }];

/**
 * CustomerFilterBar
 *
 * Secondary filter row for CRM-style segmentation.
 * Renders as a nested distinct panel with the title on top and filters gathered tightly right-aligned.
 */
export const CustomerFilterBar: React.FC<CustomerFilterBarProps> = ({
  timeRange,
  onTimeRangeChange,
  onClearAll,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 p-3 bg-panel-strong/50 rounded-card border border-border/50 ${className}`}>
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Filters</span>
      <div className="flex items-center justify-end gap-5">
        <FilterChipTrigger
          label="Time"
          selectedValue={timeRange}
          options={TIME_OPTIONS}
          onSelect={onTimeRangeChange}
        />

        <FilterChipTrigger
          label="Age"
          selectedValue="all"
          options={STATIC_OPTIONS}
          onSelect={() => {}}
        />

        <FilterChipTrigger
          label="Gender"
          selectedValue="all"
          options={STATIC_OPTIONS}
          onSelect={() => {}}
        />

        <FilterChipTrigger
          label="Problem"
          selectedValue="all"
          options={STATIC_OPTIONS}
          onSelect={() => {}}
        />

        <FilterChipTrigger
          label="Subscription"
          selectedValue="all"
          options={STATIC_OPTIONS}
          onSelect={() => {}}
        />

        <FilterChipTrigger
          label="Relation"
          selectedValue="all"
          options={STATIC_OPTIONS}
          onSelect={() => {}}
        />

        <FilterChipTrigger
          label="Deals"
          selectedValue="all"
          options={STATIC_OPTIONS}
          onSelect={() => {}}
        />

        <IconButton
          intent="neutral"
          size="sm"
          icon={<RotateCcw size={14} />}
          label="Reset filters"
          onClick={onClearAll}
        />
      </div>
    </div>
  );
};
