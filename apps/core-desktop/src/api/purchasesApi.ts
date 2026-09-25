import type { PurchaseOrder, Supplier } from '@40labs/types';
import { initialPurchaseOrders, initialSuppliers, WORKSPACE_ID, BRANCH_ID } from '../devData';

export interface CreatePurchaseOrderLine {
  medicine_id: string;
  quantity: number;
  unit_cost: number;
}

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  lines: CreatePurchaseOrderLine[];
}

let purchaseOrdersStore: PurchaseOrder[] = [...initialPurchaseOrders];
let suppliersStore: Supplier[] = [...initialSuppliers];

export const purchasesApi = {
  list: (): PurchaseOrder[] => [...purchaseOrdersStore],
  listPurchaseOrders: (): PurchaseOrder[] => [...purchaseOrdersStore],

  get: (id: string): PurchaseOrder | null => {
    return purchaseOrdersStore.find((po) => po.id === id) || null;
  },

  create: (supplierId: string, lines: CreatePurchaseOrderLine[]): PurchaseOrder => {
    const now = new Date().toISOString();
    const totalCost = lines.reduce((sum, line) => sum + line.quantity * line.unit_cost, 0);

    const newPO: PurchaseOrder = {
      id: `po_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      supplier_id: supplierId,
      status: 'draft',
      lines,
      total_cost: totalCost,
      approved_by_user_id: null,
      submitted_at: null,
    };

    purchaseOrdersStore = [newPO, ...purchaseOrdersStore];
    return newPO;
  },

  update: (id: string, updates: Partial<PurchaseOrder>): PurchaseOrder | null => {
    const index = purchaseOrdersStore.findIndex((po) => po.id === id);
    if (index === -1) return null;

    const updatedPO: PurchaseOrder = {
      ...purchaseOrdersStore[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    purchaseOrdersStore[index] = updatedPO;
    return updatedPO;
  },

  approve: (poId: string): PurchaseOrder | null => {
    const now = new Date().toISOString();
    const index = purchaseOrdersStore.findIndex((po) => po.id === poId);
    if (index === -1) return null;

    const updatedPO: PurchaseOrder = {
      ...purchaseOrdersStore[index],
      status: 'completed',
      approved_by_user_id: 'user_001',
      submitted_at: now,
      updated_at: now,
    };

    purchaseOrdersStore[index] = updatedPO;
    return updatedPO;
  },

  delete: (id: string): boolean => {
    const initialLen = purchaseOrdersStore.length;
    purchaseOrdersStore = purchaseOrdersStore.filter((po) => po.id !== id);
    return purchaseOrdersStore.length < initialLen;
  },

  listSuppliers: (): Supplier[] => [...suppliersStore],

  getSupplier: (id: string): Supplier | null => {
    return suppliersStore.find((s) => s.id === id) || null;
  },

  // Backwards compatibility aliases
  getPurchaseOrders: (): PurchaseOrder[] => purchasesApi.list(),
  getSuppliers: (): Supplier[] => purchasesApi.listSuppliers(),
  createPurchaseOrder: (supplierId: string, lines: CreatePurchaseOrderLine[]): PurchaseOrder =>
    purchasesApi.create(supplierId, lines),
  approvePurchaseOrder: (poId: string): PurchaseOrder | null => purchasesApi.approve(poId),
};

export const purchases = purchasesApi;
