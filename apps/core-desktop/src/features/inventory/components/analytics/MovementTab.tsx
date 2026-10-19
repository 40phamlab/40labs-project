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
import type { StockAnalytics } from '@40labs/types';

export interface MovementTabProps {
  analytics?: StockAnalytics;
  isLoading?: boolean;
  onSelectItem?: (itemId: string) => void;
}

export const MovementTab: React.FC<MovementTabProps> = ({ analytics, isLoading, onSelectItem }) => {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-2 gap-3 h-[210px]">
        <div className="bg-surface-secondary/40 rounded-card animate-pulse" />
        <div className="bg-surface-secondary/40 rounded-card animate-pulse" />
      </div>
    );
  }

  const { movement, top_moving } = analytics;
  const hasMovement = movement.length > 0;
  const hasTopMoving = top_moving.length > 0;

  return (
    <div className="grid grid-cols-2 gap-3 h-[210px]">
      {/* 1. Stock In vs Out Line Chart */}
      <div className="bg-surface-elevated rounded-card border border-border/40 p-2.5 flex flex-col">
        <h4 className="font-heading text-[11px] font-bold text-text uppercase tracking-wider mb-1">
          Bidhaa Zinazoingia na Kutoka
        </h4>
        <div className="flex-1 min-h-0 relative">
          {hasMovement ? (
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
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted text-xs">—</div>
          )}
        </div>
      </div>

      {/* 2. Most Used Bar Chart (Horizontal) */}
      <div className="bg-surface-elevated rounded-card border border-border/40 p-2.5 flex flex-col">
        <h4 className="font-heading text-[11px] font-bold text-text uppercase tracking-wider mb-1">
          Bidhaa Zinazotumika Zaidi
        </h4>
        <div className="flex-1 min-h-0 relative">
          {hasTopMoving ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top_moving}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(val: number) => [`${val} units`, 'Units Out']}
                  contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar
                  dataKey="units_out"
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
    </div>
  );
};
