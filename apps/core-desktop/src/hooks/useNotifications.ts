import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Notification, NotificationMessage, ThreadSummary } from '@40labs/types';
import { notificationsApi, CreateNotificationPayload, SendMessagePayload, SaveAttachmentPayload, FindOrCreateThreadPayload, AppendThreadMessagePayload } from '../api';
import { notificationKeys } from './queryKeys';
import { useNotificationsStore } from '../stores/useNotificationsStore';
import { authApi, AuthStatusResponse } from '../api/authApi';
import { parseAuthError } from '../api/authErrors';

export type { CreateNotificationPayload, SendMessagePayload, SaveAttachmentPayload, FindOrCreateThreadPayload, AppendThreadMessagePayload };

export function useNotifications() {
  const queryClient = useQueryClient();
  const { selectedNotificationId, setSelectedNotificationId, activeCategory, setActiveCategory } = useNotificationsStore();

  const { data: authStatus } = useQuery<AuthStatusResponse>({
    queryKey: ['auth_status'],
    queryFn: () => authApi.status(),
    staleTime: 10000,
  });

  const isAuthenticated = Boolean(authStatus?.session);
  const isLocked = Boolean(authStatus?.session?.locked);
  const isEnabled = isAuthenticated && !isLocked;

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Notification[]>({
    queryKey: notificationKeys.list(),
    queryFn: async () => notificationsApi.list(),
    enabled: isEnabled,
    refetchInterval: isEnabled ? 3000 : false,
    retry: (failureCount, error: any) => {
      const parsed = parseAuthError(error);
      if (parsed.code === 'SESSION_REQUIRED' || parsed.code === 'SESSION_LOCKED') {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

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

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return notificationsApi.delete(id);
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

export function useThreads(includeArchived = false) {
  const { data: authStatus } = useQuery<AuthStatusResponse>({
    queryKey: ['auth_status'],
    queryFn: () => authApi.status(),
    staleTime: 10000,
  });

  const isAuthenticated = Boolean(authStatus?.session);
  const isLocked = Boolean(authStatus?.session?.locked);
  const isEnabled = isAuthenticated && !isLocked;

  const {
    data: threads = [],
    isLoading,
    refetch,
  } = useQuery<ThreadSummary[]>({
    queryKey: ['threads', includeArchived],
    queryFn: async () => notificationsApi.getThreads(includeArchived),
    enabled: isEnabled,
    refetchInterval: isEnabled ? 3000 : false,
  });

  return {
    threads,
    isLoading,
    refetch,
  };
}

export function useThreadMessages(threadId: string | null) {
  const queryClient = useQueryClient();

  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery<NotificationMessage[]>({
    queryKey: ['thread_messages', threadId || 'none'],
    queryFn: async () => {
      if (!threadId) return [];
      return notificationsApi.getThreadMessages(threadId);
    },
    enabled: Boolean(threadId),
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: AppendThreadMessagePayload) => {
      return notificationsApi.appendThreadMessage(payload);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['thread_messages', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
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
    sendMessage: (payload: AppendThreadMessagePayload) => sendMessageMutation.mutateAsync(payload),
    saveAttachment: (payload: SaveAttachmentPayload) => saveAttachmentMutation.mutateAsync(payload),
    isSending: sendMessageMutation.isPending,
  };
}

export function useSendThreadMessage() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (payload: AppendThreadMessagePayload) => {
      return notificationsApi.appendThreadMessage(payload);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['thread_messages', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
  return {
    sendMessage: (payload: AppendThreadMessagePayload) => mutation.mutateAsync(payload),
    isSending: mutation.isPending,
  };
}

export function useMarkThreadRead() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (threadId: string) => {
      return notificationsApi.markThreadRead(threadId);
    },
    onSuccess: (_data, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['thread_messages', threadId] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
  return {
    markThreadRead: (threadId: string) => mutation.mutateAsync(threadId),
  };
}

export function useArchiveThread() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (threadId: string) => {
      return notificationsApi.archiveThread(threadId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
  return {
    archiveThread: (threadId: string) => mutation.mutateAsync(threadId),
  };
}

export function useFindOrCreateThread() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (payload: FindOrCreateThreadPayload) => {
      return notificationsApi.findOrCreateThread(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
  return {
    findOrCreateThread: (payload: FindOrCreateThreadPayload) => mutation.mutateAsync(payload),
  };
}

export function useNotificationMessages(notificationId: string | null) {
  return useThreadMessages(notificationId);
}
