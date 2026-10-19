import { businessApi } from '../../../../api/businessApi';

export interface BusinessIdentity {
  name: string;
  addressLine: string;
  phone: string;
  email?: string | null;
  tin?: string | null;
}

export async function getBusinessIdentity(): Promise<BusinessIdentity> {
  try {
    const biz = await businessApi.get();
    const addressLine = [biz.address?.place, biz.address?.district, biz.address?.region].filter(Boolean).join(', ') || 'Tanzania';
    return {
      name: biz.name || 'Pharmacy POS',
      addressLine,
      phone: biz.contacts?.mobile || '',
      email: biz.contacts?.email || null,
      tin: biz.tin || null,
    };
  } catch {
    return {
      name: 'Pharmacy POS',
      addressLine: 'Tanzania',
      phone: '',
      email: null,
      tin: null,
    };
  }
}
