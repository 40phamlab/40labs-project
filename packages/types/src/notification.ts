import { BaseEntity, BusinessId, ISODateString } from './common';

export type NotificationCategory = 'gov' | 'customers' | 'marketing' | 'business';
export type NotificationSourceType = 'system' | 'remote';
export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface Notification extends BaseEntity {
  category: NotificationCategory;
  source_type: NotificationSourceType;
  sender_name: string;
  sender_business_id: BusinessId | null; // set when a real Business sent it (Gov org, 40Labs, another pharmacy)
  subject: string;
  body: string;
  status: NotificationStatus;
  related_entity_type: string | null; // optional deep link, e.g. "PurchaseOrder"
  related_entity_id: string | null;
  received_at: ISODateString;
}
