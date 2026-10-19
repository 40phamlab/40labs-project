import type { TranslationKey } from '@40labs/i18n';

export interface RegSubStep {
  id: string;
  titleKey: TranslationKey;
}

export interface RegStepConfig {
  id: string;
  titleKey: TranslationKey;
  subSteps: RegSubStep[];
}

export const REGISTRATION_STEPS: RegStepConfig[] = [
  {
    id: 'business',
    titleKey: 'auth.step.business',
    subSteps: [
      { id: 'info', titleKey: 'auth.sub.info' },
      { id: 'place', titleKey: 'auth.sub.place' },
      { id: 'size', titleKey: 'auth.sub.size' },
      { id: 'payments', titleKey: 'auth.sub.payments' },
      { id: 'phone', titleKey: 'auth.sub.phone' },
    ],
  },
  {
    id: 'owner',
    titleKey: 'auth.step.owner',
    subSteps: [
      { id: 'details', titleKey: 'auth.sub.details' },
      { id: 'verify', titleKey: 'auth.sub.verify' },
    ],
  },
  {
    id: 'terms',
    titleKey: 'auth.step.terms',
    subSteps: [
      { id: 'terms-consent', titleKey: 'auth.terms.title' },
    ],
  },
  {
    id: 'access',
    titleKey: 'auth.step.access',
    subSteps: [
      { id: 'access-success', titleKey: 'auth.step.access' },
    ],
  },
];
