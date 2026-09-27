import type {
  Sale,
  MedicineWithInventory,
  Customer,
  PurchaseOrder,
  Supplier,
  FiscalReceipt,
  AuditLogEntry,
} from '@40labs/types';

export type ReportCategoryId = 'sales' | 'inventory' | 'customers' | 'purchases' | 'compliance';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface KpiItem {
  id: string;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface ChartDataPoint {
  label: string;
  [key: string]: string | number;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  xAxisKey: string;
  dataKeys: { key: string; label: string; color?: string }[];
  title?: string;
}

export interface TableColumn {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown, row: Record<string, unknown>) => string | number;
}

export interface ReportContextData {
  sales: Sale[];
  inventory: MedicineWithInventory[];
  customers: Customer[];
  purchases: PurchaseOrder[];
  suppliers: Supplier[];
  fiscalReceipts: FiscalReceipt[];
  auditLogs: AuditLogEntry[];
  dateRange: DateRange;
}

export interface ReportCategoryConfig {
  id: ReportCategoryId;
  label: string;
  description: string;
  buildKpis: (data: ReportContextData) => KpiItem[];
  buildChart: (data: ReportContextData) => { config: ChartConfig; data: ChartDataPoint[] };
  buildTable: (data: ReportContextData) => { columns: TableColumn[]; rows: Record<string, unknown>[] };
}

export function isWithinRange(dateInput: string | Date | null | undefined, start: Date, end: Date): boolean {
  if (!dateInput) return false;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return false;

  const startTime = new Date(start).setHours(0, 0, 0, 0);
  const endTime = new Date(end).setHours(23, 59, 59, 999);
  const time = d.getTime();

  return time >= startTime && time <= endTime;
}

export function formatCurrency(amount: number, currency = 'TZS'): string {
  return `${currency} ${Math.round(amount).toLocaleString('en-US')}`;
}

