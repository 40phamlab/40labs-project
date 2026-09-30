import { BaseEntity } from './common';
import { ScheduleChannel } from './schedule';

export interface BackupSchedule extends BaseEntity {
  frequency: 'daily' | 'weekly' | 'monthly';
  channel: ScheduleChannel;
  last_run_at: string | null;
  next_run_at: string | null;
}

export interface BackupRecord extends BaseEntity {
  triggered_by: 'schedule' | 'manual';
  status: 'completed' | 'failed' | 'in_progress';
  size_bytes: number | null;
  destination: ScheduleChannel;
}
