export const formatDate = (date: Date | string | number, locale = 'sw'): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const intlLocale = locale === 'sw' ? 'sw-TZ' : 'en-US';
  return new Intl.DateTimeFormat(intlLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
};

export const formatTime = (date: Date | string | number, locale = 'sw'): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const intlLocale = locale === 'sw' ? 'sw-TZ' : 'en-US';
  return new Intl.DateTimeFormat(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const formatNumber = (value: number, locale = 'sw'): string => {
  const intlLocale = locale === 'sw' ? 'sw-TZ' : 'en-US';
  return new Intl.NumberFormat(intlLocale).format(value);
};

export const formatCurrency = (amount: number, currency = 'TZS', locale = 'sw'): string => {
  const intlLocale = locale === 'sw' ? 'sw-TZ' : 'en-US';
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatMoney = (amount: number | null | undefined, locale = 'sw'): string => {
  if (amount == null || isNaN(Number(amount))) return '0';
  const rounded = Math.round(Number(amount));
  return formatNumber(rounded, locale);
};

export const formatNumberOrUnknown = (value: number | null | undefined, locale = 'sw'): string => {
  if (value == null || isNaN(Number(value))) {
    return locale === 'sw' ? 'Haijulikani' : 'Unknown';
  }
  return formatMoney(Number(value), locale);
};
