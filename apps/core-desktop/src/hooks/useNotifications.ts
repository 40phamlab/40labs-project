import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Notification, NotificationMessage, MessageAttachment } from '@40labs/types';
import { notificationsApi, CreateNotificationPayload, SendMessagePayload, SaveAttachmentPayload } from '../api';
import { notificationKeys } from './queryKeys';
import { useNotificationsStore } from '../stores/useNotificationsStore';

export type { CreateNotificationPayload, SendMessagePayload, SaveAttachmentPayload };

export function useNotifications() {
  const queryClient = useQueryClient();
  const { selectedNotificationId, setSelectedNotificationId, activeCategory, setActiveCategory } = useNotificationsStore();

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

  const createNotificationMutation = useMutation({
    mutationFn: async (payload: CreateNotificationPayload) => {
      return notificationsApi.create(payload);
    },
    onSuccess: (newNotif) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      setSelectedNotificationId(newNotif.id);
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

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return notificationsApi.delete(id); // soft-delete
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  return {
    notifications,
    isLoading,
    isError,
    error,
    refetch,

    selectedNotificationId,
    setSelectedNotificationId,
    activeCategory,
    setActiveCategory,

    createNotification: (payload: CreateNotificationPayload) =>
      createNotificationMutation.mutateAsync(payload),
    markAsRead: (id: string) => markAsReadMutation.mutateAsync(id),
    archiveNotification: (id: string) => archiveNotificationMutation.mutateAsync(id),
    deleteNotification: (id: string) => deleteNotificationMutation.mutateAsync(id),

    isCreating: createNotificationMutation.isPending,
  };
}

export function useNotificationMessages(notificationId: string | null) {
  const queryClient = useQueryClient();

  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery<NotificationMessage[]>({
    queryKey: notificationKeys.messages(notificationId || 'none'),
    queryFn: async () => {
      if (!notificationId) return [];
      return notificationsApi.getMessages(notificationId);
    },
    enabled: Boolean(notificationId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      return notificationsApi.sendMessage(payload);
    },
    onMutate: async (newMsgPayload) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.messages(newMsgPayload.notificationId) });
      const previousMessages = queryClient.getQueryData<NotificationMessage[]>(notificationKeys.messages(newMsgPayload.notificationId)) || [];

      const optimisticMsg: NotificationMessage = {
        id: `opt_${Date.now()}`,
        workspace_id: previousMessages[0]?.workspace_id || 'ws_010101',
        branch_id: previousMessages[0]?.branch_id || 'br_010101',
        notification_id: newMsgPayload.notificationId,
        direction: 'outgoing',
        content_type: newMsgPayload.contentType || 'text',
        body: newMsgPayload.body,
        html_content: newMsgPayload.htmlContent || null,
        status: 'queued',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attachments: [],
      };

      queryClient.setQueryData(notificationKeys.messages(newMsgPayload.notificationId), [...previousMessages, optimisticMsg]);
      return { previousMessages };
    },
    onError: (_err, newMsgPayload, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(notificationKeys.messages(newMsgPayload.notificationId), context.previousMessages);
      }
    },
    onSettled: (_data, _error, newMsgPayload) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.messages(newMsgPayload.notificationId) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const saveAttachmentMutation = useMutation({
    mutationFn: async (payload: SaveAttachmentPayload) => {
      return notificationsApi.saveAttachment(payload);
    },
  });

  return {
    messages,
    isLoading,
    refetch,
    sendMessage: (payload: SendMessagePayload) => sendMessageMutation.mutateAsync(payload),
    saveAttachment: (payload: SaveAttachmentPayload) => saveAttachmentMutation.mutateAsync(payload),
    isSending: sendMessageMutation.isPending,
  };
}
