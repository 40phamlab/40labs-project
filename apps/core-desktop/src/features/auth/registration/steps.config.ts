import type { TranslationKey } from '@40labs/i18n';

export interface RegStepConfig {
  id: string;
  i18n: TranslationKey;
  skippable?: boolean;
}

export const REGISTRATION_STEPS: readonly RegStepConfig[] = [
  { id: 'business', i18n: 'auth.reg.business' },
  { id: 'type',     i18n: 'auth.reg.typeScale' },
  { id: 'location', i18n: 'auth.reg.location' },
  { id: 'payments', i18n: 'auth.reg.payments', skippable: true },
  { id: 'owner',    i18n: 'auth.reg.ownerOtp' },
  { id: 'terms',    i18n: 'auth.reg.terms' },
] as const;
