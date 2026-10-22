// [PHASE: marketplace-preview — Data foundation]
import { Supplier, PurchaseOrder } from '@40labs/types';

export type OrderChannelResult =
  | { ok: true; sentAt: string; deliveryConfirmed: false }
  | { ok: false; reason: string };

export interface OrderChannel {
  id: string;
  send(order: PurchaseOrder, supplier: Supplier): Promise<OrderChannelResult>;
}
