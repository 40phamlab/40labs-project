import type { Notification } from '@40labs/types';
import { initialNotifications } from '../devData';

let notificationsStore: Notification[] = [...initialNotifications];

export const notificationsApi = {
  getNotifications: (): Notification[] => [...notificationsStore],

  markAsRead: (id: string): Notification | null => {
    const index = notificationsStore.findIndex((n) => n.id === id);
    if (index === -1) return null;

    const updated: Notification = {
      ...notificationsStore[index],
      status: 'read',
      updated_at: new Date().toISOString(),
    };

    notificationsStore[index] = updated;
    return updated;
  },

  archiveNotification: (id: string): Notification | null => {
    const index = notificationsStore.findIndex((n) => n.id === id);
    if (index === -1) return null;

    const updated: Notification = {
      ...notificationsStore[index],
      status: 'archived',
      updated_at: new Date().toISOString(),
    };

    notificationsStore[index] = updated;
    return updated;
  },
};
