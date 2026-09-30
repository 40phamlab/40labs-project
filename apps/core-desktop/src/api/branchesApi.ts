import type { Branch } from '@40labs/types';
import { initialBranches, WORKSPACE_ID } from '../devData';
import { isUsingTauriIpc, invokeCommand } from './client';

export interface CreateBranchPayload {
  name: string;
  location: string;
  branch_code: string;
  status: 'active' | 'inactive';
  contacts: string | null;
}

export interface UpdateBranchPayload {
  name?: string;
  location?: string;
  branch_code?: string;
  status?: 'active' | 'inactive';
  contacts?: string | null;
}

let branchesStore: Branch[] = [...initialBranches];

export const branchesApi = {
  list: async (): Promise<Branch[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Branch[]>('get_branches');
    }
    return [...branchesStore];
  },

  create: async (payload: CreateBranchPayload): Promise<Branch> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Branch>('create_branch', { payload });
    }
    const now = new Date().toISOString();
    const branchId = `br_${Date.now()}`;
    const newBranch: Branch = {
      id: branchId,
      workspace_id: WORKSPACE_ID,
      branch_id: branchId,
      business_id: branchesStore[0]?.business_id || 'AFYA-1001',
      name: payload.name,
      location: payload.location,
      branch_code: payload.branch_code,
      status: payload.status,
      contacts: payload.contacts,
      created_at: now,
      updated_at: now,
    };
    branchesStore = [newBranch, ...branchesStore];
    return newBranch;
  },

  update: async (id: string, payload: UpdateBranchPayload): Promise<Branch | null> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Branch>('update_branch', { id, payload });
    }
    const index = branchesStore.findIndex((b) => b.id === id);
    if (index === -1) return null;
    const existing = branchesStore[index];
    const updated: Branch = {
      ...existing,
      ...payload,
      updated_at: new Date().toISOString(),
    };
    branchesStore[index] = updated;
    return updated;
  },
};

export const branches = branchesApi;
