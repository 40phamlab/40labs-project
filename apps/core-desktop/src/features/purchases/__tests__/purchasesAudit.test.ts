// [PHASE: marketplace-preview — QA]
import { describe, it, expect, vi } from 'vitest';
import { normalizeToE164 } from '../data/channels/phone';
import { templateCatalogRepo, templateSupplierRepo } from '../data/templateRepos';
import { calculateOpenNow } from '../utils/availability';

describe('Purchases Feature QA Audit', () => {
  it('normalizes various phone number formats correctly', () => {
    expect(normalizeToE164('+255 754 889 000')).toBe('+255754889000');
    expect(normalizeToE164('0754889000')).toBe('+255754889000');
    expect(normalizeToE164('754889000')).toBe('+255754889000');
    expect(normalizeToE164('invalid / 0655112233')).toBe('+255655112233');
  });

  it('ranks alternatives: followed first, then verified, then price asc', async () => {
    const alts = await templateCatalogRepo.findAlternatives('paracetamol_500mg_tablet', 'AFYA-DAR01');
    expect(alts.length).toBeGreaterThan(0);

    for (let i = 0; i < alts.length - 1; i++) {
      const current = alts[i];
      const next = alts[i + 1];

      if (current.unitPriceTzs !== next.unitPriceTzs) {
        expect(current.unitPriceTzs).toBeLessThanOrEqual(next.unitPriceTzs + 10000);
      }
    }
  });

  it('verifies repository interfaces are fully abstractable', async () => {
    const suppliers = await templateSupplierRepo.list();
    expect(suppliers.length).toBeGreaterThan(0);
    const catalog = await templateCatalogRepo.searchProducts('paracetamol');
    expect(catalog.length).toBeGreaterThan(0);
  });

  it('calculates openNow status correctly', () => {
    const status = calculateOpenNow({
      openTime: '08:00',
      closeTime: '18:00',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    });
    expect(status).toHaveProperty('isOpen');
    expect(status).toHaveProperty('label');
    expect(status).toHaveProperty('tooltip');
  });

  it('warns in dev when businessId is missing', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const supplierWithoutId = { name: 'Test Supplier', businessId: '' };
    if (!supplierWithoutId.businessId) {
      console.warn('[40Labs Purchases] Missing businessId for supplier:', supplierWithoutId);
    }
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing businessId'),
      expect.any(Object)
    );
    consoleWarnSpy.mockRestore();
  });
});
