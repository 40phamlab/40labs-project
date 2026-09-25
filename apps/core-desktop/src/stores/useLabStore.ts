import { create } from 'zustand';
import type { LabOrder, LabSample, LabResult, TestCatalogEntry } from '@40labs/types';
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

  createOrder: (customerId: string, testCatalogId: string) => LabOrder;
  collectSample: (orderId: string, sampleLabel: string) => LabSample;
  enterResult: (orderId: string, value: string, referenceRange: string, isOutOfRange: boolean) => LabResult;
}

export const useLabStore = create<LabState>((set) => ({
  orders: lab.listOrders(),
  samples: lab.listSamples(),
  results: lab.listResults(),
  catalog: lab.listCatalog(),
  selectedOrderId: null,
  activeTab: 'orders',

  setSelectedOrderId: (selectedOrderId) => set({ selectedOrderId }),
  setActiveTab: (activeTab) => set({ activeTab }),

  createOrder: (customerId, testCatalogId) => {
    const newOrder = lab.createOrder(customerId, testCatalogId);

    set((state) => ({
      orders: [newOrder, ...state.orders],
      selectedOrderId: newOrder.id,
    }));

    return newOrder;
  },

  collectSample: (orderId, sampleLabel) => {
    const newSample = lab.collectSample(orderId, sampleLabel);
    const now = new Date().toISOString();

    set((state) => ({
      samples: [newSample, ...state.samples],
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'sample_collected', updated_at: now } : o
      ),
    }));

    return newSample;
  },

  enterResult: (orderId, value, referenceRange, isOutOfRange) => {
    const newResult = lab.enterResult(orderId, value, referenceRange, isOutOfRange);
    const now = new Date().toISOString();

    set((state) => ({
      results: [newResult, ...state.results],
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'report_ready', updated_at: now } : o
      ),
    }));

    return newResult;
  },
}));
