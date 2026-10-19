// [PHASE: MVP]
import { BaseEntity, ISODateString } from './common';

export type ScheduleCategory = 'reports' | 'marketing' | 'patients' | 'gov';
export type ScheduleType = 'report' | 'reminder' | 'refill' | 'broadcast';
export type ScheduleChannel = 'sms' | 'whatsapp' | 'in_app' | 'google_drive' | 'gmail';
export type RecipientScope =
  | 'all' | 'customers' | 'staff' | 'subscribers' | 'pharmacies' | 'custom';
export type ScheduleStatus = 'pending' | 'queued_offline' | 'sending' | 'sent' | 'partial' | 'failed' | 'cancelled';
export type RepeatInterval = 'none' | 'daily' | 'weekly' | 'monthly';

export type ReportTabId = 'sales' | 'inventory' | 'customers' | 'purchases' | 'compliance';

export type ReportPeriodToken =
  | 'previous_day' | 'previous_week' | 'previous_month'
  | { readonly from: string; readonly to: string };

export type ScheduleAttachment =
  | { readonly kind: 'report'; readonly report: ReportTabId; readonly period: ReportPeriodToken }
  | { readonly kind: 'file'; readonly file_id: string; readonly name?: string; readonly size?: string };

export interface Schedule extends BaseEntity {
  title: string;
  category: ScheduleCategory;
  schedule_type: ScheduleType;
  channels: ScheduleChannel[];
  recipient_scope: RecipientScope;
  recipient_ids: string[] | null;
  message_body: string;
  attachments: (string | ScheduleAttachment)[];
  scheduled_at: ISODateString;
  repeat_interval: RepeatInterval;
  repeat_until: ISODateString | null;
  status: ScheduleStatus;
  enabled: boolean;
  sent_count: number;
  pending_count: number;
  failure_count: number;
}
