import type { AuditLogEntry } from '@40labs/types';
import { initialAuditLog } from '../devData';

let auditLogStore: AuditLogEntry[] = [...initialAuditLog];

export const auditApi = {
  list: (): AuditLogEntry[] => [...auditLogStore],

  get: (id: string): AuditLogEntry | null => {
    return auditLogStore.find((a) => a.id === id) || null;
  },

  // Backwards compatibility aliases
  getAuditLog: (): AuditLogEntry[] => auditApi.list(),
};

export const audit = auditApi;
