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

  test('formatting helpers use Intl correctly', () => {
    const testDate = new Date('2025-01-15T12:00:00Z');
    expect(formatDate(testDate, 'en')).toBeTruthy();
    expect(formatTime(testDate, 'en')).toBeTruthy();
    expect(formatNumber(1250000, 'sw')).toContain('1');
    expect(formatCurrency(50000, 'TZS', 'sw')).toMatch(/TZS|TSh/);
  });
});
