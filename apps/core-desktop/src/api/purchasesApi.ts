import type { PurchaseOrder, Supplier } from '@40labs/types';
import { initialPurchaseOrders, initialSuppliers, WORKSPACE_ID, BRANCH_ID } from '../devData';
import { isUsingTauriIpc, invokeCommand } from './client';

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
  list: async (): Promise<PurchaseOrder[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<PurchaseOrder[]>('get_purchase_orders');
    }
    return [...purchaseOrdersStore];
  },
  listPurchaseOrders: (): Promise<PurchaseOrder[]> => purchasesApi.list(),

  get: async (id: string): Promise<PurchaseOrder | null> => {
    if (isUsingTauriIpc()) {
      const list = await invokeCommand<PurchaseOrder[]>('get_purchase_orders');
      return list.find((po) => po.id === id) || null;
    }
    return purchaseOrdersStore.find((po) => po.id === id) || null;
  },

  create: async (supplierId: string, lines: CreatePurchaseOrderLine[]): Promise<PurchaseOrder> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<PurchaseOrder>('create_purchase_order', {
        payload: {
          supplierId,
          lines: lines.map((l) => ({
            medicineId: l.medicine_id,
            quantity: l.quantity,
            unitCost: l.unit_cost,
          })),
        },
      });
    }

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
      lines: lines.map((l, i) => ({
        id: `poline_${Date.now()}_${i}`,
        purchase_order_id: `po_${Date.now()}`,
        medicine_id: l.medicine_id,
        quantity: l.quantity,
        unit_cost: l.unit_cost,
      })),
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

  approve: async (poId: string): Promise<PurchaseOrder | null> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<PurchaseOrder>('approve_purchase_order', { id: poId });
    }

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

  listSuppliers: async (): Promise<Supplier[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Supplier[]>('get_suppliers');
    }
    return [...suppliersStore];
  },

  getSupplier: async (id: string): Promise<Supplier | null> => {
    if (isUsingTauriIpc()) {
      const list = await invokeCommand<Supplier[]>('get_suppliers');
      return list.find((s) => s.id === id) || null;
    }
    return suppliersStore.find((s) => s.id === id) || null;
  },

  // Backwards compatibility aliases
  getPurchaseOrders: (): Promise<PurchaseOrder[]> => purchasesApi.list(),
  getSuppliers: (): Promise<Supplier[]> => purchasesApi.listSuppliers(),
  createPurchaseOrder: (supplierId: string, lines: CreatePurchaseOrderLine[]): Promise<PurchaseOrder> =>
    purchasesApi.create(supplierId, lines),
  approvePurchaseOrder: (poId: string): Promise<PurchaseOrder | null> => purchasesApi.approve(poId),
};

export const purchases = purchasesApi;
