// [phase: 8E] Overview Tab with Scrollable Charts & Live Data
import * as React from 'react';
import type { ComputedStockAnalytics } from '../../analytics/stockAnalytics.queries';
import { CategoryDistributionChart } from '../../analytics/CategoryDistributionChart';
import { StockHealthChart } from '../../analytics/StockHealthChart';

export interface OverviewTabProps {
  analytics?: ComputedStockAnalytics;
  isLoading?: boolean;
  onSelectCategory?: (category: string) => void;
  onSelectStatus?: (status: string) => void;
  onRetry?: () => void;
  emptyAction?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  analytics,
  isLoading,
  onSelectCategory,
  onSelectStatus,
  onRetry,
  emptyAction,
}) => {
  const categories = analytics?.categoryDistribution || [];
  const health = analytics?.stockHealth || { in_stock: 0, low: 0, out: 0, expired: 0 };

  return (
    <div className="grid grid-cols-2 gap-3 h-[210px] min-h-0">
      <CategoryDistributionChart
        categories={categories}
        isLoading={isLoading}
        onSelectCategory={onSelectCategory}
        onRetry={onRetry}
        emptyAction={emptyAction}
      />
      <StockHealthChart
        health={health}
        isLoading={isLoading}
        onSelectStatus={onSelectStatus}
        onRetry={onRetry}
        emptyAction={emptyAction}
      />
    </div>
  );
};
