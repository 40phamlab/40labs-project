// [PHASE: marketplace-preview — Purchases shell]
import { create } from 'zustand';

export type PurchasesTabId = 'stores' | 'recently' | 'pending' | 'completed';

interface PurchasesUiState {
  activeTab: PurchasesTabId;
  selectedSupplierId: string | null;
  searchText: string;
  selectedOrderId: string | null;
  isDrawerOpen: boolean;

  setActiveTab: (tab: PurchasesTabId) => void;
  setSelectedSupplierId: (id: string | null) => void;
  setSearchText: (text: string) => void;
  setSelectedOrderId: (id: string | null) => void;
  setDrawerOpen: (isOpen: boolean) => void;
}

export const usePurchasesUiStore = create<PurchasesUiState>((set) => ({
  activeTab: 'stores',
  selectedSupplierId: null,
  searchText: '',
  selectedOrderId: null,
  isDrawerOpen: false,

  setActiveTab: (activeTab) => set({ activeTab, selectedSupplierId: null }),
  setSelectedSupplierId: (selectedSupplierId) => set({ selectedSupplierId }),
  setSearchText: (searchText) => set({ searchText }),
  setSelectedOrderId: (selectedOrderId) => set({ selectedOrderId, isDrawerOpen: !!selectedOrderId }),
  setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen, selectedOrderId: isDrawerOpen ? null : null }),
}));
