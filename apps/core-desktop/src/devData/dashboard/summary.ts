import type { Sale, InventoryItem, Medicine, PurchaseOrder, LabOrder, Customer } from '@40labs/types';
import { initialInventoryItems, initialMedicines } from '../inventory';
import { initialSales } from '../sales';
import { initialCustomers } from '../customers';
import { initialPurchaseOrders } from '../purchases';
import { initialLabOrders } from '../laboratory';
import type { ScreenId } from '../../stores/useNavStore';

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

  // 3. Pending Purchase Orders (status in 'draft', 'pending')
  const pendingPurchaseOrdersList = purchaseOrders.filter(
    (po) => po.status === 'draft' || po.status === 'pending'
  );
  const supplierDebt = pendingPurchaseOrdersList.reduce((sum, po) => sum + po.total_cost, 0);

  const purchaseOrdersPendingItems: PendingItem[] = pendingPurchaseOrdersList.map((po) => ({
    id: po.id,
    kind: 'purchase_order',
    title: `PO #${po.id.slice(0, 8)}`,
    subtitle: `${po.lines.length} items • TZS ${po.total_cost.toLocaleString()}`,
    created_at: po.created_at,
    target: 'purchases',
  }));

  // 4. Pending Lab Orders (status in 'pending', 'sample_collected', 'result_entered'; report_ready/unsolved/cancelled out)
  const pendingLabOrdersList = labOrders.filter(
    (lo) => lo.status === 'pending' || lo.status === 'sample_collected' || lo.status === 'result_entered'
  );
  const labOrdersPendingItems: PendingItem[] = pendingLabOrdersList.map((lo) => ({
    id: lo.id,
    kind: 'lab_order',
    title: `Lab #${lo.id.slice(0, 8)}`,
    subtitle: `Status: ${lo.status}`,
    created_at: lo.created_at,
    target: 'lab',
  }));

  // GAP: Sale entity in packages/types lacks status / held status. No held sales found.
  const heldSalesItems: PendingItem[] = [];

  const pending = {
    purchaseOrders: purchaseOrdersPendingItems,
    labOrders: labOrdersPendingItems,
    total: purchaseOrdersPendingItems.length + labOrdersPendingItems.length + heldSalesItems.length,
  };

  // 5. Customer Debt & Balance
  const customerDebt = customers.reduce(
    (sum, c) => sum + (c.outstanding_balance || 0),
    0
  );

  // 6. Inventory Metrics
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

  // 7. Patients in Track
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
    pending,
    patientsInTrack,
    sales,
    inventoryItems,
    medicines,
    purchaseOrdersList: purchaseOrders,
    labOrdersList: labOrders,
  };
}
