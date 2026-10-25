import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import './types';
import { formatDate } from './formatters';

import swCommon from './locales/sw/common.json';
import swNav from './locales/sw/nav.json';
import swSettings from './locales/sw/settings.json';
import swAuth from './locales/sw/auth.json';
import swDashboard from './locales/sw/dashboard.json';
import swSales from './locales/sw/sales.json';
import swInventory from './locales/sw/inventory.json';
import swCustomers from './locales/sw/customers.json';
import swLab from './locales/sw/lab.json';
import swPurchases from './locales/sw/purchases.json';
import swReports from './locales/sw/reports.json';
import swNotifications from './locales/sw/notifications.json';
import swErrors from './locales/sw/errors.json';
import swLanding from './locales/sw/landing.json';
import swInstructions from './locales/sw/instructions.json';
import swConnectivity from './locales/sw/connectivity.json';
import swPairing from './locales/sw/pairing.json';

import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enSettings from './locales/en/settings.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enSales from './locales/en/sales.json';
import enInventory from './locales/en/inventory.json';
import enCustomers from './locales/en/customers.json';
import enLab from './locales/en/lab.json';
import enPurchases from './locales/en/purchases.json';
import enReports from './locales/en/reports.json';
import enNotifications from './locales/en/notifications.json';
import enErrors from './locales/en/errors.json';
import enLanding from './locales/en/landing.json';
import enInstructions from './locales/en/instructions.json';
import enConnectivity from './locales/en/connectivity.json';
import enPairing from './locales/en/pairing.json';

function flattenKeys(obj: any, prefix = ''): Record<string, string> {
  let keys: Record<string, string> = {};
  for (const k of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (obj[k] !== null && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      Object.assign(keys, flattenKeys(obj[k], fullKey));
    } else {
      keys[fullKey] = String(obj[k]);
    }
  }
  return keys;
}

const buildTranslationBundle = (nsMap: Record<string, any>) => {
  const bundle: Record<string, any> = {};
  for (const [ns, data] of Object.entries(nsMap)) {
    const flattened = flattenKeys(data, ns);
    Object.assign(bundle, flattened);
    if (ns === 'common') {
      const topLevel = flattenKeys(data);
      Object.assign(bundle, topLevel);
    }
  }
  return bundle;
};

const swNamespaces = {
  common: swCommon,
  nav: swNav,
  settings: swSettings,
  auth: swAuth,
  dashboard: swDashboard,
  sales: swSales,
  inventory: swInventory,
  customers: swCustomers,
  lab: swLab,
  purchases: swPurchases,
  reports: swReports,
  notifications: swNotifications,
  errors: swErrors,
  landing: swLanding,
  instructions: swInstructions,
  connectivity: swConnectivity,
  pairing: swPairing,
};

const enNamespaces = {
  common: enCommon,
  nav: enNav,
  settings: enSettings,
  auth: enAuth,
  dashboard: enDashboard,
  sales: enSales,
  inventory: enInventory,
  customers: enCustomers,
  lab: enLab,
  purchases: enPurchases,
  reports: enReports,
  notifications: enNotifications,
  errors: enErrors,
  landing: enLanding,
  instructions: enInstructions,
  connectivity: enConnectivity,
  pairing: enPairing,
};

const swTranslation = buildTranslationBundle(swNamespaces);
const enTranslation = buildTranslationBundle(enNamespaces);

const resources = {
  sw: { translation: swTranslation },
  'sw-TZ': { translation: swTranslation },
  en: { translation: enTranslation },
  'en-TZ': { translation: enTranslation },
};

export { resources as translations };

if (!i18n.isInitialized) {
  const persistedLng = typeof window !== 'undefined' && typeof localStorage !== 'undefined' ? localStorage.getItem('40labs_language') : null;
  const initialLng = persistedLng === 'en' || persistedLng === 'en-TZ' ? 'en' : 'sw';

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLng,
      fallbackLng: 'en',
      defaultNS: 'translation',
      ns: ['translation'],
      keySeparator: '.',
      nsSeparator: false,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
        bindI18n: 'languageChanged',
      },
      missingKeyHandler: (lng, ns, key) => {
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          console.warn(`[i18n] Missing key "${key}" in namespace "${ns}" for language "${lng}".`);
        }
      },
      parseMissingKeyHandler: (key) => {
        return key;
      },
    });
}

export { i18n };
export const t = (key: string, options?: any): string => {
  return i18n.t(key as any, options) as string;
};
export type TranslationKey = string;
export const formatDateTime = (date: Date | string | number, locale = 'sw'): string => {
  return formatDate(date, locale);
};
export * from './formatters';
export * from './useLocale';
export * from './phone';
export type { Language } from './types';
