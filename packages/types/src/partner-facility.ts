import { BaseEntity } from './common';

export type FacilityType = 'pharmacy' | 'clinic' | 'hospital' | 'lab' | 'other';
export type FacilityStatus = 'active' | 'blocked';

export interface PartnerFacilityContacts {
  mobile?: string | null;
  whatsapp?: string | null;
}

export interface PartnerFacility extends BaseEntity {
  workspace_id: string;
  branch_id: string;
  partner_business_id?: string | null;
  name: string;
  type: FacilityType;
  contacts: PartnerFacilityContacts;
  region: string;
  district: string;
  status: FacilityStatus;
  is_40labs_linked: boolean;
}

export interface CreatePartnerFacilityPayload {
  partner_business_id?: string | null;
  name: string;
  type: FacilityType;
  contacts: PartnerFacilityContacts;
  region: string;
  district: string;
}
