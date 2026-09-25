import type { AuditLogEntry } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, daysAgoIso } from '../constants';

export const initialAuditLog: AuditLogEntry[] = [
  {
    id: 'audit_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    action: 'stock_adjustment',
    performed_by_user_id: 'user_003',
    target_entity_type: 'InventoryItem',
    target_entity_id: 'inv_001',
    metadata: { delta: -5, reason: 'Damaged in storage' },
    created_at: daysAgoIso(2),
  },
  {
    id: 'audit_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    action: 'discount_authorization',
    performed_by_user_id: 'user_001',
    target_entity_type: 'Sale',
    target_entity_id: 'sale_001',
    metadata: { amount: 0 },
    created_at: daysAgoIso(1),
  },
];
