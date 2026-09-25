import type { LabOrder, LabSample, LabResult, TestCatalogEntry } from '@40labs/types';
import {
  initialLabOrders,
  initialLabSamples,
  initialLabResults,
  initialTestCatalog,
  WORKSPACE_ID,
  BRANCH_ID,
} from '../devData';

let ordersStore: LabOrder[] = [...initialLabOrders];
let samplesStore: LabSample[] = [...initialLabSamples];
let resultsStore: LabResult[] = [...initialLabResults];
let catalogStore: TestCatalogEntry[] = [...initialTestCatalog];

export const labApi = {
  getOrders: (): LabOrder[] => [...ordersStore],

  getSamples: (): LabSample[] => [...samplesStore],

  getResults: (): LabResult[] => [...resultsStore],

  getCatalog: (): TestCatalogEntry[] => [...catalogStore],

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
};
