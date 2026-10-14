import type { Notification, NotificationMessage, MessageAttachment, MessageChannel, Thread, CounterpartyType } from '@40labs/types';
import { initialNotifications, initialMessages, initialAttachments, WORKSPACE_ID, BRANCH_ID } from '../devData';
import { isUsingTauriIpc, invokeCommand } from './client';

export interface CreateNotificationPayload {
  category: 'customers' | 'gov' | 'marketing' | 'business';
  sender_name: string;
  sender_address?: string;
  body: string;
  channel?: MessageChannel;
  recipient_customer_id?: string;
}

export interface SendMessagePayload {
  notificationId: string;
  body: string;
  contentType?: string;
  htmlContent?: string;
  attachmentIds?: string[];
}

export interface FindOrCreateThreadPayload {
  counterpartyType: CounterpartyType;
  counterpartyKey: string;
  counterpartyId?: string | null;
  displayName: string;
}

export interface AppendThreadMessagePayload {
  threadId: string;
  direction?: 'incoming' | 'outgoing';
  contentType?: string;
  body: string;
  htmlContent?: string;
  attachmentIds?: string[];
}

export interface SaveAttachmentPayload {
  workspaceId?: string;
  branchId?: string;
  messageId: string;
  kind: 'image' | 'file' | 'audio';
  fileName: string;
  mimeType: string;
  bytes?: number[];
  sourcePath?: string;
}

export interface ExportResult {
  path: string;
  folder: string;
}

let notificationsStore: Notification[] = [...initialNotifications];
let messagesStore: NotificationMessage[] = [...initialMessages];
let attachmentsStore: MessageAttachment[] = [...initialAttachments];
let threadsStore: Thread[] = [];
let threadMessagesStore: Map<string, NotificationMessage[]> = new Map();

const attachmentPreviewUrls = new Map<string, string>();

export async function resolveAttachmentPreviewUrl(attachmentId: string): Promise<string> {
  const cached = attachmentPreviewUrls.get(attachmentId);
  if (cached) return cached;
  if (!isUsingTauriIpc()) throw new Error('Attachment preview is unavailable');
  const path = await invokeCommand<string>('resolve_attachment_path', { attachmentId });
  const { convertFileSrc } = await import('@tauri-apps/api/core');
  return convertFileSrc(path);
}

