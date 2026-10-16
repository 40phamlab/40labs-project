// [phase: 8D] Extended Dashboard Summary with 8 domain KPIs
import type {
  Sale,
  InventoryItem,
  Medicine,
  PurchaseOrder,
  LabOrder,
  Customer,
  DashboardKpi,
} from '@40labs/types';
import { initialInventoryItems, initialMedicines } from '../inventory';
import { initialSales } from '../sales';
import { initialCustomers } from '../customers';
import { initialPurchaseOrders } from '../purchases';
import { initialLabOrders } from '../laboratory';
import type { ScreenId } from '../../stores/useNavStore';
import { calculatePctDelta, buildKpiDelta } from '../../features/dashboard/lib/deltaUtil';

export interface PatientInTrack {
  customer_id: string;
  name: string;
  last_event: 'dispensed' | 'lab_ordered' | 'lab_ready';
  last_event_at: string;
  lab_order_id: string | null;
}

export type PendingItemKind = 'purchase_order' | 'lab_order' | 'held_sale';

export interface PendingItem {
  id: string;
  kind: PendingItemKind;
  title: string;
  subtitle: string;
  created_at: string;
  target: ScreenId;
}

export interface DashboardSummary {
  // [phase: 8D] 8 Domain KPIs
  kpis: {
    sales: DashboardKpi;
    profit: DashboardKpi;
    customers: DashboardKpi;
    stock: DashboardKpi;
    expiry: DashboardKpi;
    lab: DashboardKpi;
    balances: DashboardKpi;
    purchases: DashboardKpi;
  };
  kpiList: DashboardKpi[];

  // Retained for backwards compatibility
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

  pending: {
    purchaseOrders: PendingItem[];
    labOrders: PendingItem[];
    total: number;
  };
  patientsInTrack: PatientInTrack[];

