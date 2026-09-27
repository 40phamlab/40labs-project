import * as React from 'react';
import {
  PageViewport,
  PageHeader,
  PageContent,
  FilterTabs,
  Button,
  IconButton,
  Popover,
} from '@40labs/ui-components';
import { Download, Share2 } from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { useToast } from '../../hooks/useToast';
import {
  ReportCategoryId,
  reportCategoriesConfig,
} from './config/reportCategories';
import { PeriodSelector, PeriodOption, getPeriodDateRange } from './components/PeriodSelector';
import { ReportChartRow } from './components/ReportChartRow';
import { ReportSummaryStrip } from './components/ReportSummaryStrip';
import { ReportTable } from './components/ReportTable';
import { downloadReportPdf } from './utils/exportReportPdf';
import { ReportShareModal } from './components/ReportShareModal';
import { ReportSelectionList } from './components/ReportSelectionList';

const CATEGORY_TABS = Object.values(reportCategoriesConfig).map((cat) => ({
  id: cat.id,
  label: cat.label,
}));

export const ReportsScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = React.useState<ReportCategoryId>('sales');
  const [periodOption, setPeriodOption] = React.useState<PeriodOption>('last_month');
  const [dateRange, setDateRange] = React.useState(() => getPeriodDateRange('last_month'));

  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [isDownloadPopoverOpen, setIsDownloadPopoverOpen] = React.useState(false);
  const [downloadCategories, setDownloadCategories] = React.useState<ReportCategoryId[]>([activeCategory]);

  const { toast } = useToast();

  const handlePeriodChange = (option: PeriodOption, range: { start: Date; end: Date }) => {
    setPeriodOption(option);
    setDateRange(range);
  };

  const {
    categoryConfig,
    kpis,
    chartConfig,
    chartData,
    tableColumns,
    tableRows,
    isLoading,
    getReportForCategory,
  } = useReports({
    categoryId: activeCategory,
    dateRange,
  });

  React.useEffect(() => {
    if (!isDownloadPopoverOpen) {
      setDownloadCategories([activeCategory]);
    }
  }, [activeCategory, isDownloadPopoverOpen]);

  const handleExecuteDownload = () => {
    if (downloadCategories.length === 0) return;

    downloadCategories.forEach((catId) => {
      const reportData = getReportForCategory(catId);
      downloadReportPdf({
        title: reportData.categoryConfig.label,
        categoryLabel: reportData.categoryConfig.label,
        periodLabel: periodOption.replace('_', ' ').toUpperCase(),
        kpis: reportData.kpis,
        columns: reportData.tableColumns,
        rows: reportData.tableRows,
      });
    });

    toast.success(`Downloaded ${downloadCategories.length} report PDF(s) successfully.`);
    setIsDownloadPopoverOpen(false);
  };

  return (
    <PageViewport>
      <PageHeader
        title="Reports & Analytics"
        subtitle={categoryConfig.description || 'Aggregation, compliance tracking, and business metrics'}
        actions={
          <div className="flex items-center gap-2">
            <PeriodSelector
              value={periodOption}
              onChange={handlePeriodChange}
            />
            <Popover
              isOpen={isDownloadPopoverOpen}
              onClose={() => setIsDownloadPopoverOpen(false)}
              title="Download PDF Reports"
              position="bottom-end"
              content={
                <div className="flex flex-col gap-3 w-[300px]">
                  <ReportSelectionList
                    selectedCategories={downloadCategories}
                    onChange={setDownloadCategories}
                    periodLabel={periodOption.replace('_', ' ').toUpperCase()}
                    dateRange={dateRange}
                    getReportForCategory={getReportForCategory}
                  />
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      type="button"
                      intent="neutral"
                      size="sm"
                      onClick={() => setIsDownloadPopoverOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      intent="primary"
                      size="sm"
                      leftIcon={<Download size={14} />}
                      disabled={downloadCategories.length === 0}
                      onClick={handleExecuteDownload}
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
                onClick={() => setIsDownloadPopoverOpen(true)}
              />
            </Popover>
            <Button
              type="button"
              intent="primary"
              size="sm"
              leftIcon={<Share2 size={14} />}
              onClick={() => setIsShareModalOpen(true)}
            >
              Share Report
            </Button>
          </div>
        }
      />

      <PageContent className="flex flex-col gap-6 p-6 overflow-y-auto">
        {/* Category Pills */}
        <div className="flex items-center justify-between">
          <FilterTabs
            tabs={CATEGORY_TABS}
            activeTabId={activeCategory}
            onChange={(id) => setActiveCategory(id as ReportCategoryId)}
          />
        </div>

        {/* 3× Chart Cards Row */}
        <ReportChartRow
          categoryId={activeCategory}
          primaryConfig={chartConfig}
          primaryData={chartData}
        />

        {/* Metric Summary Strip */}
        <ReportSummaryStrip kpis={kpis} />

        {/* Detailed Data Table */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-bold font-heading uppercase tracking-wider text-text-muted px-1">
            {categoryConfig.label} Detailed Breakdown
          </div>
          <ReportTable
            columns={tableColumns}
            rows={tableRows}
            isLoading={isLoading}
          />
        </div>
      </PageContent>

      {/* Share & Outbox Modal */}
      <ReportShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        activeCategory={activeCategory}
        periodLabel={periodOption.replace('_', ' ').toUpperCase()}
        dateRange={dateRange}
        getReportForCategory={getReportForCategory}
        onShareComplete={(summary) => {
          toast.info(summary);
        }}
      />
    </PageViewport>
  );
};
