import { describe, test, expect, beforeEach } from 'vitest';
import { getBusinessIdentity } from '../documents/shared/documentHeader';
import { createReceiptPdfBlob } from '../documents/generateReceiptPdf';
import { businessApi } from '../../../api/businessApi';
import type { Sale } from '@40labs/types';

const sampleSale: Sale = {
  id: 'sale_receipt_test',
  workspace_id: 'ws_1',
  branch_id: 'br_1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  customer_id: 'cust_1',
  lines: [
    {
      id: 'l_1',
      inventory_item_id: 'inv_1',
      medicine_id: 'med_1',
      medicine_name: 'Amoxicillin 500mg',
      quantity: 1,
      unit_price: 5000,
      subtotal: 5000,
      dispensed_by_user_id: 'u_1',
      is_prescription_dispense: false,
    },
  ],
  payment_method: 'cash',
  discount_amount: 0,
  discount_authorized_by_user_id: null,
  tax_amount: 0,
  grand_total: 5000,
  currency: 'TZS',
  synced_at: null,
};

describe('Dynamic Sales Receipt Identity System', () => {
  beforeEach(async () => {
    // Reset to default business state before each test
    await businessApi.update({
      name: 'AfyaBora Specialized Pharmacy',
      tin: '123-456-789',
      tmda_number: 'TMDA/FAR/2026/089',
      logo_url: 'https://afyabora.co.tz/logo.png',
      contacts: { mobile: '+255754000111', email: 'info@afyabora.co.tz', whatsapp: '+255754000111' },
      address: { region: 'Dar es Salaam', district: 'Kinondoni', place: 'Kijitonyama' },
    });
  });

  test('Pharmacy A with logo and complete profile populates identity correctly', async () => {
    const identity = await getBusinessIdentity();
    expect(identity.name).toBe('AfyaBora Specialized Pharmacy');
    expect(identity.tin).toBe('123-456-789');
    expect(identity.tmdaNumber).toBe('TMDA/FAR/2026/089');
    expect(identity.logoUrl).toBe('https://afyabora.co.tz/logo.png');
    expect(identity.addressLine).toContain('Kinondoni');

    const pdfBlob = await createReceiptPdfBlob({
      sale: sampleSale,
      customerLabel: 'Jane Doe',
      phone: '+255711222333',
      servedBy: 'Pharmacist John',
    });
    expect(pdfBlob).toBeInstanceOf(Blob);
    const pdfText = await pdfBlob.text();
    expect(pdfText).toContain('AFYABORA SPECIALIZED PHARMACY');
    expect(pdfText).toContain('TIN: 123-456-789');
    expect(pdfText).toContain('TMDA Reg: TMDA/FAR/2026/089');
  });

  test('Pharmacy B without logo and missing optional fields handles gracefully without placeholders', async () => {
    await businessApi.update({
      name: 'Mwananchi Health Chemists',
      tin: null,
      tmda_number: null,
      logo_url: null,
      contacts: { mobile: '+255722000000', email: '', whatsapp: '' },
      address: { region: 'Arusha', district: 'Njiro', place: 'Njiro Square' },
    });

    const identity = await getBusinessIdentity();
    expect(identity.name).toBe('Mwananchi Health Chemists');
    expect(identity.tin).toBeNull();
    expect(identity.tmdaNumber).toBeNull();
    expect(identity.logoUrl).toBeNull();

    const pdfBlob = await createReceiptPdfBlob({
      sale: sampleSale,
      customerLabel: 'Walk-in',
      phone: '',
      servedBy: 'Cashier',
    });
    expect(pdfBlob).toBeInstanceOf(Blob);
    const pdfText = await pdfBlob.text();
    expect(pdfText).toContain('MWANANCHI HEALTH CHEMISTS');
    expect(pdfText).not.toContain('TIN:');
    expect(pdfText).not.toContain('TMDA Reg:');
  });

  test('Pharmacy C with extremely long registered name handles correctly', async () => {
    const longName = 'Kilimanjaro International Community Health Pharmacy & Medical Diagnostic Services Ltd';
    await businessApi.update({
      name: longName,
      tin: '999-888-777',
      tmda_number: 'TMDA/KIL/2026/101',
      logo_url: null,
      contacts: { mobile: '+255733000000', email: 'kilimanjaro@health.co.tz', whatsapp: '' },
      address: { region: 'Kilimanjaro', district: 'Moshi', place: 'Town Centre' },
    });

    const identity = await getBusinessIdentity();
    expect(identity.name).toBe(longName);

    const pdfBlob = await createReceiptPdfBlob({
      sale: sampleSale,
      customerLabel: 'Patient X',
      phone: '+255744555666',
      servedBy: 'Dr. Kileo',
    });
    expect(pdfBlob).toBeInstanceOf(Blob);
    const pdfText = await pdfBlob.text();
    expect(pdfText).toContain('KILIMANJARO INTERNATIONAL COMMUNITY HEALTH PHARMACY & MEDICAL DIAGNOSTIC SERVICES LTD');
  });

  test('Multi-pharmacy switching correctly updates receipt identity', async () => {
    // Switch to Pharmacy X
    await businessApi.update({
      name: 'Zanzibar Sea Pharmacies',
      tin: 'ZAN-111',
      tmda_number: 'TMDA/ZAN/001',
    });
    let identity = await getBusinessIdentity();
    expect(identity.name).toBe('Zanzibar Sea Pharmacies');

    // Switch to Pharmacy Y
    await businessApi.update({
      name: 'Dodoma Capital Medics',
      tin: 'DOM-222',
      tmda_number: 'TMDA/DOM/002',
    });
    identity = await getBusinessIdentity();
    expect(identity.name).toBe('Dodoma Capital Medics');
    expect(identity.tin).toBe('DOM-222');
  });
});
