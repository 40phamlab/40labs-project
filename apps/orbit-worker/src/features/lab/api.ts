// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import { getLanClient } from '../../lib/lan-client';
import { LabOrder } from './types';
import { enqueue } from '../../lib/outbox-sync';

export async function fetchLabOrdersApi(businessId: string): Promise<LabOrder[]> {
  const client = await getLanClient(businessId);
  const data = await client.get<any>('/api/v1/lab/orders');
  return Array.isArray(data) ? data : data.items || [];
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
