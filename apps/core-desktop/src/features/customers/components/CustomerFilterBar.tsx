import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import { IconButton } from '@40labs/ui-components';
import { FilterChipTrigger } from './FilterChipTrigger';

export interface CustomerFilterBarProps {
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
  balanceFilter: string;
  onBalanceFilterChange: (value: string) => void;
  onClearAll: () => void;
  className?: string;
}

const TIME_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const BALANCE_OPTIONS = [
  { value: 'all', label: 'All Balances' },
  { value: 'debtors', label: 'Debtors Only' },
  { value: 'clear', label: 'Zero Balance' },
];

export const CustomerFilterBar: React.FC<CustomerFilterBarProps> = ({
  timeRange,
  onTimeRangeChange,
  balanceFilter,
  onBalanceFilterChange,
  onClearAll,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
        Filters:
      </span>
      <div className="flex items-center gap-4">
        <FilterChipTrigger
          label="Time"
          selectedValue={timeRange}
          options={TIME_OPTIONS}
          onSelect={onTimeRangeChange}
        />

        <FilterChipTrigger
          label="Balance"
          selectedValue={balanceFilter}
          options={BALANCE_OPTIONS}
          onSelect={onBalanceFilterChange}
        />

        {(timeRange !== 'all' || balanceFilter !== 'all') && (
          <IconButton
            intent="ghost"
            size="sm"
            icon={<RotateCcw size={14} />}
            label="Reset filters"
            onClick={onClearAll}
          />
        )}
      </div>
    </div>
  );
};
