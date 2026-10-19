import * as React from 'react';
import { TabContainer } from '../../components/TabContainer';
import { useReports } from '../../hooks/useReports';
import { useBusiness } from '../../hooks/useBusiness';
import { useReportLayoutStore } from '../../stores/useReportLayoutStore';
import { useToast } from '../../hooks/useToast';
import {
  ReportCategoryId,
} from './config/reportCategories';
import { PeriodOption, getPeriodDateRange } from './components/PeriodSelector';
import { ReportsHeader } from './components/ReportsHeader';
import { ReportsFilterBar } from './components/ReportsFilterBar';
import { ReportsKpiRow } from './components/ReportsKpiRow';
import { UnifiedChart } from './components/UnifiedChart';
import { ReportTable } from './components/ReportTable';
import { downloadReportPdf } from './utils/exportReportPdf';
import { ReportShareModal } from './components/ReportShareModal';
import { ReportPreviewModal } from './components/ReportPreviewModal';
import { ReportEditorModal } from './components/ReportEditorModal';
import { convertCategoryDataToCanonical, CanonicalReport } from './types/reportModel';
import { useReportChartState } from './state/useReportChartState';
import { getUnifiedChartDataForTab } from './config/seriesData';

export const ReportsScreen: React.FC = () => {
  const { business } = useBusiness();
  const { config: layoutConfig } = useReportLayoutStore();

  const [activeCategory, setActiveCategory] = React.useState<ReportCategoryId>('sales');
  const [periodOption, setPeriodOption] = React.useState<PeriodOption>('last_month');
  const [dateRange, setDateRange] = React.useState(() => getPeriodDateRange('last_month'));

  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [isDownloadPopoverOpen, setIsDownloadPopoverOpen] = React.useState(false);
  const [downloadCategories, setDownloadCategories] = React.useState<ReportCategoryId[]>([activeCategory]);

  const { toast } = useToast();

  const {
    chartType,
    granularity,
    seriesVisibility,
    compare,
    setActiveTab,
    setChartType,
    setGranularity,
    toggleSeries,
    setCompare,
    resetToDefault,
  } = useReportChartState();

  React.useEffect(() => {
    setActiveTab(activeCategory);
  }, [activeCategory, setActiveTab]);

  const handlePeriodChange = (option: PeriodOption, range: { start: Date; end: Date }) => {
    setPeriodOption(option);
    setDateRange(range);
  };

  const {
    categoryConfig,
    kpis,
    tableColumns,
    tableRows,
    isLoading,
    getReportForCategory,
    contextData,
  } = useReports({
    categoryId: activeCategory,
    dateRange,
  });

  const prevDateRange = React.useMemo(() => {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    return {
      start: new Date(dateRange.start.getTime() - duration - 1),
      end: new Date(dateRange.start.getTime() - 1),
    };
  }, [dateRange]);

  const { contextData: prevContextData } = useReports({
    categoryId: activeCategory,
    dateRange: prevDateRange,
  });

  const primaryChartData = React.useMemo(() => {
    return getUnifiedChartDataForTab(activeCategory, contextData);
  }, [activeCategory, contextData]);

  const previousChartData = React.useMemo(() => {
    if (!compare) return [];
    return getUnifiedChartDataForTab(activeCategory, prevContextData);
  }, [activeCategory, prevContextData, compare]);

  React.useEffect(() => {
    if (!isDownloadPopoverOpen) {
      setDownloadCategories([activeCategory]);
    }
  }, [activeCategory, isDownloadPopoverOpen]);

  const activeCanonicalReport: CanonicalReport = React.useMemo(() => {
    return convertCategoryDataToCanonical(
      activeCategory,
      periodOption.replace('_', ' ').toUpperCase(),
      dateRange,
      (catId) => getReportForCategory(catId),
      business
    );
  }, [activeCategory, periodOption, dateRange, getReportForCategory, business]);

  const handleExecuteDownload = () => {
    if (downloadCategories.length === 0) return;

    downloadCategories.forEach((catId) => {
      const canonical = convertCategoryDataToCanonical(
        catId,
        periodOption.replace('_', ' ').toUpperCase(),
        dateRange,
        (id) => getReportForCategory(id),
        business
      );
      downloadReportPdf(canonical, layoutConfig, business);
    });

    toast.success(`Downloaded ${downloadCategories.length} report PDF(s) successfully.`);
    setIsDownloadPopoverOpen(false);
  };

  return (
    <TabContainer
      scroll
      toolbar={
        <ReportsHeader
          activeCategory={activeCategory}
          onChangeCategory={setActiveCategory}
          periodLabel={periodOption.replace('_', ' ').toUpperCase()}
          dateRange={dateRange}
          getReportForCategory={getReportForCategory}
          onShareClick={() => setIsShareModalOpen(true)}
          isDownloadPopoverOpen={isDownloadPopoverOpen}
          onToggleDownloadPopover={setIsDownloadPopoverOpen}
          downloadCategories={downloadCategories}
          onChangeDownloadCategories={setDownloadCategories}
          onExecuteDownload={handleExecuteDownload}
        />
      }
      bodyClassName="flex flex-col gap-6 p-6 flex-1 min-h-0 overflow-y-auto"
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
          <ReportEditorModal
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            report={activeCanonicalReport}
            onExportComplete={(format) => {
              toast.success(`Successfully exported report as ${format.toUpperCase()}`);
            }}
          />
        </>
      }
    >
      {/* Filter Bar directly above KPI row */}
      <ReportsFilterBar
        periodValue={periodOption}
        onPeriodChange={handlePeriodChange}
        compare={compare}
        onCompareChange={setCompare}
        onOpenEditor={() => setIsEditorOpen(true)}
        onOpenPreview={() => setIsPreviewOpen(true)}
      />

      {/* KPI Row */}
      <ReportsKpiRow kpis={kpis} />

      {/* Unified Chart */}
      <UnifiedChart
        categoryId={activeCategory}
        chartType={chartType}
        granularity={granularity}
        seriesVisibility={seriesVisibility}
        compare={compare}
        onSelectChartType={setChartType}
        onSelectGranularity={setGranularity}
        onToggleSeries={toggleSeries}
        onToggleCompare={setCompare}
        onReset={() => resetToDefault(activeCategory)}
        primaryData={primaryChartData}
        previousData={previousChartData}
        hasTimestamps={activeCategory === 'sales'}
      />

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
