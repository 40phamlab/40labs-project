import type { BackupSchedule, BackupRecord, ScheduleChannel } from '@40labs/types';
import { initialBackupSchedule, initialBackupHistory, WORKSPACE_ID, BRANCH_ID } from '../devData';

export interface UpdateBackupSchedulePayload {
  frequency?: 'daily' | 'weekly' | 'monthly';
  channel?: ScheduleChannel;
}

let scheduleStore: BackupSchedule = { ...initialBackupSchedule };
let historyStore: BackupRecord[] = [...initialBackupHistory];

export const backupApi = {
  getSchedule: async (): Promise<BackupSchedule> => {
    return { ...scheduleStore };
  },

  updateSchedule: async (payload: UpdateBackupSchedulePayload): Promise<BackupSchedule> => {
    scheduleStore = {
      ...scheduleStore,
      ...payload,
      updated_at: new Date().toISOString(),
    };
    return { ...scheduleStore };
  },

  runBackup: async (destination?: ScheduleChannel): Promise<BackupRecord> => {
    const now = new Date().toISOString();
    const newRecord: BackupRecord = {
      id: `bk_rec_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      triggered_by: 'manual',
      status: 'completed',
      size_bytes: 43500000,
      destination: destination || scheduleStore.channel,
    };
    historyStore = [newRecord, ...historyStore];
    scheduleStore = {
      ...scheduleStore,
      last_run_at: now,
      updated_at: now,
    };
    return newRecord;
  },

  listHistory: async (): Promise<BackupRecord[]> => {
    return [...historyStore];
  },
};

export const backup = backupApi;
