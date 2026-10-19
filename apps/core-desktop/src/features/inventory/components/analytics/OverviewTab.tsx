import * as React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import type { StockAnalytics } from '@40labs/types';

export interface OverviewTabProps {
  analytics?: StockAnalytics;
  isLoading?: boolean;
  onSelectCategory?: (category: string) => void;
  onSelectStatus?: (status: 'expired' | 'low' | 'out' | 'in_stock') => void;
}

const CATEGORY_COLORS = ['#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#15803D', '#166534'];

export const OverviewTab: React.FC<OverviewTabProps> = ({
  analytics,
  isLoading,
  onSelectCategory,
  onSelectStatus,
}) => {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-2 gap-3 h-[210px]">
        <div className="bg-surface-secondary/40 rounded-card animate-pulse" />
        <div className="bg-surface-secondary/40 rounded-card animate-pulse" />
      </div>
    );
  }

  const { by_category, status_breakdown } = analytics;

  const hasCategoryData = by_category.length > 0;
  const healthData = [
    { name: 'In Stock', value: status_breakdown.in_stock, color: '#16A34A', status: 'in_stock' },
    { name: 'Low', value: status_breakdown.low, color: '#F97316', status: 'low' },
    { name: 'Out', value: status_breakdown.out, color: '#EF4444', status: 'out' },
    { name: 'Expired', value: status_breakdown.expired, color: '#78716C', status: 'expired' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 h-[210px]">
      {/* 1. Category Distribution Donut */}
      <div className="bg-surface-elevated rounded-card border border-border/40 p-2.5 flex flex-col">
        <h4 className="font-heading text-[11px] font-bold text-text uppercase tracking-wider mb-1">
          Usambazaji kwa Kategoria
        </h4>
        <div className="flex-1 min-h-0 relative flex items-center justify-center">
          {hasCategoryData ? (
            <ResponsiveContainer width="100% " height="100%">
              <PieChart>
                <Pie
                  data={by_category}
                  dataKey="units"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={2}
                  onClick={(entry) => onSelectCategory && onSelectCategory(entry.category)}
                  className="cursor-pointer"
                >
                  {by_category.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${value} units (TZS ${new Intl.NumberFormat('en-US').format(item.payload.value)})`,
                    item.payload.category,
                  ]}
                  contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-text-muted text-xs">
              <span>—</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Stock Health Bar Chart */}
      <div className="bg-surface-elevated rounded-card border border-border/40 p-2.5 flex flex-col">
        <h4 className="font-heading text-[11px] font-bold text-text uppercase tracking-wider mb-1">
          Afya ya Akiba
        </h4>
        <div className="flex-1 min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={healthData}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip
                formatter={(val: number) => [`${val} items`, 'Count']}
                contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
              />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                onClick={(data) => {
                  if (data && data.status && onSelectStatus) {
                    onSelectStatus(data.status as any);
                  }
                }}
                className="cursor-pointer"
              >
                {healthData.map((entry, index) => (
                  <Cell key={`health-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
