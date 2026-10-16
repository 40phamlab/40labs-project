import type { BackupSchedule, BackupRecord, ScheduleChannel } from '@40labs/types';
import { initialBackupSchedule, initialBackupHistory, WORKSPACE_ID, BRANCH_ID } from '../devData';
import { invokeCommand, isTauriAvailable } from './client';

export interface UpdateBackupSchedulePayload {
  frequency?: 'daily' | 'weekly' | 'monthly';
  channel?: ScheduleChannel;
}

export interface BackupFileEntry {
  relative_path: string;
  size_bytes: number;
  sha256: string;
}

export interface BackupManifest {
  manifest_version: string;
  app_version: string;
  schema_version: number;
  created_at: string;
  business_id: string;
  business_name: string;
  workspace_id: string;
  branch_id: string;
  exported_by_user_id?: string;
  record_counts: Record<string, number>;
  file_entries: BackupFileEntry[];
}

export interface BackupPreview {
  business_id: string;
  business_name: string;
  workspace_id: string;
  branch_id: string;
  created_at: string;
  app_version: string;
  schema_version: number;
  is_schema_compatible: boolean;
  total_records: number;
  record_counts: Record<string, number>;
  file_count: number;
  total_file_bytes: number;
  checksum_valid: boolean;
}

export interface BackupExportResult {
  archive_path: string;
  size_bytes: number;
  business_id: string;
  business_name: string;
  total_records: number;
  created_at: string;
}

export interface RestoreResult {
  business_id: string;
  business_name: string;
  total_records_restored: number;
  files_restored: number;
  safety_backup_path: string;
  restored_at: string;
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

  exportDisasterRecoveryPack: async (
    destinationPath: string,
    password: string
  ): Promise<BackupExportResult> => {
    if (isTauriAvailable()) {
      return await invokeCommand<BackupExportResult>('export_disaster_recovery_pack', {
        destinationPath,
        password,
      });
    }
    throw new Error('Disaster Recovery Export is only available in 40Labs Core Desktop application.');
  },

  previewDisasterRecoveryPack: async (
    archivePath: string,
    password: string
  ): Promise<BackupPreview> => {
    if (isTauriAvailable()) {
      return await invokeCommand<BackupPreview>('preview_disaster_recovery_pack', {
        archivePath,
        password,
      });
    }
    throw new Error('Disaster Recovery Preview is only available in 40Labs Core Desktop application.');
  },

  restoreDisasterRecoveryPack: async (
    archivePath: string,
    password: string
  ): Promise<RestoreResult> => {
    if (isTauriAvailable()) {
      return await invokeCommand<RestoreResult>('restore_disaster_recovery_pack', {
        archivePath,
        password,
      });
    }
    throw new Error('Disaster Recovery Restore is only available in 40Labs Core Desktop application.');
  },
};

export const backup = backupApi;
