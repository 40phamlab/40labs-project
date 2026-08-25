import { BaseEntity, Currency } from './common';

export type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'credit';

export interface SaleLine {
  id: string;
  inventory_item_id: string;
  medicine_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  // Superintendent pharmacist record — MVP-blocking regulatory field.
  dispensed_by_user_id: string;
  is_prescription_dispense: boolean;
}

export interface Sale extends BaseEntity {
  customer_id: string | null; // walk-in sales may have no customer record
  lines: SaleLine[];
  payment_method: PaymentMethod;
  discount_amount: number;
  discount_authorized_by_user_id: string | null; // set when discount crosses PIN threshold
  tax_amount: number;
  grand_total: number;
  currency: Currency;
  synced_at: string | null; // null = still queued for Postgres sync
}