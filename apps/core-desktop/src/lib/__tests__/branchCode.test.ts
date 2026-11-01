import { describe, it, expect } from 'vitest';
import { generateBranchCode, normalizePlace } from '../branchCode';

describe('branchCode generator', () => {
  it('normalizes place and diacritics', () => {
    expect(normalizePlace('Mbaráli')).toBe('MBARALI');
    expect(normalizePlace('Ilala')).toBe('ILALA');
    expect(normalizePlace('Dar es Salaam')).toBe('DARSESALAAM');
  });

  it('generates first branch code', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    const code = generateBranchCode('AFYA-2847', [], 'Ilala', 'Ubungo Dar', now);
    expect(code).toBe('AFYA-2847-B01-ILA-2610');
  });

  it('handles sequence gaps and legacy codes', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    const existing = [
      'AFYA-2847-B01-ILA-2609',
      'AFYA-2847-B03-KIN-2609',
      'BR-002', // legacy row
    ];
    // max seq between B01, B03, BR-002 is 3 -> next is B04
    const code = generateBranchCode('AFYA-2847', existing, 'Kinondoni', 'Dar', now);
    expect(code).toBe('AFYA-2847-B04-KIN-2610');
  });

  it('handles short or empty district fallback to location', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    const code1 = generateBranchCode('AFYA-1001', [], 'Ki', 'Mwanza City', now);
    expect(code1).toBe('AFYA-1001-B01-MWA-2610');

    const code2 = generateBranchCode('AFYA-1001', [], null, 'Ab', now);
    expect(code2).toBe('AFYA-1001-B01-XXX-2610');
  });

  it('handles month/year rollover', () => {
    const dec = new Date('2026-12-31T23:59:59Z');
    expect(generateBranchCode('AFYA-1001', [], 'Ilala', 'Dar', dec)).toMatch(/-2612$/);

    const jan = new Date('2027-01-01T00:00:00Z');
    expect(generateBranchCode('AFYA-1001', [], 'Ilala', 'Dar', jan)).toMatch(/-2701$/);
  });
});
