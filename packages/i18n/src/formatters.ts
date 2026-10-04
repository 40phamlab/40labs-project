// [PHASE: MVP]
import { t, Language } from './index';

export function formatDate(d: string | Date | number, lang: Language = 'sw-TZ'): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const locale = lang === 'en' ? 'en-GB' : 'sw-TZ';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(d: string | Date | number, lang: Language = 'sw-TZ'): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const locale = lang === 'en' ? 'en-GB' : 'sw-TZ';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatRelative(d: string | Date | number, lang: Language = 'sw-TZ'): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) {
    return t('dashboard.timeJustNow', lang);
  } else if (diffMin < 60) {
    return t('dashboard.timeMinutesAgo', lang).replace('{n}', String(diffMin));
  } else if (diffDay < 1) {
    return t('dashboard.timeHoursAgo', lang).replace('{n}', String(diffHour));
  } else if (diffDay === 1) {
    return t('dashboard.timeYesterday', lang);
  } else if (diffDay < 30) {
    return t('dashboard.timeDaysAgo', lang).replace('{n}', String(diffDay));
  } else {
    return formatDate(date, lang);
  }
}

export function formatMoneyOrUnknown(amount: number | null | undefined, currency: string = 'TZS'): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return '—';
  }
  const num = Number(amount);
  return `${currency} ${num.toLocaleString('en-US')}`;
}

export function formatNumberOrUnknown(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return Number(value).toLocaleString('en-US');
}

