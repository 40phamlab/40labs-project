import type { PairedDevice } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, daysAgoIso } from '../constants';

export const initialPairedDevices: PairedDevice[] = [
  {
    id: 'device_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgoIso(30),
    updated_at: daysAgoIso(1),
    user_id: 'user_002',
    device_label: "Grace's Phone (Orbit Worker)",
    device_type: 'android',
    permissions_json: JSON.stringify({
      can_update_stock: true,
      can_adjust_stock: false,
      can_issue_refund: false,
      can_approve_po: false,
      can_add_lab_sample: true,
      can_override_lab_result: false,
      can_view_reports: true,
    }),
    paired_at: daysAgoIso(30),
    last_connected_at: daysAgoIso(0),
    status: 'active',
  },
];
