import { describe, test, expect } from 'vitest';
import { formatMoney } from '../formatters';

describe('formatMoney', () => {
  test('formats normal numbers correctly with grouping and no decimals', () => {
    expect(formatMoney(1000)).toBe('1,000');
    expect(formatMoney(1500000)).toBe('1,500,000');
    expect(formatMoney(10_000_000)).toBe('10,000,000');
  });

  test('formats zero correctly', () => {
    expect(formatMoney(0)).toBe('0');
  });

  test('formats negative numbers correctly', () => {
    expect(formatMoney(-1000)).toBe('-1,000');
    expect(formatMoney(-5000000)).toBe('-5,000,000');
  });

  test('returns 0 for null, undefined, or NaN', () => {
    expect(formatMoney(null)).toBe('0');
    expect(formatMoney(undefined)).toBe('0');
    expect(formatMoney(NaN)).toBe('0');
  });

  test('handles non-integer inputs by rounding', () => {
    expect(formatMoney(1234.56)).toBe('1,235');
    expect(formatMoney(1000.4)).toBe('1,000');
  });
});
