// [phase: 8E] Stock Health Chart component
import * as React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ScrollableChartCard } from './ScrollableChartCard';
import type { StockHealthBreakdown } from './stockAnalytics.queries';

export interface StockHealthChartProps {
  health: StockHealthBreakdown;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onSelectStatus?: (status: string) => void;
  emptyAction?: () => void;
}

export const StockHealthChart: React.FC<StockHealthChartProps> = ({
  health,
  isLoading,
  isError,
  onRetry,
  onSelectStatus,
  emptyAction,
}) => {
  const data = [
    { name: 'Ipo', value: health.in_stock, color: '#16A34A', status: 'in_stock' },
    { name: 'Chini', value: health.low, color: '#F97316', status: 'low' },
    { name: 'Imeisha', value: health.out, color: '#EF4444', status: 'out' },
    { name: 'Imeisha muda', value: health.expired, color: '#78716C', status: 'expired' },
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ScrollableChartCard
      title="Afya ya Akiba"
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      isEmpty={total === 0}
      emptyAction={emptyAction}
      rowCount={data.length}
      ariaLabel="Stock Health Distribution Chart"
      fallbackTableData={data.map((d) => ({ label: d.name, count: d.value }))}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval={0} />
          <Tooltip
            formatter={(val: number) => [`${val} items`, 'Count']}
            contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            onClick={(data) => {
              if (data && data.status && onSelectStatus) {
                onSelectStatus(data.status);
              }
            }}
            className="cursor-pointer"
          >
            {data.map((entry, index) => (
              <Cell key={`health-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ScrollableChartCard>
  );
};
