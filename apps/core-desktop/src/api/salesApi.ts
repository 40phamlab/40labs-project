import type { Sale, SaleLine, FiscalReceipt, DispensingInstruction } from '@40labs/types';
import { initialSales, initialFiscalReceipts, WORKSPACE_ID, BRANCH_ID } from '../devData';
import { isUsingTauriIpc, invokeCommand } from './client';

export interface CreateSalePayload {
  customerId: string | null;
  lines: Omit<SaleLine, 'id'>[];
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'credit';
  discountAmount: number;
  idempotencyKey?: string;
}

export interface UpdateSalePayload {
  paymentMethod?: 'cash' | 'mobile_money' | 'card' | 'credit';
  discountAmount?: number;
  syncedAt?: string | null;
}

let salesStore: Sale[] = [...initialSales];
let fiscalReceiptsStore: FiscalReceipt[] = [...initialFiscalReceipts];
let instructionsStore: Map<string, DispensingInstruction[]> = new Map();

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
    const key = payload.idempotencyKey || `idem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (isUsingTauriIpc()) {
      const items = payload.lines.map((line) => ({
        inventoryItemId: line.inventory_item_id,
        quantity: line.quantity,
      }));
      return invokeCommand<Sale>('create_sale', {
        payload: {
          customerId: payload.customerId,
          items,
          paymentMethod: payload.paymentMethod,
          discountAmount: payload.discountAmount,
          idempotencyKey: key,
        },
      });
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

  getInstructions: async (saleId: string): Promise<DispensingInstruction[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<DispensingInstruction[]>('get_sale_instructions', { saleId });
    }
    return instructionsStore.get(saleId) || [];
  },

  updateInstructions: async (saleId: string, instructions: DispensingInstruction[]): Promise<DispensingInstruction[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<DispensingInstruction[]>('update_sale_instructions', { saleId, instructions });
    }
    const existing = instructionsStore.get(saleId) || [];
    const map = new Map(existing.map((i) => [i.sale_line_id, i]));
    for (const inst of instructions) {
      map.set(inst.sale_line_id, inst);
    }
    const updated = Array.from(map.values());
    instructionsStore.set(saleId, updated);
    return updated;
  },

  // Backwards compatibility aliases
  getSales: (): Promise<Sale[]> => salesApi.list(),
  getFiscalReceipts: (): Promise<FiscalReceipt[]> => salesApi.listFiscalReceipts(),
  createSale: (payload: CreateSalePayload): Promise<Sale> => salesApi.create(payload),
};

export const sales = salesApi;
