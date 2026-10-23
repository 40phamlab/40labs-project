import { useTranslation } from 'react-i18next';
import { formatDate, formatTime, formatNumber, formatCurrency } from './formatters';

export const useLocale = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en' : 'sw';

  const setLocale = (lang: 'sw' | 'en') => {
    i18n.changeLanguage(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'sw' ? 'sw-TZ' : 'en-TZ';
    }
  };

  return {
    locale,
    setLocale,
    t,
    formatDate: (date: Date | string | number) => formatDate(date, locale),
    formatTime: (date: Date | string | number) => formatTime(date, locale),
    formatNumber: (val: number) => formatNumber(val, locale),
    formatCurrency: (amount: number, currency = 'TZS') => formatCurrency(amount, currency, locale),
  };
};
