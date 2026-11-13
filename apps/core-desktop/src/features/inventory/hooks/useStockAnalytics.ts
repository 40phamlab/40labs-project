import { useQuery } from '@tanstack/react-query';
import type { StockAnalyticsRange } from '@40labs/types';
import { inventoryApi, salesApi, purchasesApi } from '../../../api';
import { computeStockAnalytics } from '../analytics/computeStockAnalytics';
import type { ComputedStockAnalytics } from '../analytics/stockAnalytics.queries';

export function useStockAnalytics(range: StockAnalyticsRange = '30d') {
  const { data, isLoading, isError, error, refetch } = useQuery<ComputedStockAnalytics>({
    queryKey: ['inventory', 'stock-analytics', range],
    queryFn: async () => {
      const [inventory, medicines, sales, purchases, adjustments] = await Promise.all([
        inventoryApi.listInventoryItems(), inventoryApi.listMedicines(), salesApi.list(), purchasesApi.list(), inventoryApi.listStockAdjustments(),
      ]);
      const computed = computeStockAnalytics(inventory, medicines, sales, purchases, adjustments, range);
      return {
        kpis: { totalValue: computed.kpis.stock_value_buy, lowStockCount: computed.kpis.low_stock_count, outStockCount: computed.kpis.out_of_stock_count, expiring30dCount: computed.kpis.expiring_30d_count, totalSkus: computed.kpis.total_skus, ...computed.kpis },
        stockHealth: computed.status_breakdown,
        categoryDistribution: computed.by_category.map((c) => ({ category: c.category, skuCount: c.sku_count, value: c.value, units: c.units })),
        by_category: computed.by_category, status_breakdown: computed.status_breakdown, movement: computed.movement,
        movement_records: [],
        top_moving: computed.top_moving, best_performers: computed.best_performers, slow_movers: computed.slow_movers,
        expiry_buckets: computed.expiry_buckets, cover: computed.cover,
      };
    },
  });
  return { analytics: data, kpis: data?.kpis, categoryDistribution: data?.categoryDistribution ?? [], stockHealth: data?.stockHealth ?? { in_stock: 0, low: 0, out: 0, expired: 0 }, isLoading, isError, error, refetch };
}
