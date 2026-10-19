import * as React from 'react';
import { FilterTabs, Button, IconButton, Popover } from '@40labs/ui-components';
import { Download, Share2 } from 'lucide-react';
import { ReportCategoryId, reportCategoriesConfig } from '../config/reportCategories';
import { ReportSelectionList } from './ReportSelectionList';
import { DateRange } from '../config/reportCategories';

const CATEGORY_TABS = Object.values(reportCategoriesConfig).map((cat) => ({
  id: cat.id,
  label: cat.label,
}));

export interface ReportsHeaderProps {
  activeCategory: ReportCategoryId;
  onChangeCategory: (id: ReportCategoryId) => void;
  periodLabel: string;
  dateRange: DateRange;
  getReportForCategory: (catId: ReportCategoryId) => any;
  onShareClick: () => void;
  isDownloadPopoverOpen: boolean;
  onToggleDownloadPopover: (open: boolean) => void;
  downloadCategories: ReportCategoryId[];
  onChangeDownloadCategories: (cats: ReportCategoryId[]) => void;
  onExecuteDownload: () => void;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  activeCategory,
  onChangeCategory,
  periodLabel,
  dateRange,
  getReportForCategory,
  onShareClick,
  isDownloadPopoverOpen,
  onToggleDownloadPopover,
  downloadCategories,
  onChangeDownloadCategories,
  onExecuteDownload,
}) => {
  return (
    <div className="flex items-center justify-between w-full px-1 py-2 gap-4 overflow-x-auto shrink-0">
      <div className="min-w-0 flex-1">
        <FilterTabs
          tabs={CATEGORY_TABS}
          activeTabId={activeCategory}
          onChange={(id) => onChangeCategory(id as ReportCategoryId)}
        />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Popover
          isOpen={isDownloadPopoverOpen}
          onClose={() => onToggleDownloadPopover(false)}
          title="Download PDF Reports"
          position="bottom-end"
          content={
            <div className="flex flex-col gap-3 w-[300px]">
              <ReportSelectionList
                selectedCategories={downloadCategories}
                onChange={onChangeDownloadCategories}
                periodLabel={periodLabel}
                dateRange={dateRange}
                getReportForCategory={getReportForCategory}
              />
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  intent="neutral"
                  size="sm"
                  onClick={() => onToggleDownloadPopover(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  intent="primary"
                  size="sm"
                  leftIcon={<Download size={14} />}
                  disabled={downloadCategories.length === 0}
                  onClick={onExecuteDownload}
                >
                  Download ({downloadCategories.length})
                </Button>
              </div>
            </div>
          }
        >
          <IconButton
            icon={<Download size={14} />}
            label="Download PDF report"
            intent="ghost"
            size="sm"
            onClick={() => onToggleDownloadPopover(true)}
          />
        </Popover>
        <Button
          type="button"
          intent="primary"
          size="sm"
          leftIcon={<Share2 size={14} />}
          onClick={onShareClick}
        >
          Share Report
        </Button>
      </div>
    </div>
  );
};
