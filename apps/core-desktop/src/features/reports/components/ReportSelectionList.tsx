import * as React from 'react';
import { Checkbox } from '@40labs/ui-components';
import {
  ReportCategoryId,
  reportCategoriesConfig,
  DateRange,
} from '../config/reportCategories';
import { useReports } from '../../../hooks/useReports';

export interface ReportSelectionListProps {
  selectedCategories: ReportCategoryId[];
  onChange: (selected: ReportCategoryId[]) => void;
  periodLabel?: string;
  dateRange?: DateRange;
  getReportForCategory?: (id: ReportCategoryId) => { tableRows: Record<string, unknown>[] };
  className?: string;
}

const ALL_CATEGORY_IDS: ReportCategoryId[] = ['sales', 'inventory', 'customers', 'purchases', 'compliance'];

const CategoryRowItem: React.FC<{
  categoryId: ReportCategoryId;
  periodLabel: string;
  dateRange?: DateRange;
  getReportForCategory?: (id: ReportCategoryId) => { tableRows: Record<string, unknown>[] };
  isSelected: boolean;
  onToggle: (id: ReportCategoryId) => void;
}> = ({ categoryId, periodLabel, dateRange, getReportForCategory, isSelected, onToggle }) => {
  const categoryConfig = reportCategoriesConfig[categoryId];

  // If parent provided getReportForCategory, use it directly to avoid extra hook calls; otherwise call useReports
  const reportsData = getReportForCategory
    ? getReportForCategory(categoryId)
    : useReports({ categoryId, dateRange });

  const rowCount = reportsData.tableRows.length;

  return (
    <div
      onClick={() => onToggle(categoryId)}
      className={`flex items-center justify-between p-2.5 rounded-input border transition-colors cursor-pointer select-none ${
        isSelected
          ? 'bg-panel-strong border-primary/50 text-text elevation-raised'
          : 'bg-panel border-border/50 text-text-muted hover:text-text hover:bg-surface'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Checkbox
          checked={isSelected}
          onChange={() => onToggle(categoryId)}
        />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-text">{categoryConfig.label}</span>
          <span className="text-[10px] text-text-muted">{periodLabel}</span>
        </div>
      </div>
      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
        {rowCount} {rowCount === 1 ? 'row' : 'rows'}
      </span>
    </div>
  );
};

export const ReportSelectionList: React.FC<ReportSelectionListProps> = ({
  selectedCategories,
  onChange,
  periodLabel = 'Current Period',
  dateRange,
  getReportForCategory,
  className = '',
}) => {
  const toggleCategory = (id: ReportCategoryId) => {
    if (selectedCategories.includes(id)) {
      if (selectedCategories.length > 1) {
        onChange(selectedCategories.filter((c) => c !== id));
      }
    } else {
      onChange([...selectedCategories, id]);
    }
  };

  const isAllSelected = selectedCategories.length === ALL_CATEGORY_IDS.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      // Keep at least the first one selected
      onChange([selectedCategories[0] || 'sales']);
    } else {
      onChange([...ALL_CATEGORY_IDS]);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">
        <span>Reports to Include ({selectedCategories.length}/{ALL_CATEGORY_IDS.length})</span>
        <button
          type="button"
          onClick={handleToggleAll}
          className="text-primary hover:underline cursor-pointer normal-case text-[11px] font-medium"
        >
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-0.5">
        {ALL_CATEGORY_IDS.map((id) => (
          <CategoryRowItem
            key={id}
            categoryId={id}
            periodLabel={periodLabel}
            dateRange={dateRange}
            getReportForCategory={getReportForCategory}
            isSelected={selectedCategories.includes(id)}
            onToggle={toggleCategory}
          />
        ))}
      </div>
    </div>
  );
};
