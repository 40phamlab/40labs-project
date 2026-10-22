// [phase: 8E] Category Distribution Chart component
import * as React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ScrollableChartCard } from './ScrollableChartCard';
import type { CategoryDistributionItem } from './stockAnalytics.queries';

export interface CategoryDistributionChartProps {
  categories: CategoryDistributionItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onSelectCategory?: (cat: string) => void;
  emptyAction?: () => void;
}

const CATEGORY_COLORS = ['#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#15803D', '#166534'];

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({
  categories,
  isLoading,
  isError,
  onRetry,
  onSelectCategory,
  emptyAction,
}) => {
  return (
    <ScrollableChartCard
      title="Usambazaji kwa Kategoria"
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      isEmpty={categories.length === 0}
      emptyAction={emptyAction}
      rowCount={categories.length}
      rowHeight={28}
      ariaLabel="Category Distribution Chart"
      fallbackTableData={categories.map((c) => ({ label: c.category, count: c.skuCount, value: c.value }))}
    >
      {(showAll) => {
        const displayedCategories = showAll ? categories : categories.slice(0, 8);
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayedCategories} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="category"
                type="category"
                width={100}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                interval={0}
                tickFormatter={(val) => (val.length > 15 ? `${val.substring(0, 15)}...` : val)}
              />
              <Tooltip
                formatter={(value: any, _name: any, item: any) => [
                  `${item?.payload?.skuCount ?? 0} SKUs (${item?.payload?.units ?? 0} units) - TZS ${new Intl.NumberFormat('en-US').format(Number(value) || 0)}`,
                  item?.payload?.category || '',
                ]}
                contentStyle={{ background: 'var(--panel)', borderColor: 'var(--border)', fontSize: '11px', borderRadius: '8px' }}
              />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                onClick={(barData) => {
                  const idx = (barData as any).index;
                  if (idx !== undefined && displayedCategories[idx] && onSelectCategory) {
                    onSelectCategory(displayedCategories[idx].category);
                  }
                }}
                className="cursor-pointer"
              >
                {displayedCategories.map((_, index) => (
                  <Cell key={`cat-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }}
    </ScrollableChartCard>
  );
};
