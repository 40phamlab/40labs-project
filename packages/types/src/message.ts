import { BaseEntity, ISODateString } from './common';

export type MessageDirection = 'incoming' | 'outgoing';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type AttachmentKind = 'image' | 'file' | 'audio';

export interface NotificationMessage extends BaseEntity {
  notification_id: string;
  direction: MessageDirection;
  content_type: string;
  body: string;
  html_content?: string | null;
  status: MessageStatus;
  sent_at: ISODateString;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment extends BaseEntity {
  message_id: string;
  kind: AttachmentKind;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  sha256: string;
  duration_ms?: number | null;
}
