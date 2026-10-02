import * as React from 'react';
import {
  PageToolbar,
  FilterTabs,
  Button,
  IconButton,
  Popover,
} from '@40labs/ui-components';
import { Download, Share2, Eye } from 'lucide-react';
import { TabContainer } from '../../components/TabContainer';
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
import { ReportPreviewModal } from './components/ReportPreviewModal';
import { convertCategoryDataToCanonical, CanonicalReport } from './types/reportModel';

const CATEGORY_TABS = Object.values(reportCategoriesConfig).map((cat) => ({
  id: cat.id,
  label: cat.label,
}));

export const ReportsScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = React.useState<ReportCategoryId>('sales');
  const [periodOption, setPeriodOption] = React.useState<PeriodOption>('last_month');
  const [dateRange, setDateRange] = React.useState(() => getPeriodDateRange('last_month'));

  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
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

  // Construct canonical report for active category
  const activeCanonicalReport: CanonicalReport = React.useMemo(() => {
    return convertCategoryDataToCanonical(
      activeCategory,
      periodOption.replace('_', ' ').toUpperCase(),
      dateRange,
      (catId) => getReportForCategory(catId)
    );
  }, [activeCategory, periodOption, dateRange, getReportForCategory]);

  const handleExecuteDownload = () => {
    if (downloadCategories.length === 0) return;

    downloadCategories.forEach((catId) => {
      const canonical = convertCategoryDataToCanonical(
        catId,
        periodOption.replace('_', ' ').toUpperCase(),
        dateRange,
        (id) => getReportForCategory(id)
      );
      downloadReportPdf(canonical);
    });

    toast.success(`Downloaded ${downloadCategories.length} report PDF(s) successfully.`);
    setIsDownloadPopoverOpen(false);
  };

  return (
    <TabContainer
      scroll
      toolbar={
        <PageToolbar
          left={
            <FilterTabs
              tabs={CATEGORY_TABS}
              activeTabId={activeCategory}
              onChange={(id) => setActiveCategory(id as ReportCategoryId)}
            />
          }
          right={
            <div className="flex items-center gap-2">
              <PeriodSelector
                value={periodOption}
                onChange={handlePeriodChange}
              />
              <Button
                type="button"
                intent="neutral"
                size="sm"
                leftIcon={<Eye size={14} />}
                onClick={() => setIsPreviewOpen(true)}
              >
                Preview
              </Button>
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
      }
      bodyClassName="gap-6 p-6"
      overlays={
        <>
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
          <ReportPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            report={activeCanonicalReport}
            onExportComplete={(format) => {
              toast.success(`Successfully exported report as ${format.toUpperCase()}`);
            }}
          />
        </>
      }
    >
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
    </TabContainer>
  );
};
