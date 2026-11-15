export type RegistrationErrorCode =
  | 'INVALID_VERIFICATION'
  | 'INVALID_REGISTRATION_DATA'
  | 'API_UNAVAILABLE'
  | 'ACTIVATION_REJECTED'
  | 'DEVICE_ENROLLMENT_FAILURE'
  | 'SECURE_STORAGE_FAILURE'
  | 'DATABASE_CONSTRAINT_FAILURE'
  | 'TRANSACTION_FAILURE'
  | 'REGISTRATION_ALREADY_COMPLETED'
  | 'REGISTRATION_FAILED';

export interface NormalizedRegistrationError {
  code: RegistrationErrorCode;
  stage?: string;
  retryable: boolean;
  message: string;
}

const messages: Record<RegistrationErrorCode, { en: string; sw: string }> = {
  INVALID_VERIFICATION: {
    en: 'Owner verification has expired or is invalid. Verify the owner phone again.',
    sw: 'Uthibitisho wa mmiliki umeisha muda au si sahihi. Thibitisha tena simu ya mmiliki.',
  },
  INVALID_REGISTRATION_DATA: {
    en: 'Some registration details are invalid. Review the business, owner, phone, and account information.',
    sw: 'Baadhi ya taarifa za usajili si sahihi. Kagua taarifa za biashara, mmiliki, simu na akaunti.',
  },
  API_UNAVAILABLE: {
    en: 'The activation service is unavailable. Check your connection and try again.',
    sw: 'Huduma ya uanzishaji haipatikani. Kagua intaneti kisha ujaribu tena.',
  },
  ACTIVATION_REJECTED: {
    en: 'The activation service rejected this registration. Verify the owner again or contact support.',
    sw: 'Huduma ya uanzishaji imekataa usajili huu. Thibitisha mmiliki tena au wasiliana na msaada.',
  },
  DEVICE_ENROLLMENT_FAILURE: {
    en: 'This device could not be enrolled. Retry registration while connected to the internet.',
    sw: 'Kifaa hiki hakikuweza kusajiliwa. Jaribu tena ukiwa umeunganishwa na intaneti.',
  },
  SECURE_STORAGE_FAILURE: {
    en: 'Secure storage is unavailable. Unlock or repair the device keychain, then retry.',
    sw: 'Hifadhi salama haipatikani. Fungua au rekebisha hifadhi salama ya kifaa kisha ujaribu tena.',
  },
  DATABASE_CONSTRAINT_FAILURE: {
    en: 'Registration conflicts with existing local data. Your existing data was preserved; contact support before retrying.',
    sw: 'Usajili unakinzana na taarifa zilizopo kwenye kifaa. Taarifa zako zimehifadhiwa; wasiliana na msaada kabla ya kujaribu tena.',
  },
  TRANSACTION_FAILURE: {
    en: 'Registration could not be saved completely. Your data was rolled back; retry safely.',
    sw: 'Usajili haukuweza kuhifadhiwa kikamilifu. Mabadiliko yasiyokamilika yamerejeshwa; jaribu tena.',
  },
  REGISTRATION_ALREADY_COMPLETED: {
    en: 'This business is already registered on this device. Continue to sign in.',
    sw: 'Biashara hii tayari imesajiliwa kwenye kifaa hiki. Endelea kuingia.',
  },
  REGISTRATION_FAILED: {
    en: 'Registration could not be completed. Try again or contact support.',
    sw: 'Usajili haukukamilika. Jaribu tena au wasiliana na msaada.',
  },
};

const allowedCodes = new Set<RegistrationErrorCode>(Object.keys(messages) as RegistrationErrorCode[]);

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : undefined;
}

function parseErrorValue(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'string') {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return undefined;
    }
  }
  return asRecord(value);
}

export function normalizeRegistrationError(error: unknown, language: string): NormalizedRegistrationError {
  const record = parseErrorValue(error);
  const nested = parseErrorValue(record?.error) ?? parseErrorValue(record?.data) ?? parseErrorValue(record?.cause);
  const rawCode = record?.code ?? nested?.code;
  const code = typeof rawCode === 'string' && allowedCodes.has(rawCode as RegistrationErrorCode)
    ? rawCode as RegistrationErrorCode
    : rawCode === 'POLICY_VIOLATION' ? 'INVALID_REGISTRATION_DATA'
      : rawCode === 'INVALID_CREDENTIALS' ? 'INVALID_VERIFICATION'
        : 'REGISTRATION_FAILED';
  const stageValue = record?.stage ?? nested?.stage;
  const retryValue = record?.retryable ?? nested?.retryable;
  return {
    code,
    stage: typeof stageValue === 'string' ? stageValue : undefined,
    retryable: typeof retryValue === 'boolean' ? retryValue : code === 'API_UNAVAILABLE' || code === 'DEVICE_ENROLLMENT_FAILURE' || code === 'SECURE_STORAGE_FAILURE' || code === 'TRANSACTION_FAILURE',
    message: messages[code][language === 'sw' ? 'sw' : 'en'],
  };
}
