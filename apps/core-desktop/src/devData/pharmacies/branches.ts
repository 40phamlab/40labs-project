import type { Branch } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, daysAgoIso } from '../constants';

export const initialBranches: Branch[] = [
  {
    id: 'branch_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(90),
    updated_at: daysAgoIso(90),
    business_id: 'AFYA-2847',
    name: 'Amani Pharmacy — Main',
    location: 'Soweto, Mbeya',
    branch_code: 'MAIN',
    status: 'active',
    contacts: '+255 754 123 456',
  },
];
