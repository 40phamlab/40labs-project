import type { IntegrationsConfig } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, daysAgoIso } from '../constants';

export const initialIntegrationsConfig: IntegrationsConfig = {
  id: 'int_cfg_001',
  workspace_id: WORKSPACE_ID,
  branch_id: BRANCH_ID,
  created_at: daysAgoIso(90),
  updated_at: daysAgoIso(10),
  email_connected: true,
  email_address: 'notifications@40labs.health',
  whatsapp_connected: true,
  whatsapp_number: '+255 715 000 222',
  web_apps_connected: ['Web App', 'Admin Portal'],
  mobile_phone: '+255 715 000 111',
  collaborators: [
    {
      user_id: 'user_002',
      full_name: 'Grace Mushi',
      scope: 'manage',
    },
  ],
};
