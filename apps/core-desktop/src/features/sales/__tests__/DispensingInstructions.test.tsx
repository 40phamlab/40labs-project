import { describe, test, expect } from 'vitest';
import { salesApi } from '../../../api/salesApi';
import type { DispensingInstruction } from '@40labs/types';

describe('Dispensing Instructions & Sale Totals Immutability Tests', () => {
  test('upsert is idempotent per sale_line_id', async () => {
    const saleId = 'sale_test_100';
    const lineId = 'line_123';

    const inst1: DispensingInstruction = {
      id: 'inst_1',
      workspace_id: 'ws_test',
      branch_id: 'br_test',
      sale_id: saleId,
      sale_line_id: lineId,
      customer_id: null,
      dose: '1 tablet',
      frequency: 'once_daily',
      timing: 'after_meal',
      duration_days: 7,
      storage: ['cool_dry'],
      note: 'Take with water',
      created_by: 'user_001',
      created_at: new Date().toISOString(),
      updated_by: 'user_001',
      updated_at: new Date().toISOString(),
    };

    const inst2: DispensingInstruction = {
      ...inst1,
      dose: '2 tablets', // updated dose
      updated_at: new Date().toISOString(),
    };

    // First save
    await salesApi.updateInstructions(saleId, [inst1]);
    let saved = await salesApi.getInstructions(saleId);
    expect(saved.length).toBe(1);
    expect(saved[0].dose).toBe('1 tablet');

    // Second save (upsert with same sale_line_id)
    await salesApi.updateInstructions(saleId, [inst2]);
    saved = await salesApi.getInstructions(saleId);
    expect(saved.length).toBe(1);
    expect(saved[0].dose).toBe('2 tablets');
  });

  test('instruction edit never alters sale totals', async () => {
    const sale = await salesApi.create({
      customerId: null,
      lines: [
        {
          id: 'line_abc',
          inventory_item_id: 'inv_1',
          medicine_id: 'med_1',
          quantity: 2,
          unit_price: 5000,
          subtotal: 10000,
          dispensed_by_user_id: 'user_001',
          is_prescription_dispense: true,
        },
      ],
      paymentMethod: 'cash',
      discountAmount: 1000,
    });

    const initialGrandTotal = sale.grand_total;

    // Add / update instructions
    const instruction: DispensingInstruction = {
      id: 'inst_abc',
      workspace_id: sale.workspace_id,
      branch_id: sale.branch_id,
      sale_id: sale.id,
      sale_line_id: 'line_abc',
      customer_id: sale.customer_id,
      dose: '5 ml',
      frequency: 'twice_daily',
      timing: 'before_meal',
      duration_days: 3,
      storage: ['refrigerate'],
      note: 'Shake well before use',
      created_by: 'user_001',
      created_at: new Date().toISOString(),
      updated_by: 'user_001',
      updated_at: new Date().toISOString(),
    };

    await salesApi.updateInstructions(sale.id, [instruction]);

    // Retrieve sale and check grand total
    const fetchedSale = await salesApi.get(sale.id);
    expect(fetchedSale).not.toBeNull();
    expect(fetchedSale?.grand_total).toBe(initialGrandTotal);
    expect(fetchedSale?.grand_total).toBe(9000);
  });
});
