import { create } from 'zustand';

interface NotificationsState {
  selectedNotificationId: string | null;
  activeCategory: 'all' | 'customers' | 'gov' | 'marketing' | 'business';
  drafts: Record<string, string>;

  setSelectedNotificationId: (id: string | null) => void;
  setActiveCategory: (category: 'all' | 'customers' | 'gov' | 'marketing' | 'business') => void;
  setDraft: (notificationId: string, text: string) => void;
  clearDraft: (notificationId: string) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  selectedNotificationId: null,
  activeCategory: 'all',
  drafts: {},

  setSelectedNotificationId: (selectedNotificationId) => set({ selectedNotificationId }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setDraft: (notificationId, text) =>
    set((state) => ({
      drafts: { ...state.drafts, [notificationId]: text },
    })),
  clearDraft: (notificationId) =>
    set((state) => {
      const next = { ...state.drafts };
      delete next[notificationId];
      return { drafts: next };
    }),
}));
