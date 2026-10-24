export type SyncEntity = 'business' | 'inventory_item' | 'price' | 'price_history' | 'daily_summary';
export type SyncOp = 'upsert' | 'delete';
export type OutboxStatus = 'pending' | 'inflight' | 'done' | 'failed';
export type AckStatus = 'applied' | 'stale' | 'rejected';

export interface OutboxChange {
  id: string;
  workspace_id: string;
  branch_id: string;
  entity: SyncEntity;
  entity_id: string;
  op: SyncOp;
  payload: string; // JSON string
  version: number;
  status: OutboxStatus;
  attempts: number;
  last_error?: string | null;
  created_at: string;
}

export interface ChangeAck {
  change_id: string;
  status: AckStatus;
  reason?: string | null;
}

export interface SyncStatus {
  state: 'synced' | 'pending' | 'offline';
  pending: number;
  last_ack_at?: string | null;
}
