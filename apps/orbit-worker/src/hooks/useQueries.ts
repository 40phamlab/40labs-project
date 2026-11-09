// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/01-ARCHITECTURE.md]
import { useQuery } from '@tanstack/react-query';
import { getLanClient } from '../lib/lan-client';
import { useConnectionStore } from '../stores/connection';
import { getCache, putCache, CacheResult } from '../db/cache';
import { fetchStockListApi } from '../features/stock/api';
import { fetchCustomersApi } from '../features/customers/api';
import { fetchLabOrdersApi } from '../features/lab/api';
import { fetchNotificationsApi } from '../features/notifications/api';

export function useSummary() {
  const activeBusinessId = useConnectionStore((s) => s.activeBusinessId);
  const status = useConnectionStore((s) => s.status);

  return useQuery({
    queryKey: ['summary', activeBusinessId],
    queryFn: async () => {
      if (!activeBusinessId) throw new Error('No active business');
      const client = await getLanClient(activeBusinessId);
      const data = await client.get('/api/v1/me/summary');
      putCache('home_summary', data);
      return data;
    },
    enabled: !!activeBusinessId && status !== 'unpaired',
    initialData: () => {
      const cached = getCache<any>('home_summary');
      return cached ? cached.data : undefined;
    },
    retry: 1,
  });
}

export function useActivity() {
  const activeBusinessId = useConnectionStore((s) => s.activeBusinessId);
  const status = useConnectionStore((s) => s.status);

  return useQuery({
    queryKey: ['activity', activeBusinessId],
    queryFn: async () => {
      if (!activeBusinessId) throw new Error('No active business');
      const client = await getLanClient(activeBusinessId);
      const data = await client.get('/api/v1/activity');
      const items = data.items || [];
      putCache('history_activity', items);
      return items;
    },
    enabled: !!activeBusinessId && status !== 'unpaired',
    initialData: () => {
      const cached = getCache<any[]>('history_activity');
      return cached ? cached.data : undefined;
    },
    retry: 1,
  });
}

export function useStock(search?: string, lowStock?: boolean) {
  const activeBusinessId = useConnectionStore((s) => s.activeBusinessId);
  const status = useConnectionStore((s) => s.status);
  const cacheKey = `stock_list_${search || ''}_${lowStock ? '1' : '0'}`;

  return useQuery({
    queryKey: ['stock', activeBusinessId, search, lowStock],
    queryFn: async () => {
      if (!activeBusinessId) throw new Error('No active business');
      const items = await fetchStockListApi(activeBusinessId, search, lowStock);
      putCache(cacheKey, items);
      return items;
    },
    enabled: !!activeBusinessId && status !== 'unpaired',
    initialData: () => {
      const cached = getCache<any[]>(cacheKey);
      return cached ? cached.data : undefined;
    },
    retry: 1,
  });
}

export function useCustomers(search?: string) {
  const activeBusinessId = useConnectionStore((s) => s.activeBusinessId);
  const status = useConnectionStore((s) => s.status);
  const cacheKey = `customers_${search || ''}`;

  return useQuery({
    queryKey: ['customers', activeBusinessId, search],
    queryFn: async () => {
      if (!activeBusinessId) throw new Error('No active business');
      const items = await fetchCustomersApi(activeBusinessId, search);
      putCache(cacheKey, items);
      return items;
    },
    enabled: !!activeBusinessId && status !== 'unpaired',
    initialData: () => {
      const cached = getCache<any[]>(cacheKey);
      return cached ? cached.data : undefined;
    },
    retry: 1,
  });
}

export function useLabOrders() {
  const activeBusinessId = useConnectionStore((s) => s.activeBusinessId);
  const status = useConnectionStore((s) => s.status);

  return useQuery({
    queryKey: ['lab_orders', activeBusinessId],
    queryFn: async () => {
      if (!activeBusinessId) throw new Error('No active business');
      const items = await fetchLabOrdersApi(activeBusinessId);
      putCache('lab_orders', items);
      return items;
    },
    enabled: !!activeBusinessId && status !== 'unpaired',
    initialData: () => {
      const cached = getCache<any[]>('lab_orders');
      return cached ? cached.data : undefined;
    },
    retry: 1,
  });
}

export function useStaffNotifications() {
  const activeBusinessId = useConnectionStore((s) => s.activeBusinessId);
  const status = useConnectionStore((s) => s.status);

  return useQuery({
    queryKey: ['notifications', activeBusinessId],
    queryFn: async () => {
      if (!activeBusinessId) throw new Error('No active business');
      const res = await fetchNotificationsApi(activeBusinessId);
      const items = res.items || [];
      putCache('notifications', items);
      return items;
    },
    enabled: !!activeBusinessId && status !== 'unpaired',
    initialData: () => {
      const cached = getCache<any[]>('notifications');
      return cached ? cached.data : undefined;
    },
    retry: 1,
  });
}

export function getCachedMeta(key: string): CacheResult | null {
  return getCache(key);
}
