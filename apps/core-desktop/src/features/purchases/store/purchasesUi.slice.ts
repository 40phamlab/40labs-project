// [PHASE: marketplace-preview — Purchases shell]
import { create } from 'zustand';

export type PurchasesTabId = 'stores' | 'recently' | 'pending' | 'completed';

const STORAGE_KEY_SEARCH_OPEN = '40labs_purchases_search_open';

interface PurchasesUiState {
  activeTab: PurchasesTabId;
  selectedSupplierId: string | null;
  searchText: string;
  selectedOrderId: string | null;
  isDrawerOpen: boolean;
  searchPanelOpen: boolean;

  setActiveTab: (tab: PurchasesTabId) => void;
  setSelectedSupplierId: (id: string | null) => void;
  setSearchText: (text: string) => void;
  setSelectedOrderId: (id: string | null) => void;
  setDrawerOpen: (isOpen: boolean) => void;
  setSearchPanelOpen: (open: boolean) => void;
  toggleSearchPanel: () => void;
}

const getInitialSearchOpen = () => {
  const saved = localStorage.getItem(STORAGE_KEY_SEARCH_OPEN);
  if (saved !== null) {
    return saved === 'true';
  }
  // Default open if window width >= 1200px, otherwise collapsed
  if (typeof window !== 'undefined') {
    return window.innerWidth >= 1200;
  }
  return true;
};

export const usePurchasesUiStore = create<PurchasesUiState>((set, get) => ({
  activeTab: 'stores',
  selectedSupplierId: null,
  searchText: '',
  selectedOrderId: null,
  isDrawerOpen: false,
  searchPanelOpen: getInitialSearchOpen(),

  setActiveTab: (activeTab) => set({ activeTab, selectedSupplierId: null }),
  setSelectedSupplierId: (selectedSupplierId) => set({ selectedSupplierId }),
  setSearchText: (searchText) => set({ searchText }),
  setSelectedOrderId: (selectedOrderId) => set({ selectedOrderId, isDrawerOpen: !!selectedOrderId }),
  setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen, selectedOrderId: isDrawerOpen ? null : null }),
  setSearchPanelOpen: (searchPanelOpen) => {
    localStorage.setItem(STORAGE_KEY_SEARCH_OPEN, String(searchPanelOpen));
    set({ searchPanelOpen });
  },
  toggleSearchPanel: () => {
    const next = !get().searchPanelOpen;
    localStorage.setItem(STORAGE_KEY_SEARCH_OPEN, String(next));
    set({ searchPanelOpen: next });
  },
}));
