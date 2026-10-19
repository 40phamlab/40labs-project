// [phase: StockAnalytics] React Query Hook for Stock Trends & Category Analytics
import { useQuery } from '@tanstack/react-query';
import type { StockAnalytics, StockAnalyticsRange } from '@40labs/types';
import { inventoryApi, salesApi, purchasesApi } from '../../../api';
import { WORKSPACE_ID, BRANCH_ID } from '../../../devData/constants';
import { computeStockAnalytics } from '../analytics/computeStockAnalytics';

export function useStockAnalytics(range: StockAnalyticsRange = '30d') {
  const queryKey = ['inventory', 'analytics', WORKSPACE_ID, BRANCH_ID, range];

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<StockAnalytics>({
    queryKey,
    queryFn: async () => {
      const [rawItems, medicines, sales, purchaseOrders, adjustments] = await Promise.all([
        inventoryApi.listInventoryItems(),
        inventoryApi.listMedicines(),
        salesApi.list(),
        purchasesApi.list(),
        inventoryApi.listStockAdjustments(),
      ]);

      return computeStockAnalytics(
        rawItems,
        medicines,
        sales,
        purchaseOrders,
        adjustments,
        range
      );
    },
  });

  return {
    analytics: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
