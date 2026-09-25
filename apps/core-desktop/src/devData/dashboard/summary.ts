import { initialInventoryItems, initialMedicines } from '../inventory';
import { initialSales } from '../sales';
import { initialCustomers } from '../customers';
import { nowIso } from '../constants';

export interface DashboardSummary {
  monthlyProfit: number;
  profit: number;
  todaysSales: number;
  transactions: number;
  supplierDebt: number;
  customerDebt: number;
  customerBalance: number;
  inventoryValue: number;
  totalStock: number;
  categories: number;
  emptyItems: number;
  expiredItems: number;
}

export function getInitialDashboardSummary(): DashboardSummary {
  const now = nowIso();
  const inventoryValue = initialInventoryItems.reduce(
    (sum, item) => sum + item.sell_price * item.quantity,
    0,
  );
  const todaysSalesTotal = initialSales
    .filter((s) => s.created_at.slice(0, 10) === now.slice(0, 10))
    .reduce((sum, s) => sum + s.grand_total, 0);
  const customerDebt = initialCustomers.reduce((sum, c) => sum + c.outstanding_balance, 0);
  const expiredItems = initialInventoryItems.filter(
    (i) => new Date(i.expiry_date) < new Date(),
  ).length;
  const emptyItems = initialInventoryItems.filter((i) => i.quantity === 0).length;
  const categories = new Set(initialMedicines.map((m) => m.category)).size;

  return {
    monthlyProfit: 1500000,
    profit: 1500000,
    todaysSales: todaysSalesTotal,
    transactions: initialSales.length,
    supplierDebt: 50000,
    customerDebt,
    customerBalance: customerDebt,
    inventoryValue,
    totalStock: initialInventoryItems.reduce((sum, i) => sum + i.quantity, 0),
    categories,
    emptyItems,
    expiredItems,
  };
}