export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Notification[]>('get_notifications');
    }
    return [...notificationsStore];
  },

  get: async (id: string): Promise<Notification | null> => {
    if (isUsingTauriIpc()) {
      const list = await invokeCommand<Notification[]>('get_notifications');
      return list.find((n) => n.id === id) || null;
    }
    return notificationsStore.find((n) => n.id === id) || null;
  },

  getMessages: async (notificationId: string): Promise<NotificationMessage[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<NotificationMessage[]>('get_notification_messages', { notificationId });
    }
    return messagesStore.filter((m) => m.notification_id === notificationId);
  },

  getThreads: async (includeArchived = false): Promise<Thread[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Thread[]>('get_threads', { includeArchived });
    }
    return threadsStore
      .filter((t) => includeArchived || !t.archived)
      .map((t) => {
        const msgs = threadMessagesStore.get(t.id) || [];
        const unread_count = msgs.filter((m) => m.direction === 'incoming' && m.status !== 'read').length;
        return { ...t, unread_count };
      })
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  },

  getThreadMessages: async (threadId: string): Promise<NotificationMessage[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<NotificationMessage[]>('get_thread_messages', { threadId });
    }
    const msgs = threadMessagesStore.get(threadId) || [];
    return [...msgs].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
  },

  findOrCreateThread: async (payload: FindOrCreateThreadPayload): Promise<Thread> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Thread>('find_or_create_thread', { payload: {
        counterparty_type: payload.counterpartyType,
        counterparty_key: payload.counterpartyKey,
        counterparty_id: payload.counterpartyId || null,
        display_name: payload.displayName,
      }});
    }
    let existing = threadsStore.find((t) => t.workspace_id === WORKSPACE_ID && t.counterparty_key === payload.counterpartyKey);
    if (existing) {
      existing.display_name = payload.displayName;
      return existing;
    }
    const now = new Date().toISOString();
    const newThread: Thread = {
      id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      counterparty_type: payload.counterpartyType,
      counterparty_key: payload.counterpartyKey,
      counterparty_id: payload.counterpartyId || null,
      display_name: payload.displayName,
      last_message_at: now,
      last_message_preview: null,
      archived: false,
      unread_count: 0,
      created_at: now,
      updated_at: now,
    };
    threadsStore.push(newThread);
    threadMessagesStore.set(newThread.id, []);
    return newThread;
  },

  appendThreadMessage: async (payload: AppendThreadMessagePayload): Promise<NotificationMessage> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<NotificationMessage>('append_thread_message', { payload: {
        thread_id: payload.threadId,
        direction: payload.direction || 'outgoing',
        content_type: payload.contentType || 'text',
        body: payload.body,
        html_content: payload.htmlContent || null,
        attachment_ids: payload.attachmentIds || null,
      }});
    }
    const now = new Date().toISOString();
    const msg: NotificationMessage = {
      id: `msg_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      notification_id: `notif_${Date.now()}`,
      thread_id: payload.threadId,
      direction: payload.direction || 'outgoing',
      content_type: (payload.contentType as any) || 'text',
      body: payload.body,
      html_content: payload.htmlContent || null,
      status: 'read',
      sent_at: now,
      created_at: now,
      updated_at: now,
      attachments: attachmentsStore.filter((a) => payload.attachmentIds?.includes(a.id)),
    };
    const list = threadMessagesStore.get(payload.threadId) || [];
    threadMessagesStore.set(payload.threadId, [...list, msg]);

    const thread = threadsStore.find((t) => t.id === payload.threadId);
    if (thread) {
      thread.last_message_at = now;
      thread.last_message_preview = payload.body;
      thread.archived = false;
      thread.updated_at = now;
    }
    return msg;
  },

  markThreadRead: async (threadId: string): Promise<void> => {
    if (isUsingTauriIpc()) {
      await invokeCommand<void>('mark_thread_read', { threadId });
      return;
    }
    const list = threadMessagesStore.get(threadId) || [];
    for (const m of list) {
      if (m.direction === 'incoming') m.status = 'read';
    }
  },

  archiveThread: async (threadId: string): Promise<void> => {
    if (isUsingTauriIpc()) {
      await invokeCommand<void>('archive_thread', { threadId });
      return;
    }
    const t = threadsStore.find((th) => th.id === threadId);
    if (t) {
      t.archived = true;
      t.updated_at = new Date().toISOString();
    }
  },

  create: async (payload: CreateNotificationPayload): Promise<Notification> => {
    // Stable key mapping per requirement 5
    let cType: CounterpartyType = 'customer';
    let cKey = '';
    let cId: string | null = null;
    let dispName = payload.sender_name;

    if (payload.recipient_customer_id) {
      cType = 'customer';
      cKey = `customer:${payload.recipient_customer_id}`;
      cId = payload.recipient_customer_id;
    } else if (payload.category === 'gov') {
      cType = 'gov';
      const upper = payload.sender_name.toUpperCase();
      if (upper.includes('TMDA')) cKey = 'gov:TMDA';
      else if (upper.includes('TRA')) cKey = 'gov:TRA';
      else cKey = `gov:${lowerTrim(payload.sender_name)}`;
    } else if (payload.category === 'business') {
      cType = 'business';
      cKey = `business:${lowerTrim(payload.sender_name)}`;
    } else if (payload.category === 'marketing') {
      cType = 'marketing';
      cKey = `marketing:${lowerTrim(payload.sender_name)}`;
    } else {
      cType = 'customer';
      cKey = `customer:walk_in_${lowerTrim(payload.sender_name)}`;
    }

    const thread = await notificationsApi.findOrCreateThread({
      counterpartyType: cType,
      counterpartyKey: cKey,
      counterpartyId: cId,
      displayName: dispName,
    });

    await notificationsApi.appendThreadMessage({
      threadId: thread.id,
      direction: 'incoming',
      body: payload.body,
    });

    const now = new Date().toISOString();
    const notif: Notification = {
      id: `notif_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      category: payload.category,
      source_type: 'remote',
      sender_name: payload.sender_name,
      sender_business_id: null,
      subject: payload.recipient_customer_id ? `Conversation with ${payload.sender_name}` : `${payload.category.toUpperCase()} Notification`,
      body: payload.body,
      status: 'unread',
      channel: payload.channel || 'amob',
      related_entity_type: payload.recipient_customer_id ? 'customer' : null,
      related_entity_id: payload.recipient_customer_id || null,
      received_at: now,
      thread_id: thread.id,
    };
    notificationsStore = [notif, ...notificationsStore];
    return notif;
  },

  sendMessage: async (payload: SendMessagePayload): Promise<NotificationMessage> => {
    // Backward compatibility helper
    // Find thread associated with notification or create fallback
    const notif = notificationsStore.find((n) => n.id === payload.notificationId);
    const threadId = notif?.thread_id || 'thread_default';
    return notificationsApi.appendThreadMessage({
      threadId,
      direction: 'outgoing',
      body: payload.body,
      contentType: payload.contentType,
      htmlContent: payload.htmlContent,
      attachmentIds: payload.attachmentIds,
    });
  },

  markAsRead: async (id: string): Promise<Notification | null> => {
    const notif = notificationsStore.find((n) => n.id === id);
    if (notif?.thread_id) {
      await notificationsApi.markThreadRead(notif.thread_id);
    }
    if (isUsingTauriIpc()) {
      return invokeCommand<Notification>('mark_notification_read', { id });
    }
    const index = notificationsStore.findIndex((n) => n.id === id);
    if (index === -1) return null;
    notificationsStore[index] = {
      ...notificationsStore[index],
      status: 'read',
      updated_at: new Date().toISOString(),
    };
    return notificationsStore[index];
  },

  archive: async (id: string): Promise<Notification | null> => {
    const notif = notificationsStore.find((n) => n.id === id);
    if (notif?.thread_id) {
      await notificationsApi.archiveThread(notif.thread_id);
    }
    if (isUsingTauriIpc()) {
      return invokeCommand<Notification>('archive_notification', { id });
    }
    const index = notificationsStore.findIndex((n) => n.id === id);
    if (index === -1) return null;
    notificationsStore[index] = {
      ...notificationsStore[index],
      status: 'archived',
      updated_at: new Date().toISOString(),
    };
    return notificationsStore[index];
  },

  delete: async (id: string): Promise<boolean> => {
    const res = await notificationsApi.archive(id);
    return res !== null;
  },

  saveAttachment: async (payload: SaveAttachmentPayload): Promise<MessageAttachment> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<MessageAttachment>('save_attachment', {
        payload: {
          workspace_id: payload.workspaceId || WORKSPACE_ID,
          branch_id: payload.branchId || BRANCH_ID,
          message_id: payload.messageId,
          kind: payload.kind,
          file_name: payload.fileName,
          mime_type: payload.mimeType,
          bytes: payload.bytes || null,
          source_path: payload.sourcePath || null,
        },
      });
    }

    const now = new Date().toISOString();
    const att: MessageAttachment = {
      id: `att_${Date.now()}`,
      workspace_id: payload.workspaceId || WORKSPACE_ID,
      branch_id: payload.branchId || BRANCH_ID,
      message_id: payload.messageId,
      kind: payload.kind,
      file_name: payload.fileName,
      mime_type: payload.mimeType,
      size_bytes: payload.bytes?.length || (payload.sourcePath ? 2048 : 1024),
      storage_path: `attachments/${WORKSPACE_ID}/att_${Date.now()}`,
      sha256: 'mock_sha256_hash',
      created_at: now,
      updated_at: now,
    };
    if (payload.bytes) {
      const blob = new Blob([new Uint8Array(payload.bytes)], { type: payload.mimeType });
      attachmentPreviewUrls.set(att.id, URL.createObjectURL(blob));
    }
    attachmentsStore = [...attachmentsStore, att];
    return att;
  },

  exportAttachment: async (attachmentId: string, category: 'attachments' | 'exports' | 'reports' | 'lab_results' = 'attachments'): Promise<ExportResult> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<ExportResult>('export_attachment', {
        attachmentId,
        category,
      });
    }
    return {
      path: `/mock/Documents/40Labs/${category}/${attachmentId}`,
      folder: category,
    };
  },

  exportAttachmentToPath: async (attachmentId: string, destPath: string): Promise<string> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<string>('export_attachment_to_path', {
        attachmentId,
        destPath,
      });
    }
    return destPath;
  },

  getNotifications: (): Promise<Notification[]> => notificationsApi.list(),
  archiveNotification: (id: string): Promise<Notification | null> => notificationsApi.archive(id),
};

function lowerTrim(s: string): string {
  return s.trim().toLowerCase();
}

export const notifications = notificationsApi;
