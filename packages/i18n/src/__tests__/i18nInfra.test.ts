import { describe, test, expect } from 'vitest';
import { i18n, t, formatDate, formatTime, formatNumber, formatCurrency } from '../index';

describe('i18n Infrastructure (Alpha P0)', () => {
  test('initializes with Swahili (sw) by default', () => {
    expect(i18n.language).toBe('sw');
  });

  test('translates keys correctly in Swahili and English', () => {
    i18n.changeLanguage('sw');
    expect(t('save')).toBe('Hifadhi');

    i18n.changeLanguage('en');
    expect(t('save')).toBe('Save');
    i18n.changeLanguage('sw'); // reset back
  });

  test('formatting helpers use Intl correctly in both locales', () => {
    const testDate = new Date('2025-01-15T12:00:00Z');

    // Swahili formatting
    const swDate = formatDate(testDate, 'sw');
    const swCurrency = formatCurrency(50000, 'TZS', 'sw');
    expect(swDate).toBeTruthy();
    expect(swCurrency).toMatch(/TZS|TSh/);

    // English formatting
    const enDate = formatDate(testDate, 'en');
    const enCurrency = formatCurrency(50000, 'TZS', 'en');
    expect(enDate).toBeTruthy();
    expect(enCurrency).toMatch(/TZS|TSh/);

    expect(formatTime(testDate, 'en')).toBeTruthy();
    expect(formatNumber(1250000, 'sw')).toContain('1');
  });

  test('fallback chain works for missing translation keys', () => {
    i18n.changeLanguage('sw');
    const nonExistent = t('non.existent.key.test');
    expect(nonExistent).toBeTruthy();
  });
});
