import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@40labs/types';
import { notificationsApi, CreateNotificationPayload } from '../api';
import { notificationKeys } from './queryKeys';

export type { CreateNotificationPayload };

export function useNotifications() {
  const queryClient = useQueryClient();

  // Query
  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Notification[]>({
    queryKey: notificationKeys.list(),
    queryFn: async () => notificationsApi.list(),
  });

  // Mutations
  const createNotificationMutation = useMutation({
    mutationFn: async (payload: CreateNotificationPayload) => {
      return notificationsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return notificationsApi.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const archiveNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return notificationsApi.archive(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const updateNotificationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Notification> }) => {
      return notificationsApi.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return notificationsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  // UI state
  const [selectedNotificationId, setSelectedNotificationId] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const sendReply = React.useCallback(
    async (id: string, replyText: string) => {
      const target = notifications.find((n) => n.id === id);
      if (!target) return;

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const replyFormatted = `\n\n--- You replied (${timestamp}) ---\n${replyText}`;
      const updatedBody = (target.body || '') + replyFormatted;

      await updateNotificationMutation.mutateAsync({
        id,
        updates: { body: updatedBody, status: 'read' },
      });
    },
    [notifications, updateNotificationMutation]
  );

  return {
    notifications,
    isLoading,
    isError,
    error,
    refetch,

    // UI state
    selectedNotificationId,
    setSelectedNotificationId,
    activeCategory,
    setActiveCategory,

    // Actions via Mutations
    createNotification: (payload: CreateNotificationPayload) =>
      createNotificationMutation.mutateAsync(payload),
    markAsRead: (id: string) => markAsReadMutation.mutateAsync(id),
    archiveNotification: (id: string) => archiveNotificationMutation.mutateAsync(id),
    updateNotification: (id: string, updates: Partial<Notification>) =>
      updateNotificationMutation.mutateAsync({ id, updates }),
    deleteNotification: (id: string) => deleteNotificationMutation.mutateAsync(id),
    sendReply,

    isCreating: createNotificationMutation.isPending,
  };
}
