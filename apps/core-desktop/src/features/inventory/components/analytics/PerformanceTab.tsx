import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { ComputedStockAnalytics } from '../../analytics/stockAnalytics.queries';
import { ScrollableChartCard } from '../../analytics/ScrollableChartCard';

export interface PerformanceTabProps {
  analytics?: ComputedStockAnalytics;
  isLoading?: boolean;
  onSelectItem?: (itemId: string) => void;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ analytics, isLoading, onSelectItem }) => {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-3">
        <div className="bg-surface-secondary/40 rounded-card animate-pulse h-[220px]" />
        <div className="bg-surface-secondary/40 rounded-card animate-pulse h-[220px]" />
      </div>
    );
  }

  const { best_performers, slow_movers } = analytics;
  const hasBest = best_performers.length > 0;
  const hasSlow = slow_movers.length > 0;

  const formatTZS = (val: number) => `TZS ${new Intl.NumberFormat('en-US').format(Math.round(val))}`;

  return (
    <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-3">
      {/* 1. Best Performers */}
      <ScrollableChartCard
        title="Bidhaa Zinazofanya Vizuri Zaidi"
        isEmpty={!hasBest}
        rowCount={best_performers.length}
        rowHeight={28}
        ariaLabel="Best Performers Chart"
        fallbackTableData={best_performers.map((b) => ({ label: b.name, count: b.margin_pct, value: b.gross_profit }))}
      >
        {(showAll) => {
          const displayedBest = showAll ? best_performers : best_performers.slice(0, 8);
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayedBest}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(val: any, _name: any, item: any) => [
                    `${formatTZS(Number(val) || 0)} profit (${item?.payload?.margin_pct ?? 0}% margin, Rev: ${formatTZS(item?.payload?.revenue ?? 0)})`,
                    'Gross Profit',
                  ]}
                  contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar
                  dataKey="gross_profit"
                  fill="#16A34A"
                  radius={[0, 4, 4, 0]}
                  onClick={(barData) => {
                    const idx = (barData as any).index;
                    if (idx !== undefined && displayedBest[idx] && onSelectItem) {
                      onSelectItem(displayedBest[idx].item_id);
                    }
                  }}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          );
        }}
      </ScrollableChartCard>

      {/* 2. Slow Movers */}
      <ScrollableChartCard
        title="Bidhaa Zinazosonga Polepole"
        isEmpty={!hasSlow}
        rowCount={slow_movers.length}
        rowHeight={28}
        ariaLabel="Slow Movers Chart"
        fallbackTableData={slow_movers.map((s) => ({ label: s.name, count: s.days_since_last_sale, value: s.on_hand }))}
      >
        {(showAll) => {
          const displayedSlow = showAll ? slow_movers : slow_movers.slice(0, 8);
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayedSlow}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(val: any, _name: any, item: any) => [
                    `${val} days since last sale (On hand: ${item?.payload?.on_hand ?? 0})`,
                    'Days Inactive',
                  ]}
                  contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="days_since_last_sale" fill="#F97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          );
        }}
      </ScrollableChartCard>
    </div>
  );
};
