import { BaseEntity } from './common';
import { BusinessId } from './common';

export type PurchaseOrderStatus = 'draft' | 'pending' | 'completed' | 'cancelled';

export interface Supplier extends BaseEntity {
  business_id: BusinessId; // a Business with the `supplier` role scope
  // Verification badges are READ-ONLY here — the review workflow lives in
  // Admin Web App (PRD P0-15). Never write to these fields from core-desktop.
  tmda_verified: boolean;
  tra_verified: boolean;
}

export interface PurchaseOrder extends BaseEntity {
  supplier_id: string;
  status: PurchaseOrderStatus;
  lines: {
    medicine_id: string;
    quantity: number;
    unit_cost: number;
  }[];
  total_cost: number;
  approved_by_user_id: string | null; // PIN-gated if above owner-set threshold
  submitted_at: string | null; // null while draft/offline-queued
}