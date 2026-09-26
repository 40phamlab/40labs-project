import { create } from 'zustand';
import type { PurchaseOrder, Supplier } from '@40labs/types';
import { purchases } from '../api';

interface PurchasesState {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  selectedPOId: string | null;

  setSelectedPOId: (id: string | null) => void;
  createPurchaseOrder: (
    supplierId: string,
    lines: { medicine_id: string; quantity: number; unit_cost: number }[]
  ) => PurchaseOrder;
  approvePurchaseOrder: (poId: string) => void;
}

export const usePurchasesStore = create<PurchasesState>((set) => ({
  purchaseOrders: purchases.list(),
  suppliers: purchases.listSuppliers(),
  selectedPOId: null,

  setSelectedPOId: (selectedPOId) => set({ selectedPOId }),

  createPurchaseOrder: (supplierId, lines) => {
    const newPO = purchases.create(supplierId, lines);

    set((state) => ({
      purchaseOrders: [newPO, ...state.purchaseOrders],
      selectedPOId: newPO.id,
    }));

    return newPO;
  },

  approvePurchaseOrder: (poId) => {
    const updatedPO = purchases.approve(poId);
    if (updatedPO) {
      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((po) =>
          po.id === poId ? updatedPO : po
        ),
      }));
    }
  },
}));
