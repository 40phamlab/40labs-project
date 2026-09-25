import type { Customer } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, daysAgoIso } from '../constants';

export const initialCustomers: Customer[] = [
  {
    id: 'cust_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(120),
    updated_at: daysAgoIso(3),
    full_name: 'Juma Hamisi',
    phone: '0606113565',
    email: null,
    outstanding_balance: 15000,
    notes: 'Regular customer, prefers generics.',
    amob_patient_id: null,
  },
  {
    id: 'cust_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(80),
    updated_at: daysAgoIso(12),
    full_name: 'Anna Yajilo',
    phone: '0606113566',
    email: 'anna.yajilo@example.com',
    outstanding_balance: 0,
    notes: null,
    amob_patient_id: null,
  },
  {
    id: 'cust_003',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(5),
    updated_at: daysAgoIso(5),
    full_name: 'Jane Kimario',
    phone: '0696571221',
    email: null,
    outstanding_balance: 50000,
    notes: 'Debtor — reminded 2026-08-20',
    amob_patient_id: null,
  },
];
