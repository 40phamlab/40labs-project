import { BaseEntity } from './common';

export type AuditAction =
  | 'stock_adjustment'
  | 'refund'
  | 'po_approval'
  | 'lab_result_override'
  | 'discount_authorization'
  | 'pin_change'
  | 'password_change'
  | 'device_block'
  | 'device_remove';

// Immutable, append-only. NEVER updated or deleted, at the DB layer, not
// just the API layer. No `updated_at`-driven edit path should ever touch this.
export interface AuditLogEntry {
  id: string;
  workspace_id: string;
  branch_id: string;
  action: AuditAction;
  performed_by_user_id: string;
  target_entity_type: string; // e.g. "InventoryItem", "Sale"
  target_entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}