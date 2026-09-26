import type { Sale, SaleLine, FiscalReceipt } from '@40labs/types';
import { initialSales, initialFiscalReceipts, WORKSPACE_ID, BRANCH_ID } from '../devData/index.ts';
import { isUsingTauriIpc, invokeCommand } from './client';

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
  list: async (): Promise<Sale[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Sale[]>('get_sales_list');
    }
    return [...salesStore];
  },

  get: async (id: string): Promise<Sale | null> => {
    return salesStore.find((s) => s.id === id) || null;
  },

  create: async (payload: CreateSalePayload): Promise<Sale> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Sale>('create_sale', { payload });
    }

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

  update: async (id: string, updates: UpdateSalePayload): Promise<Sale | null> => {
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

  delete: async (id: string): Promise<boolean> => {
    const initialLen = salesStore.length;
    salesStore = salesStore.filter((s) => s.id !== id);
    return salesStore.length < initialLen;
  },

  listFiscalReceipts: async (): Promise<FiscalReceipt[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<FiscalReceipt[]>('get_fiscal_receipts');
    }
    return [...fiscalReceiptsStore];
  },

  // Backwards compatibility aliases
  getSales: (): Promise<Sale[]> => salesApi.list(),
  getFiscalReceipts: (): Promise<FiscalReceipt[]> => salesApi.listFiscalReceipts(),
  createSale: (payload: CreateSalePayload): Promise<Sale> => salesApi.create(payload),
};

export const sales = salesApi;
