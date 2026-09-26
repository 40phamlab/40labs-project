import { create } from 'zustand';
import type { Notification } from '@40labs/types';
import { notifications } from '../api';

interface NotificationsState {
  notifications: Notification[];
  selectedNotificationId: string | null;
  activeCategory: 'all' | 'customers' | 'gov' | 'marketing' | 'business';

  setSelectedNotificationId: (id: string | null) => void;
  setActiveCategory: (category: 'all' | 'customers' | 'gov' | 'marketing' | 'business') => void;
  markAsRead: (id: string) => void;
  archiveNotification: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: notifications.list(),
  selectedNotificationId: null,
  activeCategory: 'all',

  setSelectedNotificationId: (selectedNotificationId) => set({ selectedNotificationId }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),

  markAsRead: (id) => {
    const updated = notifications.markAsRead(id);
    if (updated) {
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? updated : n)),
      }));
    }
  },

  archiveNotification: (id) => {
    const updated = notifications.archive(id);
    if (updated) {
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? updated : n)),
      }));
    }
  },
}));
