import type { Notification } from '@40labs/types';
import { initialNotifications, WORKSPACE_ID, BRANCH_ID } from '../devData';

export interface CreateNotificationPayload {
  category: 'customers' | 'gov' | 'marketing' | 'business';
  sender_name: string;
  sender_address?: string;
  body: string;
}

let notificationsStore: Notification[] = [...initialNotifications];

export const notificationsApi = {
  list: (): Notification[] => [...notificationsStore],

  get: (id: string): Notification | null => {
    return notificationsStore.find((n) => n.id === id) || null;
  },

  create: (payload: CreateNotificationPayload): Notification => {
    const now = new Date().toISOString();
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      category: payload.category,
      source_type: 'remote',
      sender_name: payload.sender_name,
      sender_business_id: null,
      subject: `${payload.category.toUpperCase()} Notification`,
      body: payload.body,
      status: 'unread',
      related_entity_type: null,
      related_entity_id: null,
      received_at: now,
    };

    notificationsStore = [newNotif, ...notificationsStore];
    return newNotif;
  },

  update: (id: string, updates: Partial<Notification>): Notification | null => {
    const index = notificationsStore.findIndex((n) => n.id === id);
    if (index === -1) return null;

    const updated: Notification = {
      ...notificationsStore[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    notificationsStore[index] = updated;
    return updated;
  },

  markAsRead: (id: string): Notification | null => {
    return notificationsApi.update(id, { status: 'read' });
  },

  archive: (id: string): Notification | null => {
    return notificationsApi.update(id, { status: 'archived' });
  },

  delete: (id: string): boolean => {
    const initialLen = notificationsStore.length;
    notificationsStore = notificationsStore.filter((n) => n.id !== id);
    return notificationsStore.length < initialLen;
  },

  // Backwards compatibility aliases
  getNotifications: (): Notification[] => notificationsApi.list(),
  archiveNotification: (id: string): Notification | null => notificationsApi.archive(id),
};

export const notifications = notificationsApi;