  // Raw data sources for chart building and local recomputation
  sales: Sale[];
  inventoryItems: InventoryItem[];
  medicines: Medicine[];
  purchaseOrdersList: PurchaseOrder[];
  labOrdersList: LabOrder[];
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

function safeNum(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(num) ? num : 0;
}

function getDateStrOffset(base: Date, daysOffset: number): string {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d.toISOString().slice(0, 10);
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

  // Date arrays for sparkline (7 days) and history (5 days)
  const sparklineOffsets = [-6, -5, -4, -3, -2, -1, 0];
  const historyOffsets = [-4, -3, -2, -1, 0];

  const sparklineDates = sparklineOffsets.map((offset) => getDateStrOffset(now, offset));
  const historyDates = historyOffsets.map((offset) => getDateStrOffset(now, offset));

  // Helper to calculate line profit
  const calculateLineProfit = (s: Sale): number => {
    if (!s || !s.lines) return 0;
    return s.lines.reduce((lineSum, line) => {
      if (!line) return lineSum;
      const invItem = inventoryItems.find(
        (item) =>
          item.id === line.inventory_item_id ||
          (line.medicine_id && item.medicine_id === line.medicine_id)
      );

      if (!invItem || typeof invItem.buy_price !== 'number' || !Number.isFinite(invItem.buy_price)) {
        console.warn(
          `[DashboardSummary] Cost price unavailable for line ${line.id} (inventory_item_id: ${line.inventory_item_id}, medicine_id: ${line.medicine_id})`
        );
        return lineSum;
      }

      const costPrice = safeNum(invItem.buy_price);
      const unitSellPrice = safeNum(line.unit_price);
      const qty = safeNum(line.quantity);
      const lineProfit = (unitSellPrice - costPrice) * qty;
      return lineSum + (Number.isFinite(lineProfit) ? lineProfit : 0);
    }, 0);
  };

  // --- 1. KPI: SALES ---
  const todaySalesList = sales.filter((s) => s?.created_at && s.created_at.slice(0, 10) === todayStr);
  const todaysSalesTotal = todaySalesList.reduce((sum, s) => sum + safeNum(s.grand_total), 0);
  const todaySalesCount = todaySalesList.length;

  const yesterdayStr = getDateStrOffset(now, -1);
  const yesterdaySalesList = sales.filter((s) => s?.created_at && s.created_at.slice(0, 10) === yesterdayStr);
  const yesterdaySalesTotal = yesterdaySalesList.reduce((sum, s) => sum + safeNum(s.grand_total), 0);

  const salesSpark = sparklineDates.map((dateStr) => {
    return sales
      .filter((s) => s?.created_at && s.created_at.slice(0, 10) === dateStr)
      .reduce((sum, s) => sum + safeNum(s.grand_total), 0);
  });

  const salesHistory = historyDates.map((dateStr, idx) => {
    const val = sales
      .filter((s) => s?.created_at && s.created_at.slice(0, 10) === dateStr)
      .reduce((sum, s) => sum + safeNum(s.grand_total), 0);
    const prevDateStr = getDateStrOffset(now, historyOffsets[idx] - 1);
    const prevVal = sales
      .filter((s) => s?.created_at && s.created_at.slice(0, 10) === prevDateStr)
      .reduce((sum, s) => sum + safeNum(s.grand_total), 0);
    return {
      date: dateStr,
      value: val,
      pct: calculatePctDelta(val, prevVal),
    };
  });

  const kpiSales: DashboardKpi = {
    id: 'sales',
    value: safeNum(todaysSalesTotal),
    format: 'money',
    delta: buildKpiDelta(todaysSalesTotal, yesterdaySalesTotal, 'up-good', 'vs_yesterday'),
    spark: salesSpark,
    history: salesHistory,
    breakdown: [
      { labelKey: 'dashboard.kpis.sales.transactions', value: todaySalesCount, format: 'count' },
      {
        labelKey: 'dashboard.kpis.sales.avgBasket',
        value: todaySalesCount > 0 ? safeNum(todaysSalesTotal / todaySalesCount) : 0,
        format: 'money',
      },
    ],
  };

  // --- 2. KPI: PROFIT ---
  let todayProfit = 0;
  let monthProfit = 0;

  sales.forEach((s) => {
    if (!s || !s.created_at) return;
    const isToday = s.created_at.slice(0, 10) === todayStr;
    const isThisMonth = s.created_at.slice(0, 7) === currentMonthStr;

    if (!isToday && !isThisMonth) return;

    const p = calculateLineProfit(s);
    if (isToday) todayProfit += p;
    if (isThisMonth) monthProfit += p;
  });

  // Calculate same span last month profit
  const nowYear = now.getUTCFullYear();
  const nowMonth = now.getUTCMonth(); // 0-indexed
  const prevMonthObj = new Date(Date.UTC(nowYear, nowMonth - 1, 1));
  const prevMonthStr = prevMonthObj.toISOString().slice(0, 7);
  const currentDayOfMonth = now.getUTCDate();

  let prevMonthSpanProfit = 0;
  sales.forEach((s) => {
    if (!s || !s.created_at) return;
    if (s.created_at.slice(0, 7) === prevMonthStr) {
      const saleDay = Number(s.created_at.slice(8, 10));
      if (saleDay <= currentDayOfMonth) {
        prevMonthSpanProfit += calculateLineProfit(s);
      }
    }
  });

  const profitSpark = sparklineDates.map((dateStr) => {
    return sales
      .filter((s) => s?.created_at && s.created_at.slice(0, 10) === dateStr)
      .reduce((sum, s) => sum + calculateLineProfit(s), 0);
  });

  const profitHistory = historyDates.map((dateStr, idx) => {
    const val = sales
      .filter((s) => s?.created_at && s.created_at.slice(0, 10) === dateStr)
      .reduce((sum, s) => sum + calculateLineProfit(s), 0);
    const prevDateStr = getDateStrOffset(now, historyOffsets[idx] - 1);
    const prevVal = sales
      .filter((s) => s?.created_at && s.created_at.slice(0, 10) === prevDateStr)
      .reduce((sum, s) => sum + calculateLineProfit(s), 0);
    return {
      date: dateStr,
      value: val,
      pct: calculatePctDelta(val, prevVal),
    };
  });

  const marginPct = todaysSalesTotal > 0 ? (todayProfit / todaysSalesTotal) * 100 : 0;

  const kpiProfit: DashboardKpi = {
    id: 'profit',
    value: safeNum(monthProfit),
    format: 'money',
    delta: buildKpiDelta(monthProfit, prevMonthSpanProfit, 'up-good', 'vs_last_month'),
    spark: profitSpark,
    history: profitHistory,
    breakdown: [
      { labelKey: 'dashboard.kpis.profit.today', value: safeNum(todayProfit), format: 'money' },
      { labelKey: 'dashboard.kpis.profit.marginPct', value: safeNum(Math.round(marginPct * 10) / 10), format: 'count' },
    ],
  };

  // --- 3. KPI: CUSTOMERS ---
  const totalCustomersCount = customers.length;
  const newCustomersToday = customers.filter(
    (c) => c?.created_at && c.created_at.slice(0, 10) === todayStr
  ).length;

  const customersYesterdayCount = customers.filter(
    (c) => c?.created_at && c.created_at.slice(0, 10) <= yesterdayStr
  ).length;

  const customersSpark = sparklineDates.map((dateStr) => {
    return customers.filter((c) => c?.created_at && c.created_at.slice(0, 10) <= dateStr).length;
  });

  const customersHistory = historyDates.map((dateStr, idx) => {
    const val = customers.filter((c) => c?.created_at && c.created_at.slice(0, 10) <= dateStr).length;
    const prevDateStr = getDateStrOffset(now, historyOffsets[idx] - 1);
    const prevVal = customers.filter((c) => c?.created_at && c.created_at.slice(0, 10) <= prevDateStr).length;
    return {
      date: dateStr,
      value: val,
      pct: calculatePctDelta(val, prevVal),
    };
  });

  let maleCount = 0;
  let femaleCount = 0;
  let unspecifiedCount = 0;
  let missingGenderFieldCount = 0;

  customers.forEach((c) => {
    if (!c) return;
    const rawGender = (c as unknown as Record<string, unknown>).gender ?? c.sex;
    if (rawGender === undefined || rawGender === null) {
      missingGenderFieldCount++;
    }
    if (typeof rawGender === 'string') {
      const lower = rawGender.toLowerCase();
      if (lower.includes('female')) {
        femaleCount++;
      } else if (lower.includes('male')) {
        maleCount++;
      } else {
        unspecifiedCount++;
      }
    } else {
      unspecifiedCount++;
    }
  });

  if (missingGenderFieldCount > 0) {
    console.warn(
      `[phase: 8D] [Dashboard] ${missingGenderFieldCount} customer records lack explicit 'gender' property; counted under unspecified.`
    );
  }

  const kpiCustomers: DashboardKpi = {
    id: 'customers',
    value: totalCustomersCount,
    format: 'count',
    delta: buildKpiDelta(totalCustomersCount, customersYesterdayCount, 'up-good', 'vs_yesterday'),
    spark: customersSpark,
    history: customersHistory,
    breakdown: [
      { labelKey: 'dashboard.kpis.customers.newToday', value: newCustomersToday, format: 'count' },
      { labelKey: 'dashboard.kpis.customers.male', value: maleCount, format: 'count' },
      { labelKey: 'dashboard.kpis.customers.female', value: femaleCount, format: 'count' },
      { labelKey: 'dashboard.kpis.customers.unspecified', value: unspecifiedCount, format: 'count' },
    ],
  };

  // --- 4. KPI: STOCK ---
  const activeSkusCount = inventoryItems.length;
  const activeSkusYesterday = inventoryItems.filter(
    (i) => i?.created_at && i.created_at.slice(0, 10) <= yesterdayStr
  ).length;

  const lowStockCount = inventoryItems.filter(
    (i) => safeNum(i.quantity) > 0 && safeNum(i.quantity) <= safeNum(i.low_stock_threshold)
  ).length;

  const outOfStockCount = inventoryItems.filter((i) => safeNum(i.quantity) === 0).length;

  const totalStockValue = inventoryItems.reduce(
    (sum, item) => sum + safeNum(item.sell_price) * safeNum(item.quantity),
    0
  );

  const stockSpark = sparklineDates.map((dateStr) => {
    return inventoryItems.filter((i) => i?.created_at && i.created_at.slice(0, 10) <= dateStr).length;
  });

  const stockHistory = historyDates.map((dateStr, idx) => {
    const val = inventoryItems.filter((i) => i?.created_at && i.created_at.slice(0, 10) <= dateStr).length;
    const prevDateStr = getDateStrOffset(now, historyOffsets[idx] - 1);
    const prevVal = inventoryItems.filter((i) => i?.created_at && i.created_at.slice(0, 10) <= prevDateStr).length;
    return {
      date: dateStr,
      value: val,
      pct: calculatePctDelta(val, prevVal),
    };
  });

  const kpiStock: DashboardKpi = {
    id: 'stock',
    value: activeSkusCount,
    format: 'count',
    delta: buildKpiDelta(activeSkusCount, activeSkusYesterday, 'up-good', 'vs_yesterday'),
    spark: stockSpark,
    history: stockHistory,
    breakdown: [
      { labelKey: 'dashboard.kpis.stock.lowStock', value: lowStockCount, format: 'count' },
      { labelKey: 'dashboard.kpis.stock.outOfStock', value: outOfStockCount, format: 'count' },
      { labelKey: 'dashboard.kpis.stock.stockValue', value: safeNum(totalStockValue), format: 'money' },
    ],
  };

  // --- 5. KPI: EXPIRY ---
  const dayMs = 24 * 60 * 60 * 1000;
  const nowMs = now.getTime();

  const getDaysToExpiry = (expiryDateStr: string | null | undefined, referenceMs: number = nowMs): number | null => {
    if (!expiryDateStr) return null;
    const expDate = new Date(expiryDateStr);
    if (Number.isNaN(expDate.getTime())) return null;
    return Math.floor((expDate.getTime() - referenceMs) / dayMs);
  };

  const expiring90Count = inventoryItems.filter((i) => {
    const days = getDaysToExpiry(i.expiry_date);
    return days !== null && days >= 0 && days <= 90;
  }).length;

  const yesterdayMs = nowMs - dayMs;
  const expiring90Yesterday = inventoryItems.filter((i) => {
    const days = getDaysToExpiry(i.expiry_date, yesterdayMs);
    return days !== null && days >= 0 && days <= 90;
  }).length;

  const expiredStockValue = inventoryItems
    .filter((i) => {
      const days = getDaysToExpiry(i.expiry_date);
      return days !== null && days < 0;
    })
    .reduce((sum, item) => sum + safeNum(item.sell_price) * safeNum(item.quantity), 0);

  const expiring30Count = inventoryItems.filter((i) => {
    const days = getDaysToExpiry(i.expiry_date);
    return days !== null && days >= 0 && days <= 30;
  }).length;

  const expirySpark = sparklineDates.map((_, idx) => {
    const refMs = nowMs + sparklineOffsets[idx] * dayMs;
    return inventoryItems.filter((i) => {
      const days = getDaysToExpiry(i.expiry_date, refMs);
      return days !== null && days >= 0 && days <= 90;
    }).length;
  });

  const expiryHistory = historyDates.map((dateStr, idx) => {
    const refMs = nowMs + historyOffsets[idx] * dayMs;
    const val = inventoryItems.filter((i) => {
      const days = getDaysToExpiry(i.expiry_date, refMs);
      return days !== null && days >= 0 && days <= 90;
    }).length;

    const prevRefMs = refMs - dayMs;
    const prevVal = inventoryItems.filter((i) => {
      const days = getDaysToExpiry(i.expiry_date, prevRefMs);
      return days !== null && days >= 0 && days <= 90;
    }).length;

    return {
      date: dateStr,
      value: val,
      pct: calculatePctDelta(val, prevVal),
    };
  });

  const kpiExpiry: DashboardKpi = {
    id: 'expiry',
    value: expiring90Count,
    format: 'count',
    delta: buildKpiDelta(expiring90Count, expiring90Yesterday, 'down-good', 'vs_yesterday'),
    spark: expirySpark,
    history: expiryHistory,
    breakdown: [
      { labelKey: 'dashboard.kpis.expiry.expiredValue', value: safeNum(expiredStockValue), format: 'money' },
      { labelKey: 'dashboard.kpis.expiry.expiring30', value: expiring30Count, format: 'count' },
      { labelKey: 'dashboard.kpis.expiry.expiring90', value: expiring90Count, format: 'count' },
    ],
  };

  // --- 6. KPI: LAB ---
  const labOrdersTodayList = labOrders.filter(
    (lo) => lo?.created_at && lo.created_at.slice(0, 10) === todayStr
  );
  const labTestsTodayCount = labOrdersTodayList.length;

  const labOrdersYesterdayCount = labOrders.filter(
    (lo) => lo?.created_at && lo.created_at.slice(0, 10) === yesterdayStr
  ).length;

  const labPendingToday = labOrdersTodayList.filter(
    (lo) => lo.status === 'pending' || lo.status === 'sample_collected'
  ).length;

  const labReadyToday = labOrdersTodayList.filter(
    (lo) => lo.status === 'result_entered' || lo.status === 'report_ready'
  ).length;

  const labCancelledToday = labOrdersTodayList.filter((lo) => lo.status === 'cancelled').length;

  const labSpark = sparklineDates.map((dateStr) => {
    return labOrders.filter((lo) => lo?.created_at && lo.created_at.slice(0, 10) === dateStr).length;
  });

  const labHistory = historyDates.map((dateStr, idx) => {
    const val = labOrders.filter((lo) => lo?.created_at && lo.created_at.slice(0, 10) === dateStr).length;
    const prevDateStr = getDateStrOffset(now, historyOffsets[idx] - 1);
    const prevVal = labOrders.filter((lo) => lo?.created_at && lo.created_at.slice(0, 10) === prevDateStr).length;
    return {
      date: dateStr,
      value: val,
      pct: calculatePctDelta(val, prevVal),
    };
  });

  const kpiLab: DashboardKpi = {
    id: 'lab',
    value: labTestsTodayCount,
    format: 'count',
    delta: buildKpiDelta(labTestsTodayCount, labOrdersYesterdayCount, 'up-good', 'vs_yesterday'),
    spark: labSpark,
    history: labHistory,
    breakdown: [
      { labelKey: 'dashboard.kpis.lab.pending', value: labPendingToday, format: 'count' },
      { labelKey: 'dashboard.kpis.lab.ready', value: labReadyToday, format: 'count' },
      { labelKey: 'dashboard.kpis.lab.cancelled', value: labCancelledToday, format: 'count' },
    ],
  };

  // --- 7. KPI: BALANCES (MADENI) ---
  const pendingPurchaseOrdersList = purchaseOrders.filter(
    (po) => po && (po.status === 'draft' || po.status === 'pending')
  );
  const supplierDebt = pendingPurchaseOrdersList.reduce((sum, po) => sum + safeNum(po.total_cost), 0);
  const customerDebt = customers.reduce((sum, c) => sum + safeNum(c.outstanding_balance), 0);

  const netBalance = customerDebt - supplierDebt;

  // Estimate yesterday's balance
  const supplierDebtYesterday = purchaseOrders
    .filter((po) => po && (po.status === 'draft' || po.status === 'pending') && po.created_at.slice(0, 10) <= yesterdayStr)
    .reduce((sum, po) => sum + safeNum(po.total_cost), 0);
  const customerDebtYesterday = customers
    .filter((c) => c && c.created_at.slice(0, 10) <= yesterdayStr)
    .reduce((sum, c) => sum + safeNum(c.outstanding_balance), 0);
  const netBalanceYesterday = customerDebtYesterday - supplierDebtYesterday;

  const balancesSpark = sparklineDates.map((dateStr) => {
    const supDebtD = purchaseOrders
      .filter((po) => po && (po.status === 'draft' || po.status === 'pending') && po.created_at.slice(0, 10) <= dateStr)
      .reduce((sum, po) => sum + safeNum(po.total_cost), 0);
    const custDebtD = customers
      .filter((c) => c && c.created_at.slice(0, 10) <= dateStr)
      .reduce((sum, c) => sum + safeNum(c.outstanding_balance), 0);
    return custDebtD - supDebtD;
  });

  const balancesHistory = historyDates.map((dateStr, idx) => {
    const supDebtD = purchaseOrders
      .filter((po) => po && (po.status === 'draft' || po.status === 'pending') && po.created_at.slice(0, 10) <= dateStr)
      .reduce((sum, po) => sum + safeNum(po.total_cost), 0);
    const custDebtD = customers
      .filter((c) => c && c.created_at.slice(0, 10) <= dateStr)
      .reduce((sum, c) => sum + safeNum(c.outstanding_balance), 0);
    const val = custDebtD - supDebtD;

    const prevDateStr = getDateStrOffset(now, historyOffsets[idx] - 1);
    const prevSupDebt = purchaseOrders
      .filter((po) => po && (po.status === 'draft' || po.status === 'pending') && po.created_at.slice(0, 10) <= prevDateStr)
      .reduce((sum, po) => sum + safeNum(po.total_cost), 0);
    const prevCustDebt = customers
      .filter((c) => c && c.created_at.slice(0, 10) <= prevDateStr)
      .reduce((sum, c) => sum + safeNum(c.outstanding_balance), 0);
    const prevVal = prevCustDebt - prevSupDebt;

    return {
      date: dateStr,
      value: val,
      pct: calculatePctDelta(val, prevVal),
    };
  });

  const kpiBalances: DashboardKpi = {
    id: 'balances',
    value: safeNum(netBalance),
    format: 'money',
    delta: buildKpiDelta(netBalance, netBalanceYesterday, 'down-good', 'vs_yesterday'),
    spark: balancesSpark,
    history: balancesHistory,
    breakdown: [
      { labelKey: 'dashboard.kpis.balances.receivable', value: safeNum(customerDebt), format: 'money' },
      { labelKey: 'dashboard.kpis.balances.payable', value: safeNum(supplierDebt), format: 'money' },
    ],
  };

  // --- 8. KPI: PURCHASES ---
  const openPosCount = pendingPurchaseOrdersList.length;

  const openPosYesterdayCount = purchaseOrders.filter(
    (po) => po && (po.status === 'draft' || po.status === 'pending') && po.created_at.slice(0, 10) <= yesterdayStr
  ).length;

  const pendingApprovalCount = purchaseOrders.filter((po) => po && po.status === 'draft').length;
  const awaitingDeliveryCount = purchaseOrders.filter((po) => po && po.status === 'pending').length;

  const purchasesSpark = sparklineDates.map((dateStr) => {
    return purchaseOrders.filter(
      (po) => po && (po.status === 'draft' || po.status === 'pending') && po.created_at.slice(0, 10) <= dateStr
    ).length;
  });

  const purchasesHistory = historyDates.map((dateStr, idx) => {
    const val = purchaseOrders.filter(
      (po) => po && (po.status === 'draft' || po.status === 'pending') && po.created_at.slice(0, 10) <= dateStr
    ).length;

    const prevDateStr = getDateStrOffset(now, historyOffsets[idx] - 1);
    const prevVal = purchaseOrders.filter(
      (po) => po && (po.status === 'draft' || po.status === 'pending') && po.created_at.slice(0, 10) <= prevDateStr
    ).length;

    return {
      date: dateStr,
      value: val,
      pct: calculatePctDelta(val, prevVal),
    };
  });

  const kpiPurchases: DashboardKpi = {
    id: 'purchases',
    value: openPosCount,
    format: 'count',
    delta: buildKpiDelta(openPosCount, openPosYesterdayCount, 'up-good', 'vs_yesterday'),
    spark: purchasesSpark,
    history: purchasesHistory,
    breakdown: [
      { labelKey: 'dashboard.kpis.purchases.pendingApproval', value: pendingApprovalCount, format: 'count' },
      { labelKey: 'dashboard.kpis.purchases.awaitingDelivery', value: awaitingDeliveryCount, format: 'count' },
    ],
  };

  // Pending lists for right panel
  const purchaseOrdersPendingItems: PendingItem[] = pendingPurchaseOrdersList.map((po) => {
    const totalCostNum = safeNum(po.total_cost);
    return {
      id: po.id,
      kind: 'purchase_order',
      title: `PO #${po.id.slice(0, 8)}`,
      subtitle: `${(po.lines || []).length} items • TZS ${totalCostNum.toLocaleString()}`,
      created_at: po.created_at,
      target: 'purchases',
    };
  });

  const pendingLabOrdersList = labOrders.filter(
    (lo) =>
      lo &&
      (lo.status === 'pending' || lo.status === 'sample_collected' || lo.status === 'result_entered')
  );
  const labOrdersPendingItems: PendingItem[] = pendingLabOrdersList.map((lo) => ({
    id: lo.id,
    kind: 'lab_order',
    title: `Lab #${lo.id.slice(0, 8)}`,
    subtitle: `Status: ${lo.status}`,
    created_at: lo.created_at,
    target: 'lab',
  }));

  const heldSalesItems: PendingItem[] = [];

  const pending = {
    purchaseOrders: purchaseOrdersPendingItems,
    labOrders: labOrdersPendingItems,
    total: purchaseOrdersPendingItems.length + labOrdersPendingItems.length + heldSalesItems.length,
  };

  const inventoryValue = inventoryItems.reduce(
    (sum, item) => sum + safeNum(item.sell_price) * safeNum(item.quantity),
    0
  );
  const totalStock = inventoryItems.reduce((sum, i) => sum + safeNum(i.quantity), 0);
  const categories = new Set(medicines.map((m) => m.category).filter(Boolean)).size;
  const emptyItems = inventoryItems.filter((i) => safeNum(i.quantity) === 0).length;
  const expiredItems = inventoryItems.filter((i) => {
    if (!i.expiry_date) return false;
    const exp = new Date(i.expiry_date);
    return !Number.isNaN(exp.getTime()) && exp < now;
  }).length;

  // Patients in Track
  const patientEventMap = new Map<string, PatientInTrack>();

  customers.forEach((cust) => {
    if (!cust) return;
    let latestEvent: PatientInTrack | null = null;

    sales
      .filter((s) => s && s.customer_id === cust.id)
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
      .filter((lo) => lo && lo.customer_id === cust.id)
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

  const kpis = {
    sales: kpiSales,
    profit: kpiProfit,
    customers: kpiCustomers,
    stock: kpiStock,
    expiry: kpiExpiry,
    lab: kpiLab,
    balances: kpiBalances,
    purchases: kpiPurchases,
  };

  const kpiList: DashboardKpi[] = [
    kpiSales,
    kpiProfit,
    kpiCustomers,
    kpiStock,
    kpiExpiry,
    kpiLab,
    kpiBalances,
    kpiPurchases,
  ];

  return {
    kpis,
    kpiList,
    monthlyProfit: safeNum(monthProfit),
    profit: safeNum(todayProfit),
    todaysSales: safeNum(todaysSalesTotal),
    transactions: safeNum(todaySalesCount),
    supplierDebt: safeNum(supplierDebt),
    customerDebt: safeNum(customerDebt),
    customerBalance: safeNum(customerDebt),
    inventoryValue: safeNum(inventoryValue),
    totalStock: safeNum(totalStock),
    categories: safeNum(categories),
    emptyItems: safeNum(emptyItems),
    expiredItems: safeNum(expiredItems),
    pending,
    patientsInTrack,
    sales,
    inventoryItems,
    medicines,
    purchaseOrdersList: purchaseOrders,
    labOrdersList: labOrders,
  };
}
