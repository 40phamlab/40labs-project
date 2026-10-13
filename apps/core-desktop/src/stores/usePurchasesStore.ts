import { create } from 'zustand';
import type { PurchaseOrder, Supplier } from '@40labs/types';
import { initialPurchaseOrders, initialSuppliers } from '../devData';
import { purchases } from '../api';

interface PurchasesState {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  selectedPOId: string | null;

  setSelectedPOId: (id: string | null) => void;
  createPurchaseOrder: (
    supplierId: string,
    lines: { medicine_id: string; quantity: number; unit_cost: number }[]
  ) => Promise<PurchaseOrder>;
  approvePurchaseOrder: (poId: string) => Promise<void>;
}

export const usePurchasesStore = create<PurchasesState>((set) => ({
  purchaseOrders: [...initialPurchaseOrders],
  suppliers: [...initialSuppliers],
  selectedPOId: null,

  setSelectedPOId: (selectedPOId) => set({ selectedPOId }),

  createPurchaseOrder: async (supplierId, lines) => {
    const newPO = await purchases.create(supplierId, lines);

    set((state) => ({
      purchaseOrders: [newPO, ...state.purchaseOrders],
      selectedPOId: newPO.id,
    }));

    return newPO;
  },

  approvePurchaseOrder: async (poId) => {
    const updatedPO = await purchases.approve(poId);
    if (updatedPO) {
      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((po) =>
          po.id === poId ? updatedPO : po
        ),
      }));
    }
  },
}));
