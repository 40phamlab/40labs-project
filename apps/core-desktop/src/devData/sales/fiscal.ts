import type { FiscalReceipt } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, daysAgoIso, nowIso } from '../constants';

export const initialFiscalReceipts: FiscalReceipt[] = [
  {
    id: 'fiscal_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(1),
    updated_at: daysAgoIso(1),
    sale_id: 'sale_001',
    fiscal_device_id: 'INCOTEX-0192',
    status: 'confirmed',
    local_signature: 'sig_a1b2c3',
    tra_receipt_number: 'TRA-0009821',
    queued_at: daysAgoIso(1),
    submitted_at: daysAgoIso(1),
    retry_count: 0,
    buffering_window_hours: null,
  },
  {
    id: 'fiscal_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: nowIso(),
    updated_at: nowIso(),
    sale_id: 'sale_002',
    fiscal_device_id: null,
    status: 'queued',
    local_signature: 'sig_d4e5f6',
    tra_receipt_number: null,
    queued_at: nowIso(),
    submitted_at: null,
    retry_count: 0,
    buffering_window_hours: null,
  },
];
