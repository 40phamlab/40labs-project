import { isWithinRange, ReportContextData } from './reportCategories';
import { ReportTabId } from './seriesRegistry';

export function getUnifiedChartDataForTab(categoryId: ReportTabId, contextData: ReportContextData): any[] {
  if (!contextData) return [{ label: 'No Data' }];
  const { sales, inventory, customers, purchases, suppliers, fiscalReceipts, auditLogs, dateRange } = contextData;

  if (categoryId === 'sales') {
    const periodSales = (sales || []).filter((s) => isWithinRange(s.created_at, dateRange.start, dateRange.end));
    const map = new Map<string, { revenue: number; count: number; discount: number }>();
    periodSales.forEach((s) => {
      const dKey = new Date(s.created_at).toISOString().split('T')[0];
      const cur = map.get(dKey) || { revenue: 0, count: 0, discount: 0 };
      map.set(dKey, {
        revenue: cur.revenue + (s.grand_total || 0),
        count: cur.count + 1,
        discount: cur.discount + (s.discount_amount || 0),
      });
    });
    const sortedDates = Array.from(map.keys()).sort();
    if (sortedDates.length === 0) return [{ label: 'No Data', revenue: 0, transactions: 0, avgOrderValue: 0, discounts: 0 }];
    return sortedDates.map((d) => {
      const item = map.get(d)!;
      const avg = item.count > 0 ? item.revenue / item.count : 0;
      return {
        label: d,
        revenue: item.revenue,
        transactions: item.count,
        avgOrderValue: Math.round(avg),
        discounts: item.discount,
      };
    });
  }

  if (categoryId === 'inventory') {
    const catMap = new Map<string, { stockValue: number; unitsSold: number; expiringSoon: number; stockOuts: number }>();
    (inventory || []).forEach((item) => {
      const cat = item.medicine?.category || 'General';
      const cur = catMap.get(cat) || { stockValue: 0, unitsSold: 0, expiringSoon: 0, stockOuts: 0 };
      const qty = item.quantity || 0;
      const isExp = item.expiry_date ? new Date(item.expiry_date).getTime() - Date.now() < 30 * 86400000 : false;
      catMap.set(cat, {
        stockValue: cur.stockValue + qty * (item.sell_price || 0),
        unitsSold: cur.unitsSold + qty,
        expiringSoon: cur.expiringSoon + (isExp ? 1 : 0),
        stockOuts: cur.stockOuts + (qty === 0 ? 1 : 0),
      });
    });
    const entries = Array.from(catMap.entries());
    if (entries.length === 0) return [{ label: 'No Data', stockValue: 0, unitsSold: 0, expiringSoon: 0, stockOuts: 0 }];
    return entries.map(([cat, stats]) => ({
      label: cat,
      stockValue: stats.stockValue,
      unitsSold: stats.unitsSold,
      expiringSoon: stats.expiringSoon,
      stockOuts: stats.stockOuts,
    }));
  }

  if (categoryId === 'customers') {
    const periodSales = (sales || []).filter((s) => isWithinRange(s.created_at, dateRange.start, dateRange.end));
    const custMap = new Map<string, { visits: number; spend: number }>();
    periodSales.forEach((s) => {
      if (!s.customer_id) return;
      const cur = custMap.get(s.customer_id) || { visits: 0, spend: 0 };
      custMap.set(s.customer_id, { visits: cur.visits + 1, spend: cur.spend + (s.grand_total || 0) });
    });
    const data = (customers || []).slice(0, 10).map((c) => {
      const stats = custMap.get(c.id) || { visits: 0, spend: 0 };
      const isNew = c.created_at && isWithinRange(c.created_at, dateRange.start, dateRange.end);
      return {
        label: c.full_name,
        newCustomers: isNew ? 1 : 0,
        returningCustomers: !isNew && stats.visits > 0 ? 1 : 0,
        visits: stats.visits,
      };
    });
    if (data.length === 0) return [{ label: 'No Data', newCustomers: 0, returningCustomers: 0, visits: 0 }];
    return data;
  }

  if (categoryId === 'purchases') {
    const periodPOs = (purchases || []).filter((po) => isWithinRange(po.created_at, dateRange.start, dateRange.end));
    const supMap = new Map<string, { spend: number; orders: number; pending: number }>();
    const supplierNameMap = new Map((suppliers || []).map((s) => [s.id, s.business_id || s.id]));
    periodPOs.forEach((po) => {
      const sName = supplierNameMap.get(po.supplier_id) || po.supplier_id;
      const cur = supMap.get(sName) || { spend: 0, orders: 0, pending: 0 };
      supMap.set(sName, {
        spend: cur.spend + (po.total_cost || 0),
        orders: cur.orders + 1,
        pending: cur.pending + (po.status === 'pending' ? 1 : 0),
      });
    });
    const entries = Array.from(supMap.entries());
    if (entries.length === 0) return [{ label: 'No Data', purchaseSpend: 0, orders: 0, pending: 0 }];
    return entries.map(([name, stats]) => ({
      label: name,
      purchaseSpend: stats.spend,
      orders: stats.orders,
      pending: stats.pending,
    }));
  }

  if (categoryId === 'compliance') {
    const periodFiscal = (fiscalReceipts || []).filter((fr) => isWithinRange(fr.queued_at || fr.created_at, dateRange.start, dateRange.end));
    const periodAudit = (auditLogs || []).filter((a) => isWithinRange(a.created_at, dateRange.start, dateRange.end));
    const statusMap = new Map<string, { receipts: number; auditEvents: number; pinOverrides: number }>();
    periodFiscal.forEach((fr) => {
      const st = fr.status || 'queued';
      const cur = statusMap.get(st) || { receipts: 0, auditEvents: 0, pinOverrides: 0 };
      statusMap.set(st, { ...cur, receipts: cur.receipts + 1 });
    });
    periodAudit.forEach((au) => {
      const act = au.action || 'action';
      const cur = statusMap.get(act) || { receipts: 0, auditEvents: 0, pinOverrides: 0 };
      const isPin = act.toLowerCase().includes('pin') || act.toLowerCase().includes('override');
      statusMap.set(act, {
        ...cur,
        auditEvents: cur.auditEvents + 1,
        pinOverrides: cur.pinOverrides + (isPin ? 1 : 0),
      });
    });
    const entries = Array.from(statusMap.entries());
    if (entries.length === 0) return [{ label: 'No Data', fiscalReceipts: 0, auditEvents: 0, pinOverrides: 0 }];
    return entries.map(([k, v]) => ({
      label: k.toUpperCase(),
      fiscalReceipts: v.receipts,
      auditEvents: v.auditEvents,
      pinOverrides: v.pinOverrides,
    }));
  }

  return [{ label: 'No Data' }];
}
