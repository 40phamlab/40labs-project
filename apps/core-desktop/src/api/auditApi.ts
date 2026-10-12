import type { AuditLogEntry } from '@40labs/types';
import { initialAuditLog, WORKSPACE_ID, BRANCH_ID } from '../devData';
import { isUsingTauriIpc, invokeCommand } from './client';

let auditLogStore: AuditLogEntry[] = [...initialAuditLog];

export const auditApi = {
  list: async (): Promise<AuditLogEntry[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<AuditLogEntry[]>('get_audit_logs');
    }
    return [...auditLogStore];
  },

  get: (id: string): AuditLogEntry | null => {
    return auditLogStore.find((a) => a.id === id) || null;
  },

  recordEntry: (
    entry: Omit<AuditLogEntry, 'id' | 'workspace_id' | 'branch_id' | 'created_at'>
  ): AuditLogEntry => {
    const newEntry: AuditLogEntry = {
      id: `audit_dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: new Date().toISOString(),
      ...entry,
    };
    auditLogStore = [newEntry, ...auditLogStore];
    return newEntry;
  },

  // Backwards compatibility aliases
  getAuditLog: (): Promise<AuditLogEntry[]> => auditApi.list(),
};

export const audit = auditApi;
