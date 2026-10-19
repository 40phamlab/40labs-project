import type { PurchaseOrder } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, daysAgoIso } from '../constants';

export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(80),
    updated_at: daysAgoIso(78),
    supplier_id: 'supplier_001',
    status: 'completed',
    lines: [
      { medicine_id: 'med_001', quantity: 300, unit_cost: 2000 },
      { medicine_id: 'med_002', quantity: 100, unit_cost: 3500 },
    ],
    total_cost: 950000,
    approved_by_user_id: 'user_001',
    submitted_at: daysAgoIso(79),
  },
  {
    id: 'po_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(40),
    updated_at: daysAgoIso(38),
    supplier_id: 'supplier_001',
    status: 'completed',
    lines: [
      { medicine_id: 'med_001', quantity: 200, unit_cost: 2000 },
      { medicine_id: 'med_003', quantity: 30, unit_cost: 8000 },
    ],
    total_cost: 640000,
    approved_by_user_id: 'user_001',
    submitted_at: daysAgoIso(39),
  },
  {
    id: 'po_003',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(5),
    updated_at: daysAgoIso(5),
    supplier_id: 'supplier_002',
    status: 'draft',
    lines: [{ medicine_id: 'med_004', quantity: 50, unit_cost: 300 }],
    total_cost: 15000,
    approved_by_user_id: null,
    submitted_at: null,
  },
];
