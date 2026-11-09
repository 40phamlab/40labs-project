// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#notifications]
import { getLanClient } from '../../lib/lan-client';
import { StaffNotificationItem, StaffRosterMember } from './types';

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

export async function fetchNotificationsApi(businessId: string, cursor?: string): Promise<{ items: StaffNotificationItem[]; nextCursor: string | null }> {
  const client = await getLanClient(businessId);
  let path = '/api/v1/staff-notifications';
  if (cursor) {
    path += `?cursor=${encodeURIComponent(cursor)}`;
  }

  const data = await client.get<any>(path);
  return {
    items: data.items || [],
    nextCursor: data.nextCursor || null,
  };
}

export async function markNotificationReadApi(businessId: string, notificationId: string): Promise<void> {
  const client = await getLanClient(businessId);
  await client.post<void>(`/api/v1/staff-notifications/${notificationId}/read`);
}

export async function sendNotificationApi(
  businessId: string,
  payload: {
    audience: string;
    targetRole?: string | null;
    targetUserId?: string | null;
    severity?: string;
    subject: string;
    body: string;
  }
): Promise<StaffNotificationItem> {
  const client = await getLanClient(businessId);
  const idempotencyKey = generateUuid();
  return await client.post<StaffNotificationItem>('/api/v1/staff-notifications', payload, {
    'Idempotency-Key': idempotencyKey,
  });
}

export async function fetchStaffRosterApi(businessId: string): Promise<StaffRosterMember[]> {
  const client = await getLanClient(businessId);
  const data = await client.get<any>('/api/v1/staff/roster');
  return Array.isArray(data) ? data : data.items || [];
}
