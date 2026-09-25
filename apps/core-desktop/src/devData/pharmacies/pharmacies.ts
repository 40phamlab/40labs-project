import type { Business } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, daysAgoIso } from '../constants';

export const initialBusiness: Business = {
  id: 'biz_001',
  workspace_id: WORKSPACE_ID,
  branch_id: BRANCH_ID,
  created_at: daysAgoIso(90),
  updated_at: daysAgoIso(2),
  business_id: 'AFYA-2847',
  name: 'Amani Pharmacy',
  tin: '109-482-773',
  tmda_number: 'TMDA-PH-00219',
  role_scopes: ['pharmacy', 'lab'],
  tier: 'class_1',
  contacts: {
    mobile: '+255 754 123 456',
    email: 'amani.pharmacy@example.co.tz',
    whatsapp: '+255 754 123 456',
  },
  address: {
    region: 'Mbeya',
    district: 'Mbeya City',
    place: 'Soweto',
  },
  logo_url: null,
  appearance_mode: 'light',
};

export const initialSecondBusiness: Business = {
  id: 'biz_002',
  workspace_id: 'ws_dev_002',
  branch_id: 'br_dev_002',
  created_at: daysAgoIso(120),
  updated_at: daysAgoIso(10),
  business_id: 'AFYA-9901',
  name: 'Emy Pharmacy',
  tin: '109-999-888',
  tmda_number: 'TMDA-PH-00888',
  role_scopes: ['pharmacy'],
  tier: 'free',
  contacts: {
    mobile: '+255 712 345 678',
    email: 'info@emypharmacy.co.tz',
    whatsapp: '+255 712 345 678',
  },
  address: {
    region: 'Dar es Salaam',
    district: 'Kinondoni',
    place: 'Kijitonyama',
  },
  logo_url: null,
  appearance_mode: 'light',
};

export const initialBusinesses: Business[] = [initialBusiness, initialSecondBusiness];
