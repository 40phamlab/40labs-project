import type { AuditLogEntry } from '@40labs/types';
import { initialAuditLog } from '../devData';

let auditLogStore: AuditLogEntry[] = [...initialAuditLog];

export const auditApi = {
  getAuditLog: (): AuditLogEntry[] => [...auditLogStore],
};
