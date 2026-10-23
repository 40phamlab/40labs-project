import type enCommon from './locales/en/common.json';
import type enNav from './locales/en/nav.json';
import type enSettings from './locales/en/settings.json';
import type enAuth from './locales/en/auth.json';
import type enDashboard from './locales/en/dashboard.json';
import type enSales from './locales/en/sales.json';
import type enInventory from './locales/en/inventory.json';
import type enCustomers from './locales/en/customers.json';
import type enLab from './locales/en/lab.json';
import type enPurchases from './locales/en/purchases.json';
import type enReports from './locales/en/reports.json';
import type enNotifications from './locales/en/notifications.json';
import type enErrors from './locales/en/errors.json';

export type Language = 'sw' | 'en' | 'sw-TZ';

export interface Resources {
  common: typeof enCommon;
  nav: typeof enNav;
  settings: typeof enSettings;
  auth: typeof enAuth;
  dashboard: typeof enDashboard;
  sales: typeof enSales;
  inventory: typeof enInventory;
  customers: typeof enCustomers;
  lab: typeof enLab;
  purchases: typeof enPurchases;
  reports: typeof enReports;
  notifications: typeof enNotifications;
  errors: typeof enErrors;
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: Resources;
  }
}
