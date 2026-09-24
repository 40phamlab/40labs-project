import { create } from 'zustand';
import type { LabOrder, LabSample, LabResult, TestCatalogEntry } from '@40labs/types';
import {
  mockLabOrders,
  mockLabSamples,
  mockLabResults,
  mockTestCatalog,
  WORKSPACE_ID,
  BRANCH_ID,
} from '../lib/mockData.ts';

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
  orders: mockLabOrders,
  samples: mockLabSamples,
  results: mockLabResults,
  catalog: mockTestCatalog,
  selectedOrderId: null,
  activeTab: 'orders',

  setSelectedOrderId: (selectedOrderId) => set({ selectedOrderId }),
  setActiveTab: (activeTab) => set({ activeTab }),

  createOrder: (customerId, testCatalogId) => {
    const now = new Date().toISOString();
    const newOrder: LabOrder = {
      id: `labord_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      customer_id: customerId,
      sale_id: null,
      ordered_by_user_id: 'user_001',
      status: 'pending',
      test_catalog_id: testCatalogId,
    };

    set((state) => ({
      orders: [newOrder, ...state.orders],
      selectedOrderId: newOrder.id,
    }));

    return newOrder;
  },

  collectSample: (orderId, sampleLabel) => {
    const now = new Date().toISOString();
    const newSample: LabSample = {
      id: `labsample_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      lab_order_id: orderId,
      collected_by_user_id: 'user_001',
      collected_at: now,
      sample_label: sampleLabel,
      status: 'collected',
    };

    set((state) => ({
      samples: [newSample, ...state.samples],
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'sample_collected', updated_at: now } : o
      ),
    }));

    return newSample;
  },

  enterResult: (orderId, value, referenceRange, isOutOfRange) => {
    const now = new Date().toISOString();
    const newResult: LabResult = {
      id: `labresult_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      lab_order_id: orderId,
      entered_by_user_id: 'user_001',
      value,
      reference_range: referenceRange,
      is_out_of_range: isOutOfRange,
      override_authorized_by_user_id: null,
    };

    set((state) => ({
      results: [newResult, ...state.results],
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'report_ready', updated_at: now } : o
      ),
    }));

    return newResult;
  },
}));
