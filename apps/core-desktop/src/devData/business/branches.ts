import type { Branch } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, nowIso } from '../constants';

export const initialBranches: Branch[] = [
  {
    id: BRANCH_ID,
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    business_id: 'AFYA-1001',
    name: 'Main Branch - Kariakoo',
    location: 'Kariakoo, Dar es Salaam',
    branch_code: 'BR-001',
    status: 'active',
    contacts: '0712345678',
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    id: 'br_dev_002',
    workspace_id: WORKSPACE_ID,
    branch_id: 'br_dev_002',
    business_id: 'AFYA-1001',
    name: 'Upanga Dispensary Branch',
    location: 'Upanga West, Dar es Salaam',
    branch_code: 'BR-002',
    status: 'active',
    contacts: '0711223344',
    created_at: nowIso(),
    updated_at: nowIso(),
  },
];
