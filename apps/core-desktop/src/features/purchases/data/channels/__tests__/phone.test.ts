// [PHASE: marketplace-preview — Data foundation]
import { describe, it, expect } from 'vitest';
import { normalizeToE164 } from '../phone';

describe('normalizeToE164', () => {
  it('normalizes formatted Tanzanian numbers with slashes', () => {
    expect(normalizeToE164('+255 789 234 123 / 670 000 000')).toBe('+255789234123');
  });

  it('handles local numbers starting with 0', () => {
    expect(normalizeToE164('0754 889 000')).toBe('+255754889000');
  });

  it('handles 9-digit local numbers without leading 0', () => {
    expect(normalizeToE164('711 223 344')).toBe('+255711223344');
  });

  it('handles comma-separated numbers and returns first valid', () => {
    expect(normalizeToE164('invalid / 0655112233, +255 700 000 000')).toBe('+255655112233');
  });

  it('returns null for empty or invalid strings', () => {
    expect(normalizeToE164('')).toBeNull();
    expect(normalizeToE164('abc')).toBeNull();
  });
});
