import { BaseEntity, BusinessId } from './common';

export type BusinessRoleScope = 'pharmacy' | 'lab' | 'supplier';

export type PricingTier = 'free' | 'class_1' | 'class_2' | 'class_3' | 'class_4_enterprise';

export interface Business extends BaseEntity {
  business_id: BusinessId; // canonical, minted once — NOT the same as `id`
  name: string;
  tin: string | null;
  tmda_number: string | null;
  role_scopes: BusinessRoleScope[]; // additive, not exclusive
  tier: PricingTier;
  // tier is CALCULATED from the transaction ledger — never set this field
  // directly from a client request. Server computes it from Sale records.
  contacts: {
    mobile: string;
    email: string | null;
    whatsapp: string | null;
  };
  address: {
    region: string;
    district: string;
    place: string;
  };
  logo_url: string | null;
  appearance_mode: 'light' | 'dark'; // ONLY toggle — no custom theming per locked decision
}

export interface Branch extends BaseEntity {
  business_id: BusinessId;
  name: string;
  location: string;
  branch_code: string;
  status: 'active' | 'inactive';
  contacts: string | null;
}