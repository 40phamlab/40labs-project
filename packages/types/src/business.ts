import { BaseEntity, BusinessId } from './common';

export type BusinessRoleScope = 'pharmacy' | 'lab' | 'supplier';

export type PricingTier = 'free' | 'class_1' | 'class_2' | 'class_3' | 'class_4_enterprise';

export type OnboardingState = 'registered' | 'owner_first_login' | 'setup_complete';

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
  owner_id?: string | null;
  onboarding_state?: OnboardingState;
  business_type?: string | null;
  country?: string;
  address_ward?: string | null;
  address_street?: string | null;
  address_area?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lipa_namba?: string | null;
  payment_number?: string | null;
  declared_branch_count?: number | null;
  terms_version?: string | null;
  terms_locale?: string | null;
  terms_text_sha256?: string | null;
  terms_accepted_at?: string | null;
  terms_accepted_by_user_id?: string | null;
}

export interface Branch extends BaseEntity {
  business_id: BusinessId;
  name: string;
  location: string;
  branch_code: string;
  status: 'active' | 'inactive';
  contacts: string | null;
}
