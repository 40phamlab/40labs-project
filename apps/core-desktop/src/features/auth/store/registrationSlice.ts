import { create } from 'zustand';
import { TZ_ADMIN_AREAS } from '../../../lib/tzAdminAreas';

export interface RegistrationDraftState {
  businessName: string;
  logoDataUrl: string | null;
  region: string;
  district: string;
  kata: string;
  scale: string;
  roleScopes: string;
  branches: string;
  lipaNamba: string;
  paymentNumber: string;
  businessPhone: string;
  ownerType: 'personal' | 'organization';
  orgName: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPhone: string;
  sameAsBusinessPhone: boolean;
  ownerEmail: string;
  termsAccepted: boolean;

  // setters
  setField: (key: string, value: any) => void;
  resetDraft: () => void;
}

const STORAGE_KEY = '40labs_reg_draft_v2';

const getInitialDraft = () => {
  if (typeof window === 'undefined') return {};
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return {};
};

export const useRegistrationStore = create<RegistrationDraftState>((set) => {
  const initial = getInitialDraft();
  return {
    businessName: initial.businessName || '',
    logoDataUrl: initial.logoDataUrl || null,
    region: initial.region || TZ_ADMIN_AREAS[0].name,
    district: initial.district || TZ_ADMIN_AREAS[0].districts[0],
    kata: initial.kata || '',
    scale: initial.scale || 'medium',
    roleScopes: initial.roleScopes || 'pharmacy',
    branches: initial.branches || '1',
    lipaNamba: initial.lipaNamba || '',
    paymentNumber: initial.paymentNumber || '',
    businessPhone: initial.businessPhone || '',
    ownerType: initial.ownerType || 'personal',
    orgName: initial.orgName || '',
    ownerFirstName: initial.ownerFirstName || '',
    ownerLastName: initial.ownerLastName || '',
    ownerPhone: initial.ownerPhone || '',
    sameAsBusinessPhone: initial.sameAsBusinessPhone ?? true,
    ownerEmail: initial.ownerEmail || '',
    termsAccepted: initial.termsAccepted || false,

    setField: (key, value) => {
      set((state) => {
        const next = { ...state, [key]: value };
        if (key === 'region') {
          const found = TZ_ADMIN_AREAS.find((r) => r.name === value);
          if (found) {
            next.district = found.districts[0];
          }
        }
        if (key === 'businessPhone' && state.sameAsBusinessPhone) {
          next.ownerPhone = value;
        }
        if (key === 'sameAsBusinessPhone' && value) {
          next.ownerPhone = state.businessPhone;
        }
        try {
          const { setField, resetDraft, ...persistable } = next;
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
        } catch {
          // ignore
        }
        return next;
      });
    },

    resetDraft: () => {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      set({
        businessName: '',
        logoDataUrl: null,
        region: TZ_ADMIN_AREAS[0].name,
        district: TZ_ADMIN_AREAS[0].districts[0],
        kata: '',
        scale: 'medium',
        roleScopes: 'pharmacy',
        branches: '1',
        lipaNamba: '',
        paymentNumber: '',
        businessPhone: '',
        ownerType: 'personal',
        orgName: '',
        ownerFirstName: '',
        ownerLastName: '',
        ownerPhone: '',
        sameAsBusinessPhone: true,
        ownerEmail: '',
        termsAccepted: false,
      });
    },
  };
});
