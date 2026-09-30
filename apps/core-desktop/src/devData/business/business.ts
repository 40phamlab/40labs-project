import type { Business } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, nowIso } from '../constants';

export const initialBusiness: Business = {
  id: WORKSPACE_ID,
  workspace_id: WORKSPACE_ID,
  branch_id: BRANCH_ID,
  business_id: 'AFYA-1001',
  name: 'Afya Bora Pharmacy & Medical Centre',
  tin: '123-456-789',
  tmda_number: 'TMDA/PHA/2024/001',
  role_scopes: ['pharmacy', 'lab'],
  tier: 'free',
  contacts: {
    mobile: '0712345678',
    email: 'contact@afyabora.co.tz',
    whatsapp: '0712345678',
  },
  address: {
    region: 'Dar es Salaam',
    district: 'Ilala',
    place: 'Kariakoo Market St',
  },
  logo_url: null,
  appearance_mode: 'light',
  created_at: nowIso(),
  updated_at: nowIso(),
};
