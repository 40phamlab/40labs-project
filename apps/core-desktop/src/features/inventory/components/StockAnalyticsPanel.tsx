import * as React from 'react';
import { Panel, FilterTabs, IconButton } from '@40labs/ui-components';
import { Eye, EyeOff, TrendingUp } from 'lucide-react';
import type { StockAnalyticsRange } from '@40labs/types';
import { useStockAnalytics } from '../hooks/useStockAnalytics';
import { StockKpiStrip } from './analytics/StockKpiStrip';
import { OverviewTab } from './analytics/OverviewTab';
import { MovementTab } from './analytics/MovementTab';
import { PerformanceTab } from './analytics/PerformanceTab';
import { ExpiryTab } from './analytics/ExpiryTab';

export interface StockAnalyticsPanelProps {
  graphVisible: boolean;
  onToggleGraph: () => void;
  onSelectCategory?: (category: string) => void;
  onSelectStatus?: (status: 'expired' | 'low' | 'out' | 'in_stock') => void;
  onSelectItemSearch?: (itemId: string) => void;
}

export const StockAnalyticsPanel: React.FC<StockAnalyticsPanelProps> = ({
  graphVisible,
  onToggleGraph,
  onSelectCategory,
  onSelectStatus,
  onSelectItemSearch,
}) => {
  const [range, setRange] = React.useState<StockAnalyticsRange>('30d');
  const [activeTab, setActiveTab] = React.useState<'overview' | 'movement' | 'performance' | 'expiry'>('overview');

  const { analytics, isLoading, isError } = useStockAnalytics(range);

  return (
    <div className="flex flex-col gap-2 shrink-0">
      {/* Toolbar row with eye icon + title + range selector */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <IconButton
            icon={graphVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            label={graphVisible ? 'Hide graph' : 'Show graph'}
            intent="ghost"
            size="sm"
            onClick={onToggleGraph}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5 font-heading">
            <TrendingUp size={12} /> Stock Trends & Category Analytics
          </span>
        </div>

        <FilterTabs
          tabs={[
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' },
            { id: '90d', label: '90D' },
          ]}
          activeTab={range}
          onChange={(id) => setRange(id as StockAnalyticsRange)}
        />
      </div>

      {graphVisible && (
        <Panel variant="inset" className="p-3 flex flex-col gap-2.5 bg-panel border border-border/50 h-[310px] overflow-hidden">
          {isError ? (
            <div className="flex items-center justify-center h-full text-danger text-xs">
              Failed to load analytics data.
            </div>
          ) : (
            <>
              {/* Row 1: KPI Strip */}
              <StockKpiStrip analytics={analytics} isLoading={isLoading} />

              {/* Row 2: Sub-tabs & Chart Body */}
              <div className="flex flex-col flex-1 min-h-0 gap-2">
                <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
                  <FilterTabs
                    tabs={[
                      { id: 'overview', label: 'Overview' },
                      { id: 'movement', label: 'Movement' },
                      { id: 'performance', label: 'Performance' },
                      { id: 'expiry', label: 'Expiry' },
                    ]}
                    activeTab={activeTab}
                    onChange={(id) => setActiveTab(id as any)}
                  />
                </div>

                <div className="flex-1 min-h-0">
                  {activeTab === 'overview' && (
                    <OverviewTab
                      analytics={analytics}
                      isLoading={isLoading}
                      onSelectCategory={onSelectCategory}
                      onSelectStatus={onSelectStatus}
                    />
                  )}
                  {activeTab === 'movement' && (
                    <MovementTab
                      analytics={analytics}
                      isLoading={isLoading}
                      onSelectItem={onSelectItemSearch}
                    />
                  )}
                  {activeTab === 'performance' && (
                    <PerformanceTab
                      analytics={analytics}
                      isLoading={isLoading}
                      onSelectItem={onSelectItemSearch}
                    />
                  )}
                  {activeTab === 'expiry' && (
                    <ExpiryTab analytics={analytics} isLoading={isLoading} />
                  )}
                </div>
              </div>
            </>
          )}
        </Panel>
      )}
    </div>
  );
};
