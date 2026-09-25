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
    paired_at: daysAgoIso(30),
    last_connected_at: daysAgoIso(0),
    status: 'active',
  },
];
