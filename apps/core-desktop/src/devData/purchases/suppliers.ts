import type { Supplier } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, daysAgoIso } from '../constants';

export const initialSuppliers: Supplier[] = [
  {
    id: 'supplier_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(150),
    updated_at: daysAgoIso(30),
    business_id: 'AFYA-1102',
    tmda_verified: true,
    tra_verified: true,
  },
  {
    id: 'supplier_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(90),
    updated_at: daysAgoIso(90),
    business_id: 'AFYA-1587',
    tmda_verified: false,
    tra_verified: false,
  },
];
