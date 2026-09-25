import type { Business, Branch } from '@40labs/types';
import { initialBusiness, initialBusinesses, initialBranches } from '../devData';

let businessStore: Business = { ...initialBusiness };
let businessesStore: Business[] = [...initialBusinesses];
let branchesStore: Branch[] = [...initialBranches];

export const pharmaciesApi = {
  getBusiness: (): Business => ({ ...businessStore }),

  getAllBusinesses: (): Business[] => [...businessesStore],

  getBranches: (): Branch[] => [...branchesStore],
};
