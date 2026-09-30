import type { BackupSchedule, BackupRecord } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, daysAgoIso, daysFromNowIso } from '../constants';

export const initialBackupSchedule: BackupSchedule = {
  id: 'bk_sch_001',
  workspace_id: WORKSPACE_ID,
  branch_id: BRANCH_ID,
  created_at: daysAgoIso(90),
  updated_at: daysAgoIso(1),
  frequency: 'daily',
  channel: 'google_drive',
  last_run_at: daysAgoIso(1),
  next_run_at: daysFromNowIso(1),
};

export const initialBackupHistory: BackupRecord[] = [
  {
    id: 'bk_rec_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(1),
    updated_at: daysAgoIso(1),
    triggered_by: 'schedule',
    status: 'completed',
    size_bytes: 42850000,
    destination: 'google_drive',
  },
  {
    id: 'bk_rec_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(2),
    updated_at: daysAgoIso(2),
    triggered_by: 'manual',
    status: 'completed',
    size_bytes: 41200000,
    destination: 'gmail',
  },
  {
    id: 'bk_rec_003',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(7),
    updated_at: daysAgoIso(7),
    triggered_by: 'schedule',
    status: 'completed',
    size_bytes: 38900000,
    destination: 'google_drive',
  },
];
