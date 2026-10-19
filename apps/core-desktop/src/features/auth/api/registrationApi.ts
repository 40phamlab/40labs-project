import { authApi } from '../../../api/authApi';

export interface RegistrationPayload {
  business_name: string;
  logo_data_url?: string | null;
  region: string;
  district: string;
  kata: string;
  scale: string;
  role_scopes: string;
  declared_branch_count?: number;
  lipa_namba?: string;
  payment_number?: string;
  business_phone: string;
  business_phone_token?: string;
  owner_type: 'personal' | 'organization';
  organization_name?: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_phone: string;
  owner_phone_token?: string;
  owner_email: string;
  owner_email_token?: string;
  terms_version: string;
  terms_locale: string;
  terms_text_sha256: string;
}

export const registrationApi = {
  requestOtp: async (phoneOrEmail: string, _channel: 'sms' | 'email' = 'sms') => {
    await authApi.otpRequest(phoneOrEmail);
  },
  verifyOtp: async (phoneOrEmail: string, code: string, _channel: 'sms' | 'email' = 'sms') => {
    return await authApi.otpVerify(phoneOrEmail, code);
  },
  commitRegistration: async (payload: RegistrationPayload) => {
    return await authApi.registrationCommit(payload as unknown as Record<string, unknown>);
  },
};
