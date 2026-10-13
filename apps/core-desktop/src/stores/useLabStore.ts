import { create } from 'zustand';
import type { LabOrder, LabSample, LabResult, TestCatalogEntry } from '@40labs/types';
import { initialLabOrders, initialLabSamples } from '../devData';
import { lab } from '../api';

interface LabState {
  orders: LabOrder[];
  samples: LabSample[];
  results: LabResult[];
  catalog: TestCatalogEntry[];
  selectedOrderId: string | null;
  activeTab: 'orders' | 'samples' | 'catalog';

  setSelectedOrderId: (id: string | null) => void;
  setActiveTab: (tab: 'orders' | 'samples' | 'catalog') => void;

  createOrder: (customerId: string, testCatalogId: string) => Promise<LabOrder>;
  collectSample: (orderId: string, sampleLabel: string) => Promise<LabSample>;
  enterResult: (orderId: string, value: string, referenceRange: string, isOutOfRange: boolean) => Promise<LabResult>;
  fetchResultsAndCatalog: () => Promise<void>;
}

export const useLabStore = create<LabState>((set) => ({
  orders: [...initialLabOrders],
  samples: [...initialLabSamples],
  results: [],
  catalog: [],
  selectedOrderId: null,
  activeTab: 'orders',

  setSelectedOrderId: (selectedOrderId) => set({ selectedOrderId }),
  setActiveTab: (activeTab) => set({ activeTab }),

  fetchResultsAndCatalog: async () => {
    const [results, catalog] = await Promise.all([
      lab.listResults(),
      lab.listCatalog(),
    ]);
    set({ results, catalog });
  },

  createOrder: async (customerId, testCatalogId) => {
    const newOrder = await lab.createOrder(customerId, testCatalogId);

    set((state) => ({
      orders: [newOrder, ...state.orders],
      selectedOrderId: newOrder.id,
    }));

    return newOrder;
  },

  collectSample: async (orderId, sampleLabel) => {
    const newSample = await lab.collectSample(orderId, sampleLabel);

    set((state) => ({
      samples: [newSample, ...state.samples],
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'sample_collected' } : o
      ),
    }));

    return newSample;
  },

  enterResult: async (orderId, value, referenceRange, isOutOfRange) => {
    const newResult = await lab.enterResult(orderId, value, referenceRange, isOutOfRange);

    set((state) => ({
      results: [newResult, ...state.results],
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'report_ready' } : o
      ),
    }));

    return newResult;
  },
}));
