// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import { getLanClient } from '../../lib/lan-client';
import { StockItem } from './types';
import { enqueue } from '../../lib/outbox-sync';

export async function fetchStockListApi(
  businessId: string,
  search?: string,
  lowStock?: boolean
): Promise<StockItem[]> {
  const client = await getLanClient(businessId);
  let path = '/api/v1/inventory';
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (lowStock) params.append('lowStock', 'true');
  if (params.toString()) path += `?${params.toString()}`;

  const data = await client.get<any>(path);
  return Array.isArray(data) ? data : data.items || [];
}

export async function fetchStockItemApi(businessId: string, id: string): Promise<StockItem> {
  const client = await getLanClient(businessId);
  return await client.get<StockItem>(`/api/v1/inventory/${id}`);
}

export async function enqueueStockReceipt(payload: {
  medicineName: string;
  genericName?: string | null;
  category: string;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  lowStockThreshold: number;
}): Promise<string> {
  return await enqueue('stock_receipt', payload);
}
