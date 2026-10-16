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
  appearance_mode?: 'light' | 'dark' | 'system';
  language?: 'sw-TZ' | 'en' | string;
}

export async function resolveLogoUrl(logoUrl?: string | null): Promise<string | null> {
  if (!logoUrl) return null;
  if (
    logoUrl.startsWith('data:') ||
    logoUrl.startsWith('http:') ||
    logoUrl.startsWith('https:') ||
    logoUrl.startsWith('blob:')
  ) {
    return logoUrl;
  }
  if (isUsingTauriIpc()) {
    try {
      const { convertFileSrc } = await import('@tauri-apps/api/core');
      return convertFileSrc(logoUrl);
    } catch {
      return logoUrl;
    }
  }
  return logoUrl;
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

  uploadLogo: async (file: File): Promise<string> => {
    if (file.size > 512 * 1024) {
      throw new Error('Logo lazima iwe chini ya KB 512');
    }
    if (isUsingTauriIpc()) {
      const buffer = await file.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buffer));
      return invokeCommand<string>('upload_business_logo', {
        bytes,
        fileName: file.name,
      });
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};

export const business = businessApi;
