import { create } from 'zustand';
import type { PurchaseOrder, Supplier } from '@40labs/types';
import { mockPurchaseOrders, mockSuppliers, WORKSPACE_ID, BRANCH_ID } from '../lib/mockData.ts';

interface PurchasesState {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  selectedPOId: string | null;

  setSelectedPOId: (id: string | null) => void;
  createPurchaseOrder: (supplierId: string, lines: { medicine_id: string; quantity: number; unit_cost: number }[]) => PurchaseOrder;
  approvePurchaseOrder: (poId: string) => void;
}

export const usePurchasesStore = create<PurchasesState>((set) => ({
  purchaseOrders: mockPurchaseOrders,
  suppliers: mockSuppliers,
  selectedPOId: null,

  setSelectedPOId: (selectedPOId) => set({ selectedPOId }),

  createPurchaseOrder: (supplierId, lines) => {
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

    set((state) => ({
      purchaseOrders: [newPO, ...state.purchaseOrders],
      selectedPOId: newPO.id,
    }));

    return newPO;
  },

  approvePurchaseOrder: (poId) => set((state) => {
    const now = new Date().toISOString();
    return {
      purchaseOrders: state.purchaseOrders.map((po) =>
        po.id === poId
          ? { ...po, status: 'completed', approved_by_user_id: 'user_001', submitted_at: now, updated_at: now }
          : po
      ),
    };
  }),
}));
