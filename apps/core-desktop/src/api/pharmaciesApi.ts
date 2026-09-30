import type { Business, Branch } from '@40labs/types';
import { initialPharmacyBusiness, initialPharmacyBusinesses, initialPharmacyBranches } from '../devData';

let businessStore: Business = { ...initialPharmacyBusiness };
let businessesStore: Business[] = [...initialPharmacyBusinesses];
let branchesStore: Branch[] = [...initialPharmacyBranches];

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
