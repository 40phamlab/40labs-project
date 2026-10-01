import type { Notification, NotificationMessage, MessageAttachment, MessageChannel } from '@40labs/types';
import { initialNotifications, initialMessages, initialAttachments, WORKSPACE_ID, BRANCH_ID } from '../devData';
import { isUsingTauriIpc, invokeCommand } from './client';

export interface CreateNotificationPayload {
  category: 'customers' | 'gov' | 'marketing' | 'business';
  sender_name: string;
  sender_address?: string;
  body: string;
  channel?: MessageChannel;
}

export interface SendMessagePayload {
  notificationId: string;
  body: string;
  contentType?: string;
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

let notificationsStore: Notification[] = [...initialNotifications];
let messagesStore: NotificationMessage[] = [...initialMessages];
let attachmentsStore: MessageAttachment[] = [...initialAttachments];

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

  create: async (payload: CreateNotificationPayload): Promise<Notification> => {
    const now = new Date().toISOString();
    const notifId = `notif_${Date.now()}`;
    const newNotif: Notification = {
      id: notifId,
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
      channel: payload.channel || 'amob',
      related_entity_type: null,
      related_entity_id: null,
      received_at: now,
    };

    const newMsg: NotificationMessage = {
      id: `msg_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      notification_id: notifId,
      direction: 'incoming',
      content_type: 'text',
      body: payload.body,
      status: 'read',
      sent_at: now,
      created_at: now,
      updated_at: now,
      attachments: [],
    };

    notificationsStore = [newNotif, ...notificationsStore];
    messagesStore = [...messagesStore, newMsg];
    return newNotif;
  },

  sendMessage: async (payload: SendMessagePayload): Promise<NotificationMessage> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<NotificationMessage>('send_notification_message', {
        payload: {
          notification_id: payload.notificationId,
          body: payload.body,
          content_type: payload.contentType || 'text',
          html_content: payload.htmlContent || null,
          attachment_ids: payload.attachmentIds || null,
        },
      });
    }

    const now = new Date().toISOString();
    const newMsg: NotificationMessage = {
      id: `msg_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      notification_id: payload.notificationId,
      direction: 'outgoing',
      content_type: payload.contentType || 'text',
      body: payload.body,
      html_content: payload.htmlContent || null,
      status: 'queued',
      sent_at: now,
      created_at: now,
      updated_at: now,
      attachments: attachmentsStore.filter((a) => payload.attachmentIds?.includes(a.id)),
    };

    messagesStore = [...messagesStore, newMsg];

    // Update notification body preview / status
    const target = notificationsStore.find((n) => n.id === payload.notificationId);
    if (target) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      target.body = `${target.body}\n\n--- You replied (${timeStr}) ---\n${payload.body}`;
      target.updated_at = now;
      target.status = 'read';
    }

    return newMsg;
  },

  markAsRead: async (id: string): Promise<Notification | null> => {
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
    // Soft-delete: mark as archived
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
      size_bytes: payload.bytes?.length || 1024,
      storage_path: `attachments/${WORKSPACE_ID}/att_${Date.now()}`,
      sha256: 'mock_sha256_hash',
      created_at: now,
      updated_at: now,
    };
    attachmentsStore = [...attachmentsStore, att];
    return att;
  },

  exportAttachment: async (attachmentId: string, destPath?: string): Promise<string> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<string>('export_attachment', {
        attachmentId,
        destPath: destPath || null,
      });
    }
    return destPath || `/mock/exported/${attachmentId}`;
  },

  // Aliases
  getNotifications: (): Promise<Notification[]> => notificationsApi.list(),
  archiveNotification: (id: string): Promise<Notification | null> => notificationsApi.archive(id),
};

export const notifications = notificationsApi;
