import { create } from 'zustand';
import type { MedicineWithInventory } from '@40labs/types';
import { mockMedicines, mockInventoryItems, WORKSPACE_ID, BRANCH_ID } from '../lib/mockData.ts';

export interface AddStockPayload {
  medicineName: string;
  genericName?: string;
  category: string;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  lowStockThreshold: number;
}

interface InventoryState {
  items: MedicineWithInventory[];
  searchTerm: string;
  filterExpired: boolean;
  isModalOpen: boolean;
  graphVisible: boolean;
  searchPanelOpen: boolean;

  // Actions
  setSearchTerm: (term: string) => void;
  setFilterExpired: (value: boolean) => void;
  setModalOpen: (open: boolean) => void;
  setGraphVisible: (visible: boolean) => void;
  setSearchPanelOpen: (open: boolean) => void;

  addItem: (payload: AddStockPayload) => void;
  deleteItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
}

function initInitialData(): MedicineWithInventory[] {
  return mockInventoryItems.flatMap((item) => {
    const medicine = mockMedicines.find((m) => m.id === item.medicine_id);
    if (!medicine) return [];
    return [{ ...item, medicine }];
  });
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: initInitialData(),
  searchTerm: '',
  filterExpired: false,
  isModalOpen: false,
  graphVisible: true,
  searchPanelOpen: false,

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setFilterExpired: (filterExpired) => set({ filterExpired }),
  setModalOpen: (isModalOpen) => set({ isModalOpen }),
  setGraphVisible: (graphVisible) => set({ graphVisible }),
  setSearchPanelOpen: (searchPanelOpen) => set({ searchPanelOpen }),

  addItem: (payload) =>
    set((state) => {
      const medicineId = `med_dev_${Date.now()}`;
      const inventoryId = `inv_dev_${Date.now()}`;
      const now = new Date().toISOString();

      const newItem: MedicineWithInventory = {
        id: inventoryId,
        workspace_id: WORKSPACE_ID,
        branch_id: BRANCH_ID,
        created_at: now,
        updated_at: now,
        medicine_id: medicineId,
        batch_number: payload.batchNumber,
        expiry_date: payload.expiryDate,
        buy_price: payload.buyPrice,
        sell_price: payload.sellPrice,
        quantity: payload.quantity,
        low_stock_threshold: payload.lowStockThreshold,
        cold_chain_required: false,
        medicine: {
          id: medicineId,
          workspace_id: WORKSPACE_ID,
          branch_id: BRANCH_ID,
          created_at: now,
          updated_at: now,
          name: payload.medicineName,
          generic_name: payload.genericName || null,
          category: payload.category,
          unit: payload.unit,
          is_controlled_substance: false,
          requires_prescription: false,
        },
      };

      return {
        items: [newItem, ...state.items],
        isModalOpen: false,
      };
    }),

  deleteItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  updateQuantity: (id, delta) =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty, updated_at: new Date().toISOString() };
      }),
    })),
}));
