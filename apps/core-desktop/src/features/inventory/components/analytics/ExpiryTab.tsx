import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import type { ComputedStockAnalytics } from '../../analytics/stockAnalytics.queries';
import { ScrollableChartCard } from '../../analytics/ScrollableChartCard';

export interface ExpiryTabProps {
  analytics?: ComputedStockAnalytics;
  isLoading?: boolean;
}

export const ExpiryTab: React.FC<ExpiryTabProps> = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-3">
        <div className="bg-surface-secondary/40 rounded-card animate-pulse h-[220px]" />
        <div className="bg-surface-secondary/40 rounded-card animate-pulse h-[220px]" />
      </div>
    );
  }

  const { expiry_buckets, cover } = analytics;
  const validCover = cover.filter((c) => c.days_of_cover !== null);
  const hasBuckets = expiry_buckets.length > 0;
  const hasCover = validCover.length > 0;

  const formatTZS = (val: number) => `TZS ${new Intl.NumberFormat('en-US').format(Math.round(val))}`;

  return (
    <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-3">
      {/* 1. Expiry Buckets */}
      <ScrollableChartCard
        title="Madaraja ya Kuisha Muda (Expiry Buckets)"
        isEmpty={!hasBuckets}
        rowCount={expiry_buckets.length}
        rowHeight={28}
        ariaLabel="Expiry Buckets Chart"
        fallbackTableData={expiry_buckets.map((e) => ({ label: e.bucket, count: e.units, value: e.value }))}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={expiry_buckets} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="bucket" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
            <Tooltip
              formatter={(val: any, _name: any, item: any) => [
                `${val} units (Value: ${formatTZS(item?.payload?.value ?? 0)})`,
                'Quantity',
              ]}
              contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
            />
            <Bar dataKey="units" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ScrollableChartCard>

      {/* 2. Days of Cover */}
      <ScrollableChartCard
        title="Siku za Akiba (Days of Cover)"
        isEmpty={!hasCover}
        rowCount={validCover.length}
        rowHeight={28}
        ariaLabel="Days of Cover Chart"
        fallbackTableData={validCover.map((v) => ({ label: v.name, count: v.days_of_cover ?? 0, value: v.on_hand }))}
      >
        {(showAll) => {
          const displayedCover = showAll ? validCover : validCover.slice(0, 8);
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayedCover}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(val: any, _name: any, item: any) => [
                    `${val} days cover (On hand: ${item?.payload?.on_hand ?? 0}, Daily out: ${item?.payload?.avg_daily_out ?? 0})`,
                    'Days of Cover',
                  ]}
                  contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="days_of_cover" radius={[0, 4, 4, 0]}>
                  {displayedCover.map((entry, index) => {
                    const doc = entry.days_of_cover ?? 0;
                    const color = doc <= 3 ? '#EF4444' : doc <= 7 ? '#F97316' : '#16A34A';
                    return <Cell key={`cover-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        }}
      </ScrollableChartCard>
    </div>
  );
};
