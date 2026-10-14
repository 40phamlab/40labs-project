import type { PartnerFacility, CreatePartnerFacilityPayload } from '@40labs/types';
import { isUsingTauriIpc, invokeCommand } from './client';

let mockFacilities: PartnerFacility[] = [
  {
    id: 'pf_1',
    workspace_id: 'ws_01',
    branch_id: 'branch-1',
    partner_business_id: 'AFYA-2847',
    name: 'Amani Pharmacy & Lab',
    type: 'pharmacy',
    contacts: { mobile: '+255 754 123 456', whatsapp: '+255 754 123 456' },
    region: 'Mbeya',
    district: 'Mbeya City',
    status: 'active',
    is_40labs_linked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pf_2',
    workspace_id: 'ws_01',
    branch_id: 'branch-1',
    partner_business_id: null,
    name: 'St. Jude Community Clinic',
    type: 'clinic',
    contacts: { mobile: '+255 712 999 888', whatsapp: '+255 712 999 888' },
    region: 'Dar es Salaam',
    district: 'Ilala',
    status: 'active',
    is_40labs_linked: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const partnerFacilitiesApi = {
  list: async (): Promise<PartnerFacility[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<PartnerFacility[]>('partner_facility_list');
    }
    return [...mockFacilities];
  },

  create: async (payload: CreatePartnerFacilityPayload): Promise<PartnerFacility> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<PartnerFacility>('partner_facility_create', { payload });
    }
    const newFacility: PartnerFacility = {
      id: `pf_${Date.now()}`,
      workspace_id: 'ws_01',
      branch_id: 'branch-1',
      partner_business_id: payload.partner_business_id || null,
      name: payload.name,
      type: payload.type,
      contacts: payload.contacts,
      region: payload.region,
      district: payload.district,
      status: 'active',
      is_40labs_linked: Boolean(payload.partner_business_id),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockFacilities = [newFacility, ...mockFacilities];
    return newFacility;
  },

  updateStatus: async (id: string, status: 'active' | 'blocked'): Promise<void> => {
    if (isUsingTauriIpc()) {
      await invokeCommand('partner_facility_update_status', { id, status });
      return;
    }
    mockFacilities = mockFacilities.map((f) => (f.id === id ? { ...f, status } : f));
  },

  delete: async (id: string): Promise<void> => {
    if (isUsingTauriIpc()) {
      await invokeCommand('partner_facility_delete', { id });
      return;
    }
    mockFacilities = mockFacilities.filter((f) => f.id !== id);
  },
};
