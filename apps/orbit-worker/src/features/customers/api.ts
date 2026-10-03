// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import { getServerCredential } from '../../lib/secure-store';
import { Customer } from './types';
import { enqueue } from '../../lib/outbox-sync';

export async function fetchCustomersApi(businessId: string, search?: string): Promise<Customer[]> {
  const server = await getServerCredential(businessId);
  if (!server) throw new Error('No server credential');

  let url = `${server.endpoint}/api/v1/customers?`;
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  url += params.toString();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${server.credential}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch customers: ${response.status}`);
  }

  const data = await response.json();
  return data || [];
}

export async function enqueueCustomerCreate(payload: {
  fullName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}): Promise<string> {
  return await enqueue('customer_create', payload);
}
