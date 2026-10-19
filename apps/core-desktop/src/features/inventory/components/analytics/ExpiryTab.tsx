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
import type { StockAnalytics } from '@40labs/types';

export interface ExpiryTabProps {
  analytics?: StockAnalytics;
  isLoading?: boolean;
}

export const ExpiryTab: React.FC<ExpiryTabProps> = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-2 gap-3 h-[210px]">
        <div className="bg-surface-secondary/40 rounded-card animate-pulse" />
        <div className="bg-surface-secondary/40 rounded-card animate-pulse" />
      </div>
    );
  }

  const { expiry_buckets, cover } = analytics;
  const validCover = cover.filter((c) => c.days_of_cover !== null);
  const hasBuckets = expiry_buckets.length > 0;
  const hasCover = validCover.length > 0;

  const formatTZS = (val: number) => `TZS ${new Intl.NumberFormat('en-US').format(Math.round(val))}`;

  return (
    <div className="grid grid-cols-2 gap-3 h-[210px]">
      {/* 1. Expiry Buckets */}
      <div className="bg-surface-elevated rounded-card border border-border/40 p-2.5 flex flex-col">
        <h4 className="font-heading text-[11px] font-bold text-text uppercase tracking-wider mb-1">
          Madaraja ya Kuisha Muda (Expiry Buckets)
        </h4>
        <div className="flex-1 min-h-0 relative">
          {hasBuckets ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expiry_buckets} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="bucket" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(val: number, name: any, item: any) => [
                    `${val} units (Value: ${formatTZS(item.payload.value)})`,
                    'Quantity',
                  ]}
                  contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="units" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted text-xs">—</div>
          )}
        </div>
      </div>

      {/* 2. Days of Cover */}
      <div className="bg-surface-elevated rounded-card border border-border/40 p-2.5 flex flex-col">
        <h4 className="font-heading text-[11px] font-bold text-text uppercase tracking-wider mb-1">
          Siku za Akiba (Days of Cover)
        </h4>
        <div className="flex-1 min-h-0 relative">
          {hasCover ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={validCover}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(val: number, name: any, item: any) => [
                    `${val} days cover (On hand: ${item.payload.on_hand}, Daily out: ${item.payload.avg_daily_out})`,
                    'Days of Cover',
                  ]}
                  contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="days_of_cover" radius={[0, 4, 4, 0]}>
                  {validCover.map((entry, index) => {
                    const doc = entry.days_of_cover ?? 0;
                    const color = doc <= 3 ? '#EF4444' : doc <= 7 ? '#F97316' : '#16A34A';
                    return <Cell key={`cover-${index}`} fill={color} />;
                  })}
                </Bar>
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
