// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#notifications]
import { getServerCredential } from '../../lib/secure-store';
import { StaffNotificationItem, StaffRosterMember } from './types';

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function fetchNotificationsApi(businessId: string, cursor?: string): Promise<{ items: StaffNotificationItem[]; nextCursor: string | null }> {
  const server = await getServerCredential(businessId);
  if (!server) throw new Error('No server credential');

  let url = `${server.endpoint}/api/v1/staff-notifications`;
  if (cursor) {
    url += `?cursor=${encodeURIComponent(cursor)}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${server.credential}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status}`);
  }

  const data = await response.json();
  return {
    items: data.items || [],
    nextCursor: data.nextCursor || null,
  };
}

export async function markNotificationReadApi(businessId: string, notificationId: string): Promise<void> {
  const server = await getServerCredential(businessId);
  if (!server) throw new Error('No server credential');

  const response = await fetch(`${server.endpoint}/api/v1/staff-notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${server.credential}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to mark notification read: ${response.status}`);
  }
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
  const server = await getServerCredential(businessId);
  if (!server) throw new Error('No server credential');

  const idempotencyKey = generateUuid();

  const response = await fetch(`${server.endpoint}/api/v1/staff-notifications`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${server.credential}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to send notification (${response.status}): ${errText}`);
  }

  return await response.json();
}

export async function fetchStaffRosterApi(businessId: string): Promise<StaffRosterMember[]> {
  const server = await getServerCredential(businessId);
  if (!server) throw new Error('No server credential');

  const response = await fetch(`${server.endpoint}/api/v1/staff/roster`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${server.credential}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch staff roster: ${response.status}`);
  }

  return await response.json();
}
