import type { Business, Branch } from '@40labs/types';
import { initialBusiness, initialBusinesses, initialBranches } from '../devData';

let businessStore: Business = { ...initialBusiness };
let businessesStore: Business[] = [...initialBusinesses];
let branchesStore: Branch[] = [...initialBranches];

export const pharmaciesApi = {
  getBusiness: (): Business => ({ ...businessStore }),

  listBusinesses: (): Business[] => [...businessesStore],

  listBranches: (): Branch[] => [...branchesStore],

  getBranch: (id: string): Branch | null => {
    return branchesStore.find((b) => b.id === id) || null;
  },

  // Backwards compatibility aliases
  getAllBusinesses: (): Business[] => pharmaciesApi.listBusinesses(),
  getBranches: (): Branch[] => pharmaciesApi.listBranches(),
};

export const pharmacies = pharmaciesApi;
