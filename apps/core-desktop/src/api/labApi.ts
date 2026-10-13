import type {
  LabOrder,
  LabSample,
  LabResult,
  TestCatalogEntry,
  LabOrderStatus,
  LabSampleStatus,
} from '@40labs/types';
import {
  initialLabOrders,
  initialLabSamples,
  initialLabResults,
  initialTestCatalog,
  WORKSPACE_ID,
  BRANCH_ID,
} from '../devData';
import { isUsingTauriIpc, invokeCommand } from './client';

export interface CreateLabOrderPayload {
  customerId: string;
  testCatalogId: string;
}

let ordersStore: LabOrder[] = [...initialLabOrders];
let samplesStore: LabSample[] = [...initialLabSamples];
let resultsStore: LabResult[] = [...initialLabResults];
let catalogStore: TestCatalogEntry[] = [...initialTestCatalog];

export const labApi = {
  // Orders
  list: async (): Promise<LabOrder[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<LabOrder[]>('get_lab_orders');
    }
    return [...ordersStore];
  },
  listOrders: (): Promise<LabOrder[]> => labApi.list(),

  get: async (id: string): Promise<LabOrder | null> => {
    if (isUsingTauriIpc()) {
      const list = await invokeCommand<LabOrder[]>('get_lab_orders');
      return list.find((o) => o.id === id) || null;
    }
    return ordersStore.find((o) => o.id === id) || null;
  },
  getOrder: (id: string): Promise<LabOrder | null> => labApi.get(id),

  create: async (payload: CreateLabOrderPayload): Promise<LabOrder> => {
    return labApi.createOrder(payload.customerId, payload.testCatalogId);
  },

  createOrder: async (customerId: string, testCatalogId: string): Promise<LabOrder> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<LabOrder>('create_lab_order', {
        payload: {
          customerId,
          testCatalogId,
        },
      });
    }

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

    ordersStore = [newOrder, ...ordersStore];
    return newOrder;
  },

  updateOrderStatus: async (id: string, status: LabOrderStatus): Promise<LabOrder | null> => {
    if (isUsingTauriIpc()) {
      await invokeCommand<boolean>('update_lab_order_status', { id, status });
      const orders = await invokeCommand<LabOrder[]>('get_lab_orders');
      return orders.find((o) => o.id === id) || null;
    }

    const index = ordersStore.findIndex((o) => o.id === id);
    if (index === -1) return null;

    const updated: LabOrder = {
      ...ordersStore[index],
      status,
      updated_at: new Date().toISOString(),
    };

    ordersStore[index] = updated;
    return updated;
  },

  deleteOrder: (id: string): boolean => {
    const initialLen = ordersStore.length;
    ordersStore = ordersStore.filter((o) => o.id !== id);
    return ordersStore.length < initialLen;
  },

  // Samples
  listSamples: async (): Promise<LabSample[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<LabSample[]>('get_lab_samples');
    }
    return [...samplesStore];
  },

  getSample: async (id: string): Promise<LabSample | null> => {
    if (isUsingTauriIpc()) {
      const list = await invokeCommand<LabSample[]>('get_lab_samples');
      return list.find((s) => s.id === id) || null;
    }
    return samplesStore.find((s) => s.id === id) || null;
  },

  collectSample: async (orderId: string, sampleLabel: string): Promise<LabSample> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<LabSample>('collect_lab_sample', {
        payload: {
          labOrderId: orderId,
          sampleLabel,
        },
      });
    }

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

    samplesStore = [newSample, ...samplesStore];

    ordersStore = ordersStore.map((o) =>
      o.id === orderId ? { ...o, status: 'sample_collected', updated_at: now } : o
    );

    return newSample;
  },

  updateSampleStatus: async (id: string, status: LabSampleStatus): Promise<LabSample | null> => {
    if (isUsingTauriIpc()) {
      await invokeCommand<boolean>('update_lab_sample_status', { id, status });
      const samples = await invokeCommand<LabSample[]>('get_lab_samples');
      return samples.find((s) => s.id === id) || null;
    }

    const index = samplesStore.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const updated: LabSample = {
      ...samplesStore[index],
      status,
      updated_at: new Date().toISOString(),
    };

    samplesStore[index] = updated;
    return updated;
  },

  // Results
  listResults: async (): Promise<LabResult[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<LabResult[]>('get_lab_results');
    }
    return [...resultsStore];
  },

  getResult: async (id: string): Promise<LabResult | null> => {
    if (isUsingTauriIpc()) {
      const list = await invokeCommand<LabResult[]>('get_lab_results');
      return list.find((r) => r.id === id) || null;
    }
    return resultsStore.find((r) => r.id === id) || null;
  },

  enterResult: async (
    orderId: string,
    value: string,
    referenceRange: string,
    isOutOfRange: boolean
  ): Promise<LabResult> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<LabResult>('enter_lab_result', {
        payload: {
          labOrderId: orderId,
          value,
          referenceRange,
          isOutOfRange,
        },
      });
    }

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

    resultsStore = [newResult, ...resultsStore];

    ordersStore = ordersStore.map((o) =>
      o.id === orderId ? { ...o, status: 'report_ready', updated_at: now } : o
    );

    return newResult;
  },

  // Catalog
  listCatalog: async (): Promise<TestCatalogEntry[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<TestCatalogEntry[]>('get_test_catalog');
    }
    return [...catalogStore];
  },

  getCatalogItem: async (id: string): Promise<TestCatalogEntry | null> => {
    if (isUsingTauriIpc()) {
      const list = await invokeCommand<TestCatalogEntry[]>('get_test_catalog');
      return list.find((c) => c.id === id) || null;
    }
    return catalogStore.find((c) => c.id === id) || null;
  },

  // Backwards compatibility aliases
  getOrders: (): Promise<LabOrder[]> => labApi.listOrders(),
  getSamples: (): Promise<LabSample[]> => labApi.listSamples(),
  getResults: (): Promise<LabResult[]> => labApi.listResults(),
  getCatalog: (): Promise<TestCatalogEntry[]> => labApi.listCatalog(),
};

export const lab = labApi;
