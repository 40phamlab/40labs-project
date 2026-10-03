// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import { getServerCredential } from '../../lib/secure-store';
import { LabOrder } from './types';
import { enqueue } from '../../lib/outbox-sync';

export async function fetchLabOrdersApi(businessId: string): Promise<LabOrder[]> {
  const server = await getServerCredential(businessId);
  if (!server) throw new Error('No server credential');

  const response = await fetch(`${server.endpoint}/api/v1/lab/orders`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${server.credential}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch lab orders: ${response.status}`);
  }

  const data = await response.json();
  return data || [];
}

export async function enqueueCollectSample(payload: {
  labOrderId: string;
  sampleLabel: string;
}): Promise<string> {
  return await enqueue('lab_sample', payload);
}

export async function enqueueRecordResult(payload: {
  labOrderId: string;
  resultNotes: string;
  status?: string;
}): Promise<string> {
  return await enqueue('lab_result', payload);
}
