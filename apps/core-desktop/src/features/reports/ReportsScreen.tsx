import * as React from 'react';
import {
  PageViewport,
  PageHeader,
  PageContent,
  FilterTabs,
} from '@40labs/ui-components';
import { useReports } from '../../hooks/useReports';
import {
  ReportCategoryId,
  reportCategoriesConfig,
} from './config/reportCategories';
import { PeriodSelector, PeriodOption, getPeriodDateRange } from './components/PeriodSelector';
import { ReportChartRow } from './components/ReportChartRow';
import { ReportSummaryStrip } from './components/ReportSummaryStrip';
import { ReportTable } from './components/ReportTable';

const CATEGORY_TABS = Object.values(reportCategoriesConfig).map((cat) => ({
  id: cat.id,
  label: cat.label,
}));

export const ReportsScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = React.useState<ReportCategoryId>('sales');
  const [periodOption, setPeriodOption] = React.useState<PeriodOption>('last_month');
  const [dateRange, setDateRange] = React.useState(() => getPeriodDateRange('last_month'));

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

  return (
    <PageViewport>
      <PageHeader
        title="Reports & Analytics"
        subtitle={categoryConfig.description || 'Aggregation, compliance tracking, and business metrics'}
        actions={
          <PeriodSelector
            value={periodOption}
            onChange={handlePeriodChange}
          />
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
    </PageViewport>
  );
};
