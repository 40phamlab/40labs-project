import { describe, test, expect, beforeEach } from 'vitest';
import { renderBusinessHeaderHtml, renderDocumentFooterHtml, resolveDocumentIdentity } from '../documentDesignSystem';
import { businessApi } from '../../../api/businessApi';

describe('Unified Report & Receipt Design System', () => {
  beforeEach(async () => {
    await businessApi.update({
      name: 'St. Jude Community Pharmacy & Health',
      tin: '987-654-321',
      tmda_number: 'TMDA/DSM/2026/555',
      logo_url: 'https://stjude.co.tz/logo.png',
      contacts: { mobile: '+255711999888', email: 'support@stjude.co.tz', whatsapp: '+255711999888' },
      address: { region: 'Dar es Salaam', district: 'Ilala', place: 'Carrier' },
    });
  });

  test('resolves document identity correctly from registered business profile without 40Labs override', async () => {
    const identity = await resolveDocumentIdentity();
    expect(identity.name).toBe('St. Jude Community Pharmacy & Health');
    expect(identity.tin).toBe('987-654-321');
    expect(identity.tmdaNumber).toBe('TMDA/DSM/2026/555');
    expect(identity.logoUrl).toBe('https://stjude.co.tz/logo.png');
    expect(identity.addressLine).toContain('Ilala');
  });

  test('renders business header HTML correctly with logo and branding', async () => {
    const identity = await resolveDocumentIdentity();
    const headerHtml = renderBusinessHeaderHtml({
      business: identity,
      documentTitle: 'Financial Balance & Sales Report',
      subtitle: 'Q1 2026 Comprehensive Breakdown',
      categoryLabel: 'Financial & POS',
      periodLabel: 'THIS QUARTER',
      generatedAt: '2026-03-01 12:00:00',
      documentId: 'REP_2026_001',
    });

    expect(headerHtml).toContain('St. Jude Community Pharmacy &amp; Health');
    expect(headerHtml).toContain('Financial Balance &amp; Sales Report');
    expect(headerHtml).toContain('https://stjude.co.tz/logo.png');
    expect(headerHtml).toContain('TIN: 987-654-321');
    expect(headerHtml).toContain('TMDA: TMDA/DSM/2026/555');
    expect(headerHtml).not.toContain('40Labs Core POS as Business Owner');
  });

  test('renders document footer correctly with registered business attribution', () => {
    const footerHtml = renderDocumentFooterHtml('St. Jude Community Pharmacy & Health', 'Page 1 of 3');
    expect(footerHtml).toContain('St. Jude Community Pharmacy &amp; Health');
    expect(footerHtml).toContain('Page 1 of 3');
    expect(footerHtml).toContain('Powered by 40Labs Core POS');
  });
});
