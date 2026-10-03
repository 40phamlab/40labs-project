// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]

export interface Customer {
  id: string;
  workspaceId: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}
