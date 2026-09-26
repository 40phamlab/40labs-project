import { BaseEntity, ISODateString } from './common';

export type ScheduleCategory = 'reports' | 'marketing' | 'patients' | 'gov';
export type ScheduleType = 'report' | 'reminder' | 'refill';
export type ScheduleChannel = 'sms' | 'whatsapp' | 'in_app' | 'google_drive' | 'gmail';
export type RecipientScope =
  | 'all' | 'customers' | 'staff' | 'subscribers' | 'pharmacies' | 'custom';
export type ScheduleStatus = 'pending' | 'sent' | 'failed' | 'cancelled';
export type RepeatInterval = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Schedule extends BaseEntity {
  title: string;
  category: ScheduleCategory;
  schedule_type: ScheduleType;
  channels: ScheduleChannel[];
  recipient_scope: RecipientScope;
  recipient_ids: string[] | null;
  message_body: string;
  attachments: string[] | null;
  scheduled_at: ISODateString;
  repeat_interval: RepeatInterval;
  repeat_until: ISODateString | null;
  status: ScheduleStatus;
  sent_count: number;
  pending_count: number;
  failure_count: number;
}
