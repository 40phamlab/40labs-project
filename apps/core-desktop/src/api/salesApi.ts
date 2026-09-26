import type { Sale, SaleLine, FiscalReceipt } from '@40labs/types';
import { initialSales, initialFiscalReceipts, WORKSPACE_ID, BRANCH_ID } from '../devData/index.ts';

export interface CreateSalePayload {
  customerId: string | null;
  lines: Omit<SaleLine, 'id'>[];
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'credit';
  discountAmount: number;
}

export interface UpdateSalePayload {
  paymentMethod?: 'cash' | 'mobile_money' | 'card' | 'credit';
  discountAmount?: number;
  syncedAt?: string | null;
}

let salesStore: Sale[] = [...initialSales];
let fiscalReceiptsStore: FiscalReceipt[] = [...initialFiscalReceipts];

export const salesApi = {
  list: (): Sale[] => [...salesStore],

  get: (id: string): Sale | null => {
    return salesStore.find((s) => s.id === id) || null;
  },

  create: (payload: CreateSalePayload): Sale => {
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

  update: (id: string, updates: UpdateSalePayload): Sale | null => {
    const index = salesStore.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const existing = salesStore[index];
    const updatedSale: Sale = {
      ...existing,
      payment_method: updates.paymentMethod ?? existing.payment_method,
      discount_amount: updates.discountAmount ?? existing.discount_amount,
      synced_at: updates.syncedAt !== undefined ? updates.syncedAt : existing.synced_at,
      updated_at: new Date().toISOString(),
    };

    salesStore[index] = updatedSale;
    return updatedSale;
  },

  delete: (id: string): boolean => {
    const initialLen = salesStore.length;
    salesStore = salesStore.filter((s) => s.id !== id);
    return salesStore.length < initialLen;
  },

  listFiscalReceipts: (): FiscalReceipt[] => [...fiscalReceiptsStore],

  // Backwards compatibility aliases
  getSales: (): Sale[] => salesApi.list(),
  getFiscalReceipts: (): FiscalReceipt[] => salesApi.listFiscalReceipts(),
  createSale: (payload: CreateSalePayload): Sale => salesApi.create(payload),
};

export const sales = salesApi;
