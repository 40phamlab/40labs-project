import { BaseEntity } from './common';

export interface Medicine extends BaseEntity {
  name: string;
  generic_name: string | null;
  category: string;
  unit: string; // e.g. "pack", "tablet", "bottle"
  is_controlled_substance: boolean; // MVP-blocking regulatory field — must exist now
  requires_prescription: boolean;
}

export interface InventoryItem extends BaseEntity {
  medicine_id: string;
  batch_number: string;
  expiry_date: string; // ISO date
  buy_price: number;   // TZS
  sell_price: number;  // TZS
  quantity: number;
  low_stock_threshold: number;
  // Reserved — Good Storage & Distribution Practices Regs 2021, not required
  // for MVP dispensing flow, but field must exist so it's not a later migration.
  cold_chain_required: boolean;
}

export interface StockAdjustment extends BaseEntity {
  inventory_item_id: string;
  adjusted_by_user_id: string; // PIN-gated action, must reference the authorizing user
  delta: number; // positive or negative
  reason: string;
  audit_log_id: string; // every adjustment MUST produce an AuditLog entry
}