export const reportCategoriesConfig: Record<ReportCategoryId, ReportCategoryConfig> = {
  sales: {
    id: 'sales',
    label: 'Sales & Revenue',
    description: 'Revenue, transaction volume, payment methods, and sales breakdown',
    buildKpis: ({ sales, dateRange }) => {
      const periodSales = sales.filter((s) => isWithinRange(s.created_at, dateRange.start, dateRange.end));
      const totalRevenue = periodSales.reduce((acc, s) => acc + s.grand_total, 0);
      const totalCount = periodSales.length;
      const avgValue = totalCount > 0 ? totalRevenue / totalCount : 0;
      const totalDiscounts = periodSales.reduce((acc, s) => acc + (s.discount_amount || 0), 0);

      return [
        {
          id: 'total_revenue',
          label: 'Total Revenue',
          value: formatCurrency(totalRevenue),
          subtext: `${totalCount} transaction(s)`,
        },
        {
          id: 'total_sales_count',
          label: 'Transactions',
          value: totalCount,
          subtext: 'Completed sales',
        },
        {
          id: 'avg_transaction_value',
          label: 'Avg Transaction Value',
          value: formatCurrency(avgValue),
          subtext: 'Per transaction average',
        },
        {
          id: 'total_discounts',
          label: 'Total Discounts',
          value: formatCurrency(totalDiscounts),
          subtext: 'Authorized discounts',
        },
      ];
    },
    buildChart: ({ sales, dateRange }) => {
      const periodSales = sales.filter((s) => isWithinRange(s.created_at, dateRange.start, dateRange.end));

      const mapByDate = new Map<string, { revenue: number; count: number }>();
      periodSales.forEach((s) => {
        const dateKey = new Date(s.created_at).toISOString().split('T')[0];
        const current = mapByDate.get(dateKey) || { revenue: 0, count: 0 };
        mapByDate.set(dateKey, {
          revenue: current.revenue + s.grand_total,
          count: current.count + 1,
        });
      });

      const sortedDates = Array.from(mapByDate.keys()).sort();
      const data: ChartDataPoint[] = sortedDates.map((d) => {
        const item = mapByDate.get(d)!;
        return {
          label: d,
          revenue: item.revenue,
          count: item.count,
        };
      });

      return {
        config: {
          type: 'bar',
          xAxisKey: 'label',
          title: 'Daily Sales Revenue',
          dataKeys: [
            { key: 'revenue', label: 'Revenue (TZS)', color: '#0284c7' },
            { key: 'count', label: 'Sales Count', color: '#0d9488' },
          ],
        },
        data: data.length > 0 ? data : [{ label: 'No Data', revenue: 0, count: 0 }],
      };
    },
    buildTable: ({ sales, customers, dateRange }) => {
      const customerMap = new Map(customers.map((c) => [c.id, c.full_name]));
      const periodSales = sales.filter((s) => isWithinRange(s.created_at, dateRange.start, dateRange.end));

      const columns: TableColumn[] = [
        { key: 'id', header: 'Sale ID' },
        { key: 'date', header: 'Date' },
        { key: 'customer', header: 'Customer' },
        { key: 'paymentMethod', header: 'Payment Method' },
        { key: 'itemsCount', header: 'Items', align: 'right' },
        { key: 'discount', header: 'Discount', align: 'right' },
        { key: 'grandTotal', header: 'Total Amount', align: 'right' },
      ];

      const rows = periodSales.map((s) => ({
        id: s.id,
        date: new Date(s.created_at).toLocaleDateString() + ' ' + new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        customer: s.customer_id ? customerMap.get(s.customer_id) || s.customer_id : 'Walk-in Customer',
        paymentMethod: s.payment_method.replace('_', ' ').toUpperCase(),
        itemsCount: s.lines.reduce((acc, l) => acc + l.quantity, 0),
        discount: formatCurrency(s.discount_amount),
        grandTotal: formatCurrency(s.grand_total),
      }));

      return { columns, rows };
    },
  },

  inventory: {
    id: 'inventory',
    label: 'Inventory & Stock',
    description: 'Stock valuation, low stock alerts, category breakdowns, and batch status',
    buildKpis: ({ inventory }) => {
      const totalValuation = inventory.reduce((acc, item) => acc + item.quantity * item.sell_price, 0);
      const totalUnits = inventory.reduce((acc, item) => acc + item.quantity, 0);
      const lowStockCount = inventory.filter((item) => item.quantity > 0 && item.quantity <= item.low_stock_threshold).length;
      const outOfStockCount = inventory.filter((item) => item.quantity === 0).length;

      return [
        {
          id: 'total_valuation',
          label: 'Stock Valuation',
          value: formatCurrency(totalValuation),
          subtext: `${inventory.length} total batch/items`,
        },
        {
          id: 'total_units',
          label: 'Total Units in Stock',
          value: totalUnits.toLocaleString(),
          subtext: 'Across all active batches',
        },
        {
          id: 'low_stock_count',
          label: 'Low Stock Items',
          value: lowStockCount,
          subtext: 'At or below threshold',
        },
        {
          id: 'out_of_stock_count',
          label: 'Out of Stock',
          value: outOfStockCount,
          subtext: 'Zero quantity remaining',
        },
      ];
    },
    buildChart: ({ inventory }) => {
      const categoryMap = new Map<string, { itemCount: number; totalUnits: number; totalValuation: number }>();

      inventory.forEach((item) => {
        const cat = item.medicine.category || 'Uncategorized';
        const current = categoryMap.get(cat) || { itemCount: 0, totalUnits: 0, totalValuation: 0 };
        categoryMap.set(cat, {
          itemCount: current.itemCount + 1,
          totalUnits: current.totalUnits + item.quantity,
          totalValuation: current.totalValuation + item.quantity * item.sell_price,
        });
      });

      const data: ChartDataPoint[] = Array.from(categoryMap.entries()).map(([cat, stats]) => ({
        label: cat,
        valuation: stats.totalValuation,
        units: stats.totalUnits,
        items: stats.itemCount,
      }));

      return {
        config: {
          type: 'bar',
          xAxisKey: 'label',
          title: 'Stock Valuation by Category',
          dataKeys: [
            { key: 'valuation', label: 'Stock Value (TZS)', color: '#0284c7' },
            { key: 'units', label: 'Units', color: '#8b5cf6' },
          ],
        },
        data: data.length > 0 ? data : [{ label: 'No Inventory', valuation: 0, units: 0, items: 0 }],
      };
    },
    buildTable: ({ inventory }) => {
      const columns: TableColumn[] = [
        { key: 'medicineName', header: 'Medicine Name' },
        { key: 'batchNumber', header: 'Batch Number' },
        { key: 'category', header: 'Category' },
        { key: 'quantity', header: 'Quantity', align: 'right' },
        { key: 'sellPrice', header: 'Sell Price', align: 'right' },
        { key: 'stockValue', header: 'Stock Value', align: 'right' },
        { key: 'expiryDate', header: 'Expiry Date' },
        { key: 'status', header: 'Status' },
      ];

      const rows = inventory.map((item) => {
        const isExpired = new Date(item.expiry_date) < new Date();
        const isLow = item.quantity > 0 && item.quantity <= item.low_stock_threshold;
        const isOut = item.quantity === 0;

        let status = 'Normal';
        if (isExpired) status = 'Expired';
        else if (isOut) status = 'Out of Stock';
        else if (isLow) status = 'Low Stock';

        return {
          medicineName: item.medicine.name,
          batchNumber: item.batch_number,
          category: item.medicine.category || 'N/A',
          quantity: item.quantity,
          sellPrice: formatCurrency(item.sell_price),
          stockValue: formatCurrency(item.quantity * item.sell_price),
          expiryDate: new Date(item.expiry_date).toLocaleDateString(),
          status,
        };
      });

      return { columns, rows };
    },
  },

  customers: {
    id: 'customers',
    label: 'Customer Analytics',
    description: 'Active buyers, outstanding balances, and purchase frequencies',
    buildKpis: ({ customers, sales, dateRange }) => {
      const periodSales = sales.filter((s) => isWithinRange(s.created_at, dateRange.start, dateRange.end));
      const activeCustomerIds = new Set(periodSales.map((s) => s.customer_id).filter(Boolean));

      const totalOutstandingBalance = customers.reduce((acc, c) => acc + (c.outstanding_balance || 0), 0);
      const periodRevenue = periodSales.reduce((acc, s) => acc + s.grand_total, 0);
      const avgSpentPerActiveCustomer = activeCustomerIds.size > 0 ? periodRevenue / activeCustomerIds.size : 0;

      return [
        {
          id: 'total_customers',
          label: 'Total Customers',
          value: customers.length,
          subtext: 'Registered in database',
        },
        {
          id: 'active_customers',
          label: 'Active Customers in Period',
          value: activeCustomerIds.size,
          subtext: 'Made at least 1 purchase',
        },
        {
          id: 'total_credit_balance',
          label: 'Outstanding Credit',
          value: formatCurrency(totalOutstandingBalance),
          subtext: 'Unsettled customer balances',
        },
        {
          id: 'avg_customer_spend',
          label: 'Avg Spend / Active Customer',
          value: formatCurrency(avgSpentPerActiveCustomer),
          subtext: 'Period average',
        },
      ];
    },
    buildChart: ({ customers, sales, dateRange }) => {
      const periodSales = sales.filter((s) => isWithinRange(s.created_at, dateRange.start, dateRange.end));
      const customerMap = new Map(customers.map((c) => [c.id, c.full_name]));

      const spendByCustomer = new Map<string, number>();
      periodSales.forEach((s) => {
        if (!s.customer_id) return;
        const name = customerMap.get(s.customer_id) || 'Unknown Customer';
        spendByCustomer.set(name, (spendByCustomer.get(name) || 0) + s.grand_total);
      });

      const data: ChartDataPoint[] = Array.from(spendByCustomer.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, totalSpent]) => ({
          label: name,
          totalSpent,
        }));

      return {
        config: {
          type: 'bar',
          xAxisKey: 'label',
          title: 'Top Customers by Period Spend',
          dataKeys: [{ key: 'totalSpent', label: 'Spent (TZS)', color: '#0d9488' }],
        },
        data: data.length > 0 ? data : [{ label: 'No Active Customers', totalSpent: 0 }],
      };
    },
    buildTable: ({ customers, sales, dateRange }) => {
      const periodSales = sales.filter((s) => isWithinRange(s.created_at, dateRange.start, dateRange.end));

      const salesByCustomer = new Map<string, { count: number; totalSpent: number }>();
      periodSales.forEach((s) => {
        if (!s.customer_id) return;
        const current = salesByCustomer.get(s.customer_id) || { count: 0, totalSpent: 0 };
        salesByCustomer.set(s.customer_id, {
          count: current.count + 1,
          totalSpent: current.totalSpent + s.grand_total,
        });
      });

      const columns: TableColumn[] = [
        { key: 'fullName', header: 'Customer Name' },
        { key: 'phone', header: 'Phone Number' },
        { key: 'salesCount', header: 'Purchases in Period', align: 'right' },
        { key: 'totalSpent', header: 'Spent in Period', align: 'right' },
        { key: 'creditBalance', header: 'Outstanding Balance', align: 'right' },
        { key: 'createdAt', header: 'Registered On' },
      ];

      const rows = customers.map((c) => {
        const stats = salesByCustomer.get(c.id) || { count: 0, totalSpent: 0 };
        return {
          fullName: c.full_name,
          phone: c.phone || 'N/A',
          salesCount: stats.count,
          totalSpent: formatCurrency(stats.totalSpent),
          creditBalance: formatCurrency(c.outstanding_balance || 0),
          createdAt: new Date(c.created_at).toLocaleDateString(),
        };
      });

      return { columns, rows };
    },
  },

  purchases: {
    id: 'purchases',
    label: 'Purchases & Suppliers',
    description: 'Purchase order costs, supplier distribution, and approval metrics',
    buildKpis: ({ purchases, suppliers, dateRange }) => {
      const periodPOs = purchases.filter((po) => isWithinRange(po.created_at, dateRange.start, dateRange.end));
      const totalSpend = periodPOs.reduce((acc, po) => acc + po.total_cost, 0);
      const approvedCount = periodPOs.filter((po) => po.status === 'completed' || po.status === 'pending').length;
      const activeSupplierIds = new Set(periodPOs.map((po) => po.supplier_id));

      return [
        {
          id: 'total_po_spend',
          label: 'Total PO Spend',
          value: formatCurrency(totalSpend),
          subtext: `${periodPOs.length} purchase orders`,
        },
        {
          id: 'total_pos_count',
          label: 'Purchase Orders',
          value: periodPOs.length,
          subtext: 'In selected period',
        },
        {
          id: 'approved_pos_count',
          label: 'Approved / Completed',
          value: approvedCount,
          subtext: `${periodPOs.length > 0 ? Math.round((approvedCount / periodPOs.length) * 100) : 0}% completion rate`,
        },
        {
          id: 'active_suppliers',
          label: 'Active Suppliers',
          value: activeSupplierIds.size,
          subtext: `Out of ${suppliers.length} total suppliers`,
        },
      ];
    },
    buildChart: ({ purchases, suppliers, dateRange }) => {
      const periodPOs = purchases.filter((po) => isWithinRange(po.created_at, dateRange.start, dateRange.end));
      const supplierMap = new Map(suppliers.map((sup) => [sup.id, sup.business_id || sup.id]));

      const spendBySupplier = new Map<string, number>();
      periodPOs.forEach((po) => {
        const name = supplierMap.get(po.supplier_id) || 'Unknown Supplier';
        spendBySupplier.set(name, (spendBySupplier.get(name) || 0) + po.total_cost);
      });

      const data: ChartDataPoint[] = Array.from(spendBySupplier.entries()).map(([name, spend]) => ({
        label: name,
        spend,
      }));

      return {
        config: {
          type: 'bar',
          xAxisKey: 'label',
          title: 'Purchase Spend by Supplier',
          dataKeys: [{ key: 'spend', label: 'Spend (TZS)', color: '#d97706' }],
        },
        data: data.length > 0 ? data : [{ label: 'No Orders', spend: 0 }],
      };
    },
    buildTable: ({ purchases, suppliers, dateRange }) => {
      const periodPOs = purchases.filter((po) => isWithinRange(po.created_at, dateRange.start, dateRange.end));
      const supplierMap = new Map(suppliers.map((sup) => [sup.id, sup.business_id || sup.id]));

      const columns: TableColumn[] = [
        { key: 'poNumber', header: 'PO Number' },
        { key: 'supplierName', header: 'Supplier' },
        { key: 'status', header: 'Status' },
        { key: 'linesCount', header: 'Line Items', align: 'right' },
        { key: 'totalAmount', header: 'Total Amount', align: 'right' },
        { key: 'createdAt', header: 'Created Date' },
      ];

      const rows = periodPOs.map((po) => ({
        poNumber: po.id,
        supplierName: supplierMap.get(po.supplier_id) || po.supplier_id,
        status: po.status.toUpperCase(),
        linesCount: po.lines.length,
        totalAmount: formatCurrency(po.total_cost),
        createdAt: new Date(po.created_at).toLocaleDateString(),
      }));

      return { columns, rows };
    },
  },

  compliance: {
    id: 'compliance',
    label: 'Compliance & Audit',
    description: 'Fiscal receipt submissions to TRA, offline queue status, and audit logs',
    buildKpis: ({ fiscalReceipts, auditLogs, dateRange }) => {
      const periodFiscal = fiscalReceipts.filter((fr) => isWithinRange(fr.queued_at || fr.created_at, dateRange.start, dateRange.end));
      const confirmedCount = periodFiscal.filter((fr) => fr.status === 'confirmed').length;
      const queuedCount = periodFiscal.filter((fr) => fr.status === 'queued' || fr.status === 'submitted').length;
      const periodAudit = auditLogs.filter((a) => isWithinRange(a.created_at, dateRange.start, dateRange.end));

      const submissionRate = periodFiscal.length > 0 ? Math.round((confirmedCount / periodFiscal.length) * 100) : 100;

      return [
        {
          id: 'total_fiscal_receipts',
          label: 'Total Fiscal Receipts',
          value: periodFiscal.length,
          subtext: 'In selected period',
        },
        {
          id: 'tra_submission_rate',
          label: 'TRA Confirmed Rate',
          value: `${submissionRate}%`,
          subtext: `${confirmedCount} confirmed by TRA`,
        },
        {
          id: 'queued_receipts',
          label: 'Queued / Pending',
          value: queuedCount,
          subtext: 'Waiting for network sync',
        },
        {
          id: 'total_audit_events',
          label: 'Audit Log Entries',
          value: periodAudit.length,
          subtext: 'Tracked sensitive actions',
        },
      ];
    },
    buildChart: ({ fiscalReceipts, dateRange }) => {
      const periodFiscal = fiscalReceipts.filter((fr) => isWithinRange(fr.queued_at || fr.created_at, dateRange.start, dateRange.end));

      const statusCounts = new Map<string, number>([
        ['confirmed', 0],
        ['queued', 0],
        ['submitted', 0],
        ['failed', 0],
      ]);

      periodFiscal.forEach((fr) => {
        const key = fr.status || 'queued';
        statusCounts.set(key, (statusCounts.get(key) || 0) + 1);
      });

      const data: ChartDataPoint[] = Array.from(statusCounts.entries()).map(([status, count]) => ({
        label: status.toUpperCase(),
        count,
      }));

      return {
        config: {
          type: 'bar',
          xAxisKey: 'label',
          title: 'Fiscal Receipt Status Breakdown',
          dataKeys: [{ key: 'count', label: 'Receipt Count', color: '#16a34a' }],
        },
        data,
      };
    },
    buildTable: ({ fiscalReceipts, auditLogs, dateRange }) => {
      const periodFiscal = fiscalReceipts.filter((fr) => isWithinRange(fr.queued_at || fr.created_at, dateRange.start, dateRange.end));
      const periodAudit = auditLogs.filter((a) => isWithinRange(a.created_at, dateRange.start, dateRange.end));

      const columns: TableColumn[] = [
        { key: 'type', header: 'Record Type' },
        { key: 'reference', header: 'Reference / Action' },
        { key: 'entityOrDevice', header: 'Device / Target' },
        { key: 'statusOrUser', header: 'Status / Performed By' },
        { key: 'signatureOrMeta', header: 'Signature / Details' },
        { key: 'timestamp', header: 'Timestamp' },
      ];

      const fiscalRows = periodFiscal.map((fr) => ({
        type: 'FISCAL RECEIPT',
        reference: fr.tra_receipt_number || `Sale ID: ${fr.sale_id}`,
        entityOrDevice: fr.fiscal_device_id || 'Local EFD',
        statusOrUser: fr.status.toUpperCase(),
        signatureOrMeta: fr.local_signature || 'N/A',
        timestamp: new Date(fr.queued_at || fr.created_at).toLocaleString(),
      }));

      const auditRows = periodAudit.map((a) => ({
        type: 'AUDIT LOG',
        reference: a.action.replace('_', ' ').toUpperCase(),
        entityOrDevice: `${a.target_entity_type} (${a.target_entity_id})`,
        statusOrUser: `User: ${a.performed_by_user_id}`,
        signatureOrMeta: JSON.stringify(a.metadata || {}),
        timestamp: new Date(a.created_at).toLocaleString(),
      }));

      const rows = [...fiscalRows, ...auditRows].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return { columns, rows };
    },
  },
};
