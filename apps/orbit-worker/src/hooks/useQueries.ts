// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/01-ARCHITECTURE.md]
import { useQuery } from '@tanstack/react-query';
import { getLanClient } from '../lib/lan-client';
import { useConnectionStore } from '../stores/connection';
import { getCache, putCache, CacheResult } from '../db/cache';

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
      const client = await getLanClient(activeBusinessId);
      let path = '/api/v1/inventory';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (lowStock) params.append('lowStock', 'true');
      if (params.toString()) path += `?${params.toString()}`;

      const data = await client.get(path);
      const items = Array.isArray(data) ? data : data.items || [];
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
      const client = await getLanClient(activeBusinessId);
      let path = '/api/v1/customers';
      if (search) path += `?search=${encodeURIComponent(search)}`;
      const data = await client.get(path);
      const items = Array.isArray(data) ? data : data.items || [];
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
      const client = await getLanClient(activeBusinessId);
      const data = await client.get('/api/v1/lab/orders');
      const items = Array.isArray(data) ? data : data.items || [];
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
      const client = await getLanClient(activeBusinessId);
      const data = await client.get('/api/v1/notifications');
      const items = Array.isArray(data) ? data : data.items || [];
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
