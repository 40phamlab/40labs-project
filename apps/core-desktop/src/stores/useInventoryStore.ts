import { create } from 'zustand';
import type { MedicineWithInventory } from '@40labs/types';
import { inventory, AddStockPayload } from '../api/index.ts';

export type { AddStockPayload };

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

  loadItems: () => Promise<void>;
  addItem: (payload: AddStockPayload) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, delta: number) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
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

  loadItems: async () => {
    const list = await inventory.list();
    set({ items: list });
  },

  addItem: async (payload) => {
    const newItem = await inventory.create(payload);
    set((state) => ({
      items: [newItem, ...state.items],
      isModalOpen: false,
    }));
  },

  deleteItem: async (id) => {
    const success = await inventory.delete(id);
    if (success) {
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    }
  },

  updateQuantity: async (id, delta) => {
    const updated = await inventory.updateQuantity(id, delta);
    if (updated) {
      const refreshed = await inventory.list();
      set({ items: refreshed });
    }
  },
}));
