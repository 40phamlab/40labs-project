import { create } from 'zustand';
import type { MedicineWithInventory } from '@40labs/types';
import { inventoryApi, AddStockPayload } from '../api/inventoryApi';

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

  addItem: (payload: AddStockPayload) => void;
  deleteItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: inventoryApi.getMedicinesWithInventory(),
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

  addItem: (payload) => {
    const newItem = inventoryApi.addStock(payload);
    set((state) => ({
      items: [newItem, ...state.items],
      isModalOpen: false,
    }));
  },

  deleteItem: (id) => {
    inventoryApi.deleteItem(id);
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  updateQuantity: (id, delta) => {
    inventoryApi.updateQuantity(id, delta);
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty, updated_at: new Date().toISOString() };
      }),
    }));
  },
}));
