import type { Sale, InventoryItem, Medicine, PurchaseOrder, LabOrder, Customer } from '@40labs/types';
import { initialInventoryItems, initialMedicines } from '../inventory';
import { initialSales } from '../sales';
import { initialCustomers } from '../customers';
import { initialPurchaseOrders } from '../purchases';
import { initialLabOrders } from '../laboratory';

export interface PatientInTrack {
  customer_id: string;
  name: string;
  last_event: 'dispensed' | 'lab_ordered' | 'lab_ready';
  last_event_at: string;
  lab_order_id: string | null;
}

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

  salesTrend: { date: string; total: number }[];
  salesByCategory: { category: string; total: number }[];
  pendingPurchaseOrders: number;
  pendingLabOrders: number;
  patientsInTrack: PatientInTrack[];
}

export interface GetDashboardSummaryOptions {
  sales?: Sale[];
  inventoryItems?: InventoryItem[];
  medicines?: Medicine[];
  purchaseOrders?: PurchaseOrder[];
  labOrders?: LabOrder[];
  customers?: Customer[];
  nowDate?: Date;
}

export function getInitialDashboardSummary(
  options?: GetDashboardSummaryOptions
): DashboardSummary {
  const sales = options?.sales ?? initialSales;
  const inventoryItems = options?.inventoryItems ?? initialInventoryItems;
  const medicines = options?.medicines ?? initialMedicines;
  const purchaseOrders = options?.purchaseOrders ?? initialPurchaseOrders;
  const labOrders = options?.labOrders ?? initialLabOrders;
  const customers = options?.customers ?? initialCustomers;

  const now = options?.nowDate ?? new Date();
  const nowIsoStr = now.toISOString();
  const todayStr = nowIsoStr.slice(0, 10);
  const currentMonthStr = nowIsoStr.slice(0, 7);

  // 1. Today's Sales & Transactions
  const todaysSalesTotal = sales
    .filter((s) => s.created_at.slice(0, 10) === todayStr)
    .reduce((sum, s) => sum + s.grand_total, 0);

  const transactions = sales.length;

  // 2. Profit computation
  // (sell_price - cost_price) x qty
  // cost_price is buy_price from matching inventoryItem
  let todayProfit = 0;
  let monthProfit = 0;

  sales.forEach((s) => {
    const isToday = s.created_at.slice(0, 10) === todayStr;
    const isThisMonth = s.created_at.slice(0, 7) === currentMonthStr;

    if (!isToday && !isThisMonth) return;

    s.lines.forEach((line) => {
      const invItem = inventoryItems.find((item) => item.id === line.inventory_item_id);
      if (!invItem || typeof invItem.buy_price !== 'number') {
        console.warn(
          `[DashboardSummary] Cost price unavailable for line ${line.id} (inventory_item_id: ${line.inventory_item_id})`
        );
        return;
      }

      const costPrice = invItem.buy_price;
      const unitSellPrice = line.unit_price;
      const lineProfit = (unitSellPrice - costPrice) * line.quantity;

      if (isToday) {
        todayProfit += lineProfit;
      }
      if (isThisMonth) {
        monthProfit += lineProfit;
      }
    });
  });

  // 3. Supplier Debt from unpaid / partial PurchaseOrders
  const supplierDebt = purchaseOrders
    .filter((po) => po.status === 'draft' || po.status === 'pending')
    .reduce((sum, po) => sum + po.total_cost, 0);

  // 4. Customer Debt & Balance
  const customerDebt = customers.reduce(
    (sum, c) => sum + (c.outstanding_balance || 0),
    0
  );

  // 5. Inventory Metrics
  const inventoryValue = inventoryItems.reduce(
    (sum, item) => sum + item.sell_price * item.quantity,
    0
  );
  const totalStock = inventoryItems.reduce((sum, i) => sum + i.quantity, 0);
  const categories = new Set(medicines.map((m) => m.category)).size;
  const emptyItems = inventoryItems.filter((i) => i.quantity === 0).length;
  const expiredItems = inventoryItems.filter(
    (i) => new Date(i.expiry_date) < now
  ).length;

  // 6. Sales Trend (last 30 days daily)
  const salesTrend: { date: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dailyTotal = sales
      .filter((s) => s.created_at.slice(0, 10) === dateStr)
      .reduce((sum, s) => sum + s.grand_total, 0);
    salesTrend.push({ date: dateStr, total: dailyTotal });
  }

  // 7. Sales By Category (last 30 days)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const categoryTotals: Record<string, number> = {};

  sales
    .filter((s) => s.created_at.slice(0, 10) >= thirtyDaysAgoStr)
    .forEach((s) => {
      s.lines.forEach((line) => {
        const med =
          medicines.find((m) => m.id === line.medicine_id) ||
          medicines.find(
            (m) =>
              m.id ===
              inventoryItems.find((i) => i.id === line.inventory_item_id)?.medicine_id
          );
        const catName = med?.category || 'Uncategorized';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + line.subtotal;
      });
    });

  const salesByCategory = Object.entries(categoryTotals)
    .map(([category, total]) => ({
      category,
      total,
    }))
    .sort((a, b) => b.total - a.total);

  // 8. Pending POs & Pending Lab Orders
  const pendingPurchaseOrders = purchaseOrders.filter(
    (po) => po.status === 'draft' || po.status === 'pending'
  ).length;

  const pendingLabOrders = labOrders.filter((lo) => lo.status === 'pending').length;

  // 9. Patients in Track
  const patientEventMap = new Map<string, PatientInTrack>();

  customers.forEach((cust) => {
    let latestEvent: PatientInTrack | null = null;

    sales
      .filter((s) => s.customer_id === cust.id)
      .forEach((s) => {
        const candidate: PatientInTrack = {
          customer_id: cust.id,
          name: cust.full_name,
          last_event: 'dispensed',
          last_event_at: s.created_at,
          lab_order_id: null,
        };
        if (
          !latestEvent ||
          new Date(candidate.last_event_at) > new Date(latestEvent.last_event_at)
        ) {
          latestEvent = candidate;
        }
      });

    labOrders
      .filter((lo) => lo.customer_id === cust.id)
      .forEach((lo) => {
        let eventType: 'lab_ordered' | 'lab_ready' | null = null;
        if (lo.status === 'report_ready') {
          eventType = 'lab_ready';
        } else if (
          lo.status === 'pending' ||
          lo.status === 'sample_collected' ||
          lo.status === 'result_entered'
        ) {
          eventType = 'lab_ordered';
        }

        if (eventType) {
          const candidate: PatientInTrack = {
            customer_id: cust.id,
            name: cust.full_name,
            last_event: eventType,
            last_event_at: lo.updated_at || lo.created_at,
            lab_order_id: lo.id,
          };
          if (
            !latestEvent ||
            new Date(candidate.last_event_at) > new Date(latestEvent.last_event_at)
          ) {
            latestEvent = candidate;
          }
        }
      });

    if (latestEvent) {
      patientEventMap.set(cust.id, latestEvent);
    }
  });

  const patientsInTrack = Array.from(patientEventMap.values()).sort(
    (a, b) => new Date(b.last_event_at).getTime() - new Date(a.last_event_at).getTime()
  );

  return {
    monthlyProfit: monthProfit,
    profit: todayProfit,
    todaysSales: todaysSalesTotal,
    transactions,
    supplierDebt,
    customerDebt,
    customerBalance: customerDebt,
    inventoryValue,
    totalStock,
    categories,
    emptyItems,
    expiredItems,
    salesTrend,
    salesByCategory,
    pendingPurchaseOrders,
    pendingLabOrders,
    patientsInTrack,
  };
}
