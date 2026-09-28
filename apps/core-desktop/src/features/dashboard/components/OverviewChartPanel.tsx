import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Chart, IconButton, defaultChartColors } from '@40labs/ui-components';
import { colors } from '@40labs/design-tokens';
import { t } from '@40labs/i18n';
import type { DashboardSummary } from '../../../api/dashboardApi';

interface OverviewChartPanelProps {
  summary: DashboardSummary;
}

const ringColors = defaultChartColors.filter((c) => c !== colors.danger);

export const OverviewChartPanel: React.FC<OverviewChartPanelProps> = ({ summary }) => {
  const [activeViewIndex, setActiveViewIndex] = React.useState<number>(0);

  const toggleView = () => {
    setActiveViewIndex((prev) => (prev === 0 ? 1 : 0));
  };

  const isSalesView = activeViewIndex === 0;

  return (
    <div className="bg-panel rounded-card border border-border/50 p-4 elevation-raised flex flex-col gap-3">
      {/* Header with Title and Pager Controls */}
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <div>
          <h3 className="font-heading text-sm font-bold text-text uppercase tracking-wider">
            {t('dashboard.overview')}
          </h3>
          <p className="font-ui text-xs text-text-muted">
            {isSalesView ? t('dashboard.salesTrend') : t('dashboard.profitByCategory')}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <IconButton
            icon={<ChevronLeft size={16} />}
            label={t('dashboard.previousChart')}
            variant="ghost"
            size="sm"
            onClick={toggleView}
          />
          <span className="text-[10px] font-mono font-bold text-text-muted px-1">
            {activeViewIndex + 1} / 2
          </span>
          <IconButton
            icon={<ChevronRight size={16} />}
            label={t('dashboard.nextChart')}
            variant="ghost"
            size="sm"
            onClick={toggleView}
          />
        </div>
      </div>

      {/* Chart View */}
      {isSalesView ? (
        <Chart
          type="line"
          data={summary.salesTrend}
          xKey="date"
          series={[{ dataKey: 'total', name: t('dashboard.todaysSales') }]}
          height={260}
          emptyMessage={t('dashboard.noData')}
        />
      ) : (
        <Chart
          type="pie"
          data={summary.salesByCategory}
          xKey="category"
          series={[{ dataKey: 'total', name: t('dashboard.profit') }]}
          innerRadius={60}
          colors={ringColors}
          height={260}
          emptyMessage={t('dashboard.noData')}
        />
      )}
    </div>
  );
};
