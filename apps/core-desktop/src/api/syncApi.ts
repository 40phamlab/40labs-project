import type { SyncRunResult, SyncStatus } from '@40labs/types';
import { invokeCommand } from './client';

/** Cloud sync is device-authenticated and only uploads the server-supported outbox entities. */
export const syncApi = {
  status: (): Promise<SyncStatus> => invokeCommand('cloud_sync_status'),
  runNow: (): Promise<SyncRunResult> => invokeCommand('cloud_sync_now'),
};
