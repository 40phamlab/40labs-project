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
  list: (): LabOrder[] => [...ordersStore],
  listOrders: (): LabOrder[] => [...ordersStore],

  get: (id: string): LabOrder | null => {
    return ordersStore.find((o) => o.id === id) || null;
  },
  getOrder: (id: string): LabOrder | null => labApi.get(id),

  create: (payload: CreateLabOrderPayload): LabOrder => {
    return labApi.createOrder(payload.customerId, payload.testCatalogId);
  },

  createOrder: (customerId: string, testCatalogId: string): LabOrder => {
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

  updateOrderStatus: (id: string, status: LabOrderStatus): LabOrder | null => {
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
  listSamples: (): LabSample[] => [...samplesStore],

  getSample: (id: string): LabSample | null => {
    return samplesStore.find((s) => s.id === id) || null;
  },

  collectSample: (orderId: string, sampleLabel: string): LabSample => {
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

  updateSampleStatus: (id: string, status: LabSampleStatus): LabSample | null => {
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
  listResults: (): LabResult[] => [...resultsStore],

  getResult: (id: string): LabResult | null => {
    return resultsStore.find((r) => r.id === id) || null;
  },

  enterResult: (
    orderId: string,
    value: string,
    referenceRange: string,
    isOutOfRange: boolean
  ): LabResult => {
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
  listCatalog: (): TestCatalogEntry[] => [...catalogStore],

  getCatalogItem: (id: string): TestCatalogEntry | null => {
    return catalogStore.find((c) => c.id === id) || null;
  },

  // Backwards compatibility aliases
  getOrders: (): LabOrder[] => labApi.listOrders(),
  getSamples: (): LabSample[] => labApi.listSamples(),
  getResults: (): LabResult[] => labApi.listResults(),
  getCatalog: (): TestCatalogEntry[] => labApi.listCatalog(),
};

export const lab = labApi;
