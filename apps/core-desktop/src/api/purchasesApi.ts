import type { PurchaseOrder, Supplier } from '@40labs/types';
import { initialPurchaseOrders, initialSuppliers, WORKSPACE_ID, BRANCH_ID } from '../devData';

export interface CreatePurchaseOrderLine {
  medicine_id: string;
  quantity: number;
  unit_cost: number;
}

let purchaseOrdersStore: PurchaseOrder[] = [...initialPurchaseOrders];
let suppliersStore: Supplier[] = [...initialSuppliers];

export const purchasesApi = {
  getPurchaseOrders: (): PurchaseOrder[] => [...purchaseOrdersStore],

  getSuppliers: (): Supplier[] => [...suppliersStore],

  createPurchaseOrder: (
    supplierId: string,
    lines: CreatePurchaseOrderLine[]
  ): PurchaseOrder => {
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

  approvePurchaseOrder: (poId: string): PurchaseOrder | null => {
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
};
