import { create } from 'zustand';
import type { Notification } from '@40labs/types';
import { mockNotifications } from '../lib/mockData.ts';

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
  notifications: mockNotifications,
  selectedNotificationId: null,
  activeCategory: 'all',

  setSelectedNotificationId: (selectedNotificationId) => set({ selectedNotificationId }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, status: 'read', updated_at: new Date().toISOString() } : n
    ),
  })),

  archiveNotification: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, status: 'archived', updated_at: new Date().toISOString() } : n
    ),
  })),
}));
