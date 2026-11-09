// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import { getLanClient } from '../../lib/lan-client';
import { Customer } from './types';
import { enqueue } from '../../lib/outbox-sync';

export async function fetchCustomersApi(businessId: string, search?: string): Promise<Customer[]> {
  const client = await getLanClient(businessId);
  let path = '/api/v1/customers';
  if (search) path += `?search=${encodeURIComponent(search)}`;

  const data = await client.get<any>(path);
  return Array.isArray(data) ? data : data.items || [];
}

export async function enqueueCustomerCreate(payload: {
  fullName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}): Promise<string> {
  return await enqueue('customer_create', payload);
}
