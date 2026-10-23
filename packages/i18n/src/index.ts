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

const resources = {
  sw: {
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
  },
  'sw-TZ': {
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
  },
  en: {
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
  },
};

export { resources as translations };

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'sw', // First launch = Swahili regardless of OS locale. No auto-detect.
      fallbackLng: {
        'sw-TZ': ['sw', 'en'],
        'default': ['en'],
      },
      defaultNS: 'common',
      ns: [
        'common',
        'nav',
        'settings',
        'auth',
        'dashboard',
        'sales',
        'inventory',
        'customers',
        'lab',
        'purchases',
        'reports',
        'notifications',
        'errors',
      ],
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      missingKeyHandler: (lng, ns, key) => {
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          console.warn(`[i18n] Missing key "${key}" in namespace "${ns}" for language "${lng}".`);
        }
      },
      parseMissingKeyHandler: (key) => {
        const enVal = i18n.getResource('en', 'common', key) || i18n.getResource('en', 'settings', key) || key;
        return typeof enVal === 'string' ? enVal : key;
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
