// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]

export interface LabOrder {
  id: string;
  workspaceId: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  saleId?: string | null;
  orderedByUserId: string;
  status: string; // 'pending' | 'sample_collected' | 'completed'
  testCatalogId: string;
}

export interface LabSample {
  id: string;
  labOrderId: string;
  collectedByUserId: string;
  collectedAt: string;
  sampleLabel: string;
  status: string;
}
