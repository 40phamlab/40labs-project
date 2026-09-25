import type { Sale, SaleLine } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, daysAgoIso, nowIso } from '../constants';

const mockSaleLines1: SaleLine[] = [
  {
    id: 'saleline_001',
    inventory_item_id: 'inv_001',
    medicine_id: 'med_001',
    quantity: 2,
    unit_price: 3000,
    subtotal: 6000,
    dispensed_by_user_id: 'user_002',
    is_prescription_dispense: false,
  },
];

const mockSaleLines2: SaleLine[] = [
  {
    id: 'saleline_002',
    inventory_item_id: 'inv_002',
    medicine_id: 'med_002',
    quantity: 1,
    unit_price: 5000,
    subtotal: 5000,
    dispensed_by_user_id: 'user_003',
    is_prescription_dispense: true,
  },
];

export const initialSales: Sale[] = [
  {
    id: 'sale_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(1),
    updated_at: daysAgoIso(1),
    customer_id: 'cust_001',
    lines: mockSaleLines1,
    payment_method: 'cash',
    discount_amount: 0,
    discount_authorized_by_user_id: null,
    tax_amount: 0,
    grand_total: 6000,
    currency: 'TZS',
    synced_at: daysAgoIso(1),
  },
  {
    id: 'sale_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: nowIso(),
    updated_at: nowIso(),
    customer_id: null,
    lines: mockSaleLines2,
    payment_method: 'mobile_money',
    discount_amount: 0,
    discount_authorized_by_user_id: null,
    tax_amount: 0,
    grand_total: 5000,
    currency: 'TZS',
    synced_at: null,
  },
];
