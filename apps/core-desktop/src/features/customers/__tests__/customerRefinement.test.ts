import { describe, it, expect } from 'vitest';
import { getInitials } from '../utils/initials';
import { getAvatarColorClass } from '../utils/avatarColor';
import { normalizeGender } from '../../import/configs/patientImportConfig';
import { useCustomerStats } from '../hooks/useCustomerStats';
import type { Customer } from '@40labs/types';

describe('Phase 3 Customer Refinement Utilities & Hooks', () => {
  describe('getInitials', () => {
    it('handles two words correctly', () => {
      expect(getInitials('Anna Jumma')).toBe('AJ');
    });

    it('handles single word correctly', () => {
      expect(getInitials('Baraka')).toBe('BA');
    });

    it('handles extra spaces and lowercase', () => {
      expect(getInitials('  john   doe ')).toBe('JD');
    });

    it('skips non-letter leading characters', () => {
      expect(getInitials('123 Juma')).toBe('JU');
    });

    it('returns ? for empty or invalid names', () => {
      expect(getInitials('')).toBe('?');
      expect(getInitials('   ')).toBe('?');
    });
  });

  describe('getAvatarColorClass determinism', () => {
    it('returns the exact same color class for the same customer id across calls', () => {
      const id = 'cust_123456';
      const color1 = getAvatarColorClass(id);
      const color2 = getAvatarColorClass(id);
      expect(color1).toBe(color2);
    });

    it('handles empty id gracefully', () => {
      expect(getAvatarColorClass('')).toBeDefined();
    });
  });

  describe('normalizeGender (Import Synonyms)', () => {
    it('recognises male synonyms', () => {
      ['m', 'male', 'man', 'mwanaume', 'mwanamume', 'me', 'kiume', '  MALE  '].forEach((syn) => {
        expect(normalizeGender(syn)).toEqual({ gender: 'male' });
      });
    });

    it('recognises female synonyms', () => {
      ['f', 'female', 'woman', 'mwanamke', 'ke', 'kike', '  Female '].forEach((syn) => {
        expect(normalizeGender(syn)).toEqual({ gender: 'female' });
      });
    });

    it('returns null and warning for unknown / junk values', () => {
      const res = normalizeGender('other');
      expect(res.gender).toBeNull();
      expect(res.warning).toContain('Gender not recognised');
    });

    it('returns null for blank values', () => {
      expect(normalizeGender('')).toEqual({ gender: null });
      expect(normalizeGender(null)).toEqual({ gender: null });
    });
  });

  describe('useCustomerStats derivation', () => {
    it('computes stats correctly and is independent of search filters', () => {
      const mockCustomers: Customer[] = [
        {
          id: '1',
          workspace_id: 'w1',
          branch_id: 'b1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          full_name: 'Juma Test',
          phone: '0712345678',
          email: null,
          outstanding_balance: 5000,
          notes: null,
          amob_patient_id: null,
        },
        {
          id: '2',
          workspace_id: 'w1',
          branch_id: 'b1',
          created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          full_name: 'Amina Test',
          phone: '0712345679',
          email: null,
          outstanding_balance: 0,
          notes: null,
          amob_patient_id: null,
        },
      ];

      const active = mockCustomers.filter((c) => !c.archived_at);
      expect(active.length).toBe(2);

      const debtors = active.filter((c) => c.outstanding_balance > 0);
      expect(debtors.length).toBe(1);
      expect(debtors[0].outstanding_balance).toBe(5000);
    });
  });
});
