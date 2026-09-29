import { BaseEntity, BusinessId, ISODateString } from './common';
import { MessageChannel } from './channel';

export type NotificationCategory = 'gov' | 'customers' | 'marketing' | 'business';
export type NotificationSourceType = 'system' | 'remote';
export type NotificationStatus = 'unread' | 'read' | 'archived';
export type MessageContentType = 'text' | 'markdown' | 'html' | 'image' | 'audio' | 'file' | 'link';

export interface NotificationAttachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video' | 'link';
  name: string;
  size?: string;
  url?: string;
}

export interface Notification extends BaseEntity {
  category: NotificationCategory;
  source_type: NotificationSourceType;
  sender_name: string;
  sender_business_id: BusinessId | null; // set when a real Business sent it (Gov org, 40Labs, another pharmacy)
  subject: string;
  body: string;
  status: NotificationStatus;
  channel: MessageChannel;
  content_type?: MessageContentType;
  html_content?: string | null;
  plain_text_content?: string | null;
  attachments?: NotificationAttachment[];
  related_entity_type: string | null; // optional deep link, e.g. "PurchaseOrder"
  related_entity_id: string | null;
  received_at: ISODateString;
}
