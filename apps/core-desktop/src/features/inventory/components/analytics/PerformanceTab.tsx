import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { StockAnalytics } from '@40labs/types';

export interface PerformanceTabProps {
  analytics?: StockAnalytics;
  isLoading?: boolean;
  onSelectItem?: (itemId: string) => void;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ analytics, isLoading, onSelectItem }) => {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-2 gap-3 h-[210px]">
        <div className="bg-surface-secondary/40 rounded-card animate-pulse" />
        <div className="bg-surface-secondary/40 rounded-card animate-pulse" />
      </div>
    );
  }

  const { best_performers, slow_movers } = analytics;
  const hasBest = best_performers.length > 0;
  const hasSlow = slow_movers.length > 0;

  const formatTZS = (val: number) => `TZS ${new Intl.NumberFormat('en-US').format(Math.round(val))}`;

  return (
    <div className="grid grid-cols-2 gap-3 h-[210px]">
      {/* 1. Best Performers */}
      <div className="bg-surface-elevated rounded-card border border-border/40 p-2.5 flex flex-col">
        <h4 className="font-heading text-[11px] font-bold text-text uppercase tracking-wider mb-1">
          Bidhaa Zinazofanya Vizuri Zaidi
        </h4>
        <div className="flex-1 min-h-0 relative">
          {hasBest ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={best_performers}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(val: number, name: any, item: any) => [
                    `${formatTZS(val)} profit (${item.payload.margin_pct}% margin, Rev: ${formatTZS(item.payload.revenue)})`,
                    'Gross Profit',
                  ]}
                  contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar
                  dataKey="gross_profit"
                  fill="#16A34A"
                  radius={[0, 4, 4, 0]}
                  onClick={(data) => {
                    if (data && data.item_id && onSelectItem) {
                      onSelectItem(data.item_id);
                    }
                  }}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted text-xs">—</div>
          )}
        </div>
      </div>

      {/* 2. Slow Movers */}
      <div className="bg-surface-elevated rounded-card border border-border/40 p-2.5 flex flex-col">
        <h4 className="font-heading text-[11px] font-bold text-text uppercase tracking-wider mb-1">
          Bidhaa Zinazosonga Polepole
        </h4>
        <div className="flex-1 min-h-0 relative">
          {hasSlow ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={slow_movers}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(val: number, name: any, item: any) => [
                    `${val} days since last sale (On hand: ${item.payload.on_hand})`,
                    'Days Inactive',
                  ]}
                  contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="days_since_last_sale" fill="#F97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted text-xs">—</div>
          )}
        </div>
      </div>
    </div>
  );
};
