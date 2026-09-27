import * as React from 'react';
import {
  PageViewport,
  PageHeader,
  PageContent,
  FilterTabs,
  Button,
  IconButton,
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

const CATEGORY_TABS = Object.values(reportCategoriesConfig).map((cat) => ({
  id: cat.id,
  label: cat.label,
}));

export const ReportsScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = React.useState<ReportCategoryId>('sales');
  const [periodOption, setPeriodOption] = React.useState<PeriodOption>('last_month');
  const [dateRange, setDateRange] = React.useState(() => getPeriodDateRange('last_month'));

  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
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
  } = useReports({
    categoryId: activeCategory,
    dateRange,
  });

  const handleDownloadPdf = () => {
    downloadReportPdf({
      title: categoryConfig.label,
      categoryLabel: categoryConfig.label,
      periodLabel: periodOption.replace('_', ' ').toUpperCase(),
      kpis,
      columns: tableColumns,
      rows: tableRows,
    });
    toast.success('Report PDF downloaded successfully.');
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
            <IconButton
              icon={<Download size={14} />}
              label="Download PDF report"
              intent="ghost"
              size="sm"
              onClick={handleDownloadPdf}
            />
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
        reportTitle={categoryConfig.label}
        periodLabel={periodOption.replace('_', ' ').toUpperCase()}
        onShareComplete={(summary) => {
          toast.success(summary);
        }}
      />
    </PageViewport>
  );
};
