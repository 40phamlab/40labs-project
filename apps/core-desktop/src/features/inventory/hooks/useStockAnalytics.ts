// [phase: 8E] React Query hook for live inventory analytics
import { useQuery } from '@tanstack/react-query';
import type { StockAnalyticsRange } from '@40labs/types';
import { inventoryApi } from '../../../api';
import { computeStockAnalytics, type ComputedStockAnalytics } from '../analytics/stockAnalytics.queries';

export function useStockAnalytics(range: StockAnalyticsRange = '30d') {
  const queryKey = ['inventory', 'stock-analytics', range];

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ComputedStockAnalytics>({
    queryKey,
    queryFn: async () => {
      const items = await inventoryApi.list();
      return computeStockAnalytics(items);
    },
  });

  return {
    analytics: data,
    kpis: data?.kpis,
    categoryDistribution: data?.categoryDistribution || [],
    stockHealth: data?.stockHealth || { in_stock: 0, low: 0, out: 0, expired: 0 },
    isLoading,
    isError,
    error,
    refetch,
  };
}
