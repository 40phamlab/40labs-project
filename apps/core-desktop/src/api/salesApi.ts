import type { Sale, SaleLine, FiscalReceipt } from '@40labs/types';
import { initialSales, initialFiscalReceipts, WORKSPACE_ID, BRANCH_ID } from '../devData';

export interface CreateSalePayload {
  customerId: string | null;
  lines: Omit<SaleLine, 'id'>[];
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'credit';
  discountAmount: number;
}

let salesStore: Sale[] = [...initialSales];
let fiscalReceiptsStore: FiscalReceipt[] = [...initialFiscalReceipts];

export const salesApi = {
  getSales: (): Sale[] => [...salesStore],

  getFiscalReceipts: (): FiscalReceipt[] => [...fiscalReceiptsStore],

  createSale: (payload: CreateSalePayload): Sale => {
    const now = new Date().toISOString();
    const saleId = `sale_${Date.now()}`;

    const lines: SaleLine[] = payload.lines.map((line, index) => ({
      ...line,
      id: `saleline_${Date.now()}_${index}`,
    }));

    const subtotal = lines.reduce((acc, l) => acc + l.subtotal, 0);
    const grandTotal = Math.max(0, subtotal - payload.discountAmount);

    const newSale: Sale = {
      id: saleId,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      customer_id: payload.customerId,
      lines,
      payment_method: payload.paymentMethod,
      discount_amount: payload.discountAmount,
      discount_authorized_by_user_id: payload.discountAmount > 0 ? 'user_001' : null,
      tax_amount: 0,
      grand_total: grandTotal,
      currency: 'TZS',
      synced_at: null,
    };

    salesStore = [newSale, ...salesStore];
    return newSale;
  },
};
