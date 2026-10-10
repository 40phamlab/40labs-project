// [PHASE: MVP]
import { describe, it, expect } from 'vitest';
import { normalizePhoneTZ, formatPhoneTZ } from '../phone';

describe('normalizePhoneTZ', () => {
  it('accepts 0XXXXXXXXX format', () => {
    expect(normalizePhoneTZ('0712345678')).toBe('255712345678');
  });

  it('accepts 255XXXXXXXXX format', () => {
    expect(normalizePhoneTZ('255712345678')).toBe('255712345678');
  });

  it('accepts +255XXXXXXXXX format', () => {
    expect(normalizePhoneTZ('+255712345678')).toBe('255712345678');
  });

  it('accepts 9-digit national number format', () => {
    expect(normalizePhoneTZ('712345678')).toBe('255712345678');
  });

  it('accepts 0XXXXXXXXX with spaces and dashes', () => {
    expect(normalizePhoneTZ('0712 345-678')).toBe('255712345678');
  });

  it('accepts +255 format with spaces', () => {
    expect(normalizePhoneTZ('+255 712 345 678')).toBe('255712345678');
  });

  it('accepts another operator (0655...)', () => {
    expect(normalizePhoneTZ('0655223344')).toBe('255655223344');
  });

  it('accepts with dashes', () => {
    expect(normalizePhoneTZ('0712-345-678')).toBe('255712345678');
  });

  it('rejects wrong prefix 133', () => {
    expect(normalizePhoneTZ('133712345678')).toBeNull();
  });

  it('rejects wrong country code +233', () => {
    expect(normalizePhoneTZ('+233712345678')).toBeNull();
  });

  it('rejects numbers that are too short (8 digits)', () => {
    expect(normalizePhoneTZ('071234567')).toBeNull();
  });

  it('rejects numbers that are too long', () => {
    expect(normalizePhoneTZ('07123456789')).toBeNull();
  });

  it('rejects numbers with invalid mobile prefix (08...)', () => {
    expect(normalizePhoneTZ('0812345678')).toBeNull();
  });

  it('rejects non-numeric strings', () => {
    expect(normalizePhoneTZ('abcdefghij')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(normalizePhoneTZ('')).toBeNull();
  });

  it('rejects invalid type (null)', () => {
    expect(normalizePhoneTZ(null as any)).toBeNull();
  });
});

describe('formatPhoneTZ', () => {
  it('formats E.164 digits to local display format', () => {
    expect(formatPhoneTZ('255712345678')).toBe('0712 345 678');
  });

  it('formats +E.164 input', () => {
    expect(formatPhoneTZ('+255712345678')).toBe('0712 345 678');
  });

  it('formats normalized 0XXXXXXXXX input', () => {
    expect(formatPhoneTZ('0712345678')).toBe('0712 345 678');
  });

  it('formats input with spaces and dashes', () => {
    expect(formatPhoneTZ('+255 712-345-678')).toBe('0712 345 678');
  });

  it('returns raw input if invalid', () => {
    expect(formatPhoneTZ('12345')).toBe('12345');
  });

  it('handles another valid number correctly', () => {
    expect(formatPhoneTZ('255655223344')).toBe('0655 223 344');
  });
});
