import { describe, test, expect } from 'vitest';
import { createReceiptPdfBlob } from '../documents/generateReceiptPdf';
import { createCustomerReportPdfBlob, formatInstructionSentence } from '../documents/generateCustomerReportPdf';
import type { Sale, DispensingInstruction } from '@40labs/types';

const sampleSale: Sale = {
  id: 'sale_test_999',
  workspace_id: 'ws_1',
  branch_id: 'br_1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  customer_id: 'cust_1',
  lines: [
    {
      id: 'line_1',
      inventory_item_id: 'inv_1',
      medicine_id: 'med_1',
      medicine_name: 'Paracetamol 500mg Extra Strength Long Name Medicine',
      quantity: 2,
      unit_price: 1000,
      subtotal: 2000,
      dispensed_by_user_id: 'user_1',
      is_prescription_dispense: false,
    },
  ],
  payment_method: 'cash',
  discount_amount: 0,
  discount_authorized_by_user_id: null,
  tax_amount: 0,
  grand_total: 2000,
  currency: 'TZS',
  synced_at: new Date().toISOString(),
};

describe('Sales Documents Generation Tests', () => {
  test('generates valid Receipt PDF blob without errors', async () => {
    const blob = await createReceiptPdfBlob({
      sale: sampleSale,
      customerLabel: 'John Doe',
      phone: '+255700000000',
      servedBy: 'Pharmacy Staff',
      fiscalReceipt: null,
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  test('generates Customer Report PDF blob with instructions', async () => {
    const instructions: DispensingInstruction[] = [
      {
        id: 'inst_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        sale_id: sampleSale.id,
        sale_line_id: 'line_1',
        customer_id: 'cust_1',
        dose: '1 tablet',
        frequency: 'twice_daily',
        timing: 'after_meal',
        duration_days: 5,
        storage: ['cool_dry', 'away_from_light'],
        note: 'Take with plenty of water',
        created_by: 'user_1',
        created_at: new Date().toISOString(),
        updated_by: 'user_1',
        updated_at: new Date().toISOString(),
      },
    ];

    const blob = await createCustomerReportPdfBlob({
      sale: sampleSale,
      customerLabel: 'John Doe',
      phone: '+255700000000',
      servedBy: 'Pharmacy Staff',
      instructions,
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  test('generates Customer Report PDF blob with zero instructions validly', async () => {
    const blob = await createCustomerReportPdfBlob({
      sale: sampleSale,
      customerLabel: 'John Doe',
      phone: '+255700000000',
      servedBy: 'Pharmacy Staff',
      instructions: [],
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  test('formats instruction sentences correctly', () => {
    const inst: DispensingInstruction = {
      id: 'inst_x',
      workspace_id: 'ws_1',
      branch_id: 'br_1',
      sale_id: 's_1',
      sale_line_id: 'l_1',
      customer_id: null,
      dose: '2 tablets',
      frequency: 'three_daily',
      timing: 'before_meal',
      duration_days: 7,
      storage: ['refrigerate'],
      note: null,
      created_by: 'u_1',
      created_at: '',
      updated_by: 'u_1',
      updated_at: '',
    };
    const sentence = formatInstructionSentence(inst);
    expect(sentence).toContain('2 tablets');
    expect(sentence).toContain('3× daily');
    expect(sentence).toContain('before meal');
    expect(sentence).toContain('7 days');
    expect(sentence).toContain('refrigerate');
  });
});
