import type { Sale, SaleLine } from '@40labs/types';
import { WORKSPACE_ID, BRANCH_ID, daysAgoIso } from '../constants';

function createSeededRng(seed = 42) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const rng = createSeededRng(1337);
const salesList: Sale[] = [];
let saleCounter = 1;

for (let day = 90; day >= 0; day--) {
  const dateObj = new Date(Date.now() - day * 86400000);
  const dayOfWeek = dateObj.getDay(); // 0 Sun, 5 Fri, 6 Sat
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  const numSales = isWeekend ? 3 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 2);

  for (let s = 0; s < numSales; s++) {
    const lines: SaleLine[] = [];
    const qty1 = 1 + Math.floor(rng() * 4);
    lines.push({
      id: `saleline_${String(saleCounter).padStart(3, '0')}_1`,
      inventory_item_id: 'inv_001',
      medicine_id: 'med_001',
      quantity: qty1,
      unit_price: 3000,
      subtotal: qty1 * 3000,
      dispensed_by_user_id: 'user_002',
      is_prescription_dispense: false,
    });

    if (day % 2 === 0) {
      const qty2 = 1 + Math.floor(rng() * 2);
      lines.push({
        id: `saleline_${String(saleCounter).padStart(3, '0')}_2`,
        inventory_item_id: 'inv_002',
        medicine_id: 'med_002',
        quantity: qty2,
        unit_price: 5000,
        subtotal: qty2 * 5000,
        dispensed_by_user_id: 'user_003',
        is_prescription_dispense: true,
      });
    }

    if (day % 5 === 0) {
      lines.push({
        id: `saleline_${String(saleCounter).padStart(3, '0')}_3`,
        inventory_item_id: 'inv_003',
        medicine_id: 'med_003',
        quantity: 1,
        unit_price: 12000,
        subtotal: 12000,
        dispensed_by_user_id: 'user_003',
        is_prescription_dispense: true,
      });
    }

    const grandTotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
    salesList.push({
      id: `sale_${String(saleCounter).padStart(3, '0')}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: daysAgoIso(day),
      updated_at: daysAgoIso(day),
      customer_id: s % 2 === 0 ? 'cust_001' : null,
      lines,
      payment_method: s % 3 === 0 ? 'mobile_money' : 'cash',
      discount_amount: 0,
      discount_authorized_by_user_id: null,
      tax_amount: 0,
      grand_total: grandTotal,
      currency: 'TZS',
      synced_at: daysAgoIso(day),
    });
    saleCounter++;
  }
}

export const initialSales: Sale[] = salesList;
