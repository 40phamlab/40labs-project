import * as React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import type { ComputedStockAnalytics } from '../../analytics/stockAnalytics.queries';
import { ScrollableChartCard } from '../../analytics/ScrollableChartCard';

export interface MovementTabProps {
  analytics?: ComputedStockAnalytics;
  isLoading?: boolean;
  onSelectItem?: (itemId: string) => void;
}

export const MovementTab: React.FC<MovementTabProps> = ({ analytics, isLoading, onSelectItem }) => {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-3">
        <div className="bg-surface-secondary/40 rounded-card animate-pulse h-[220px]" />
        <div className="bg-surface-secondary/40 rounded-card animate-pulse h-[220px]" />
      </div>
    );
  }

  const { movement, top_moving } = analytics;
  const hasMovement = movement.length > 0;
  const hasTopMoving = top_moving.length > 0;

  return (
    <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-3">
      {/* 1. Stock In vs Out Line Chart */}
      <ScrollableChartCard
        title="Bidhaa Zinazoingia na Kutoka"
        isEmpty={!hasMovement}
        rowCount={movement.length}
        rowHeight={28}
        ariaLabel="Stock In vs Out Chart"
        fallbackTableData={movement.map((m) => ({ label: m.date, count: m.units_in, value: m.units_out }))}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={movement} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '2px' }} />
            <Line type="monotone" dataKey="units_in" name="In (Ingia)" stroke="#16A34A" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="units_out" name="Out (Toka)" stroke="#F97316" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ScrollableChartCard>

      {/* 2. Most Used Bar Chart (Horizontal) */}
      <ScrollableChartCard
        title="Bidhaa Zinazotumika Zaidi"
        isEmpty={!hasTopMoving}
        rowCount={top_moving.length}
        rowHeight={28}
        ariaLabel="Most Used Stock Chart"
        fallbackTableData={top_moving.map((t) => ({ label: t.name, count: t.units_out, value: t.units_out }))}
      >
        {(showAll) => {
          const displayedTopMoving = showAll ? top_moving : top_moving.slice(0, 8);
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayedTopMoving}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} units`, 'Units Out']}
                  contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar
                  dataKey="units_out"
                  fill="#16A34A"
                  radius={[0, 4, 4, 0]}
                  onClick={(barData) => {
                    const idx = (barData as any).index;
                    if (idx !== undefined && displayedTopMoving[idx] && onSelectItem) {
                      onSelectItem(displayedTopMoving[idx].item_id);
                    }
                  }}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          );
        }}
      </ScrollableChartCard>
    </div>
  );
};
