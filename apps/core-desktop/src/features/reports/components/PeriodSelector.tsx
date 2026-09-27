import * as React from 'react';
import { Select } from '@40labs/ui-components';
import { DateRange } from '../config/reportCategories';

export type PeriodOption = 'this_week' | 'this_month' | 'last_month' | 'this_quarter' | 'custom';

export function getPeriodDateRange(option: PeriodOption): DateRange {
  const now = new Date();

  switch (option) {
    case 'this_week': {
      const start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: now };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
    case 'this_quarter': {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), quarterMonth, 1);
      return { start, end: now };
    }
    case 'custom':
    default: {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      return { start, end: now };
    }
  }
}

export interface PeriodSelectorProps {
  value: PeriodOption;
  onChange: (option: PeriodOption, range: DateRange) => void;
  className?: string;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const opt = e.target.value as PeriodOption;
    const range = getPeriodDateRange(opt);
    onChange(opt, range);
  };

  return (
    <div className={`w-44 ${className}`}>
      <Select size="sm" value={value} onChange={handleChange}>
        <option value="this_week">This week</option>
        <option value="this_month">This month</option>
        <option value="last_month">Last month</option>
        <option value="this_quarter">This quarter</option>
        <option value="custom">Custom (30 days)</option>
      </Select>
    </div>
  );
};
