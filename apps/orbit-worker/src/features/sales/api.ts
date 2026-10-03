// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import { getServerCredential } from '../../lib/secure-store';
import { SaleResponse, CartItem } from './types';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createSaleApi(
  businessId: string,
  payload: {
    customerId?: string | null;
    items: { inventoryItemId: string; quantity: number }[];
    paymentMethod: string;
    discountAmount?: number;
  },
  idempotencyKey?: string
): Promise<{ sale: SaleResponse; idempotencyKey: string }> {
  const server = await getServerCredential(businessId);
  if (!server) throw new Error('No server credential available (offline or unpaired).');

  const key = idempotencyKey || generateUuid();

  const response = await fetch(`${server.endpoint}/api/v1/sales`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${server.credential}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Sale failed (${response.status}): ${errText}`);
  }

  const sale = await response.json();
  return { sale, idempotencyKey: key };
}
