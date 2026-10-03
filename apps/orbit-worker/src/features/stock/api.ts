// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import { getServerCredential } from '../../lib/secure-store';
import { StockItem } from './types';
import { enqueue } from '../../lib/outbox-sync';

export async function fetchStockListApi(
  businessId: string,
  search?: string,
  lowStock?: boolean
): Promise<StockItem[]> {
  const server = await getServerCredential(businessId);
  if (!server) throw new Error('No server credential');

  let url = `${server.endpoint}/api/v1/stock?`;
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (lowStock) params.append('lowStock', 'true');
  url += params.toString();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${server.credential}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch stock: ${response.status}`);
  }

  const data = await response.json();
  return data || [];
}

export async function fetchStockItemApi(businessId: string, id: string): Promise<StockItem> {
  const server = await getServerCredential(businessId);
  if (!server) throw new Error('No server credential');

  const response = await fetch(`${server.endpoint}/api/v1/stock/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${server.credential}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch stock item: ${response.status}`);
  }

  return await response.json();
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
