import type { Business } from '@40labs/types';
import { initialBusiness } from '../devData';
import { isUsingTauriIpc, invokeCommand } from './client';

export interface UpdateBusinessPayload {
  name?: string;
  tin?: string | null;
  tmda_number?: string | null;
  contacts?: {
    mobile: string;
    email: string | null;
    whatsapp: string | null;
  };
  address?: {
    region: string;
    district: string;
    place: string;
  };
  logo_url?: string | null;
  appearance_mode?: 'light' | 'dark';
}

let businessStore: Business = { ...initialBusiness };

export const businessApi = {
  get: async (): Promise<Business> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Business>('get_business');
    }
    return { ...businessStore };
  },

  update: async (payload: UpdateBusinessPayload): Promise<Business> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Business>('update_business', { payload });
    }
    const now = new Date().toISOString();
    businessStore = {
      ...businessStore,
      ...payload,
      contacts: payload.contacts ? { ...businessStore.contacts, ...payload.contacts } : businessStore.contacts,
      address: payload.address ? { ...businessStore.address, ...payload.address } : businessStore.address,
      updated_at: now,
    };
    return { ...businessStore };
  },
};

export const business = businessApi;
