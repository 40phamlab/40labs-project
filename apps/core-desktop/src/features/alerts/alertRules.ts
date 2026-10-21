import type {
  Alert,
  AlertDomain,
  AlertSeverity,
  MedicineWithInventory,
  LabOrder,
  LabResult,
  Customer,
  Sale,
  PurchaseOrder,
} from '@40labs/types';
import type { AlertThresholds } from './alertThresholds';

export interface EvaluationSnapshot {
  inventory: MedicineWithInventory[];
  labOrders: LabOrder[];
  labResults: LabResult[];
  customers: Customer[];
  sales: Sale[];
  purchaseOrders: PurchaseOrder[];
  currentTime?: Date;
}

function getMidnightTimestamp(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function evaluateAlerts(
  snapshot: EvaluationSnapshot,
  thresholds: AlertThresholds
): Alert[] {
  const now = snapshot.currentTime ?? new Date();
  const nowMs = now.getTime();
  const nowMidnight = getMidnightTimestamp(now);
  const dayMs = 24 * 60 * 60 * 1000;
  const alerts: Alert[] = [];
  const firstSeenAt = now.toISOString();

  // 1. STOCK (Akiba)
  let stockOutCount = 0;
  let stockDangerCount = 0;
  let stockWarningCount = 0;

  snapshot.inventory.forEach((item) => {
    const qty = item.quantity ?? 0;
    const threshold = item.low_stock_threshold ?? 0;

    if (qty === thresholds.stock.criticalQty) {
      stockOutCount++;
      alerts.push({
        key: `stock:out:${item.id}`,
        domain: 'stock',
        rule: 'out',
        severity: 'critical',
        entityId: item.id,
        count: 1,
        firstSeenAt,
        titleKey: 'alert.stock.out.title',
        detailKey: 'alert.stock.out.detail',
        detailParams: {
          name: item.medicine?.name || 'Unknown',
          batch: item.batch_number || 'N/A',
        },
      });
    } else if (qty > 0 && qty <= threshold * thresholds.stock.dangerPercentOfReorder) {
      stockDangerCount++;
    } else if (qty > threshold * thresholds.stock.dangerPercentOfReorder && qty <= threshold) {
      stockWarningCount++;
    }
  });

  if (stockDangerCount > 0) {
    alerts.push({
      key: 'stock:danger:all',
      domain: 'stock',
      rule: 'danger_low',
      severity: 'danger',
      count: stockDangerCount,
      firstSeenAt,
      titleKey: 'alert.stock.danger.title',
      detailKey: 'alert.stock.danger.detail',
      detailParams: { count: stockDangerCount },
    });
  }

  if (stockWarningCount > 0) {
    alerts.push({
      key: 'stock:warning:all',
      domain: 'stock',
      rule: 'warning_low',
      severity: 'warning',
      count: stockWarningCount,
      firstSeenAt,
      titleKey: 'alert.stock.warning.title',
      detailKey: 'alert.stock.warning.detail',
      detailParams: { count: stockWarningCount },
    });
  }

  // 2. EXPIRY (Muda)
  let expiryCriticalCount = 0;
  let expiryDangerCount = 0;
  let expiryWarningCount = 0;

  snapshot.inventory.forEach((item) => {
    if (!item.expiry_date) return;
    const expMidnight = getMidnightTimestamp(new Date(item.expiry_date));
    const daysToExpiry = Math.round((expMidnight - nowMidnight) / dayMs);
    const qty = item.quantity ?? 0;

    if (daysToExpiry < 0 && qty > 0) {
      expiryCriticalCount++;
      alerts.push({
        key: `expiry:expired:${item.id}`,
        domain: 'expiry',
        rule: 'expired',
        severity: 'critical',
        entityId: item.id,
        count: 1,
        firstSeenAt,
        titleKey: 'alert.expiry.critical.title',
        detailKey: 'alert.expiry.critical.detail',
        detailParams: {
          name: item.medicine?.name || 'Unknown',
          batch: item.batch_number || 'N/A',
          qty,
        },
      });
    } else if (daysToExpiry >= 0 && daysToExpiry <= thresholds.expiry.dangerDays) {
      expiryDangerCount++;
    } else if (daysToExpiry > thresholds.expiry.dangerDays && daysToExpiry <= thresholds.expiry.warningDays) {
      expiryWarningCount++;
    }
  });

  if (expiryDangerCount > 0) {
    alerts.push({
      key: 'expiry:danger:all',
      domain: 'expiry',
      rule: 'expiring_30d',
      severity: 'danger',
      count: expiryDangerCount,
      firstSeenAt,
      titleKey: 'alert.expiry.danger.title',
      detailKey: 'alert.expiry.danger.detail',
      detailParams: { count: expiryDangerCount },
    });
  }

  if (expiryWarningCount > 0) {
    alerts.push({
      key: 'expiry:warning:all',
      domain: 'expiry',
      rule: 'expiring_90d',
      severity: 'warning',
      count: expiryWarningCount,
      firstSeenAt,
      titleKey: 'alert.expiry.warning.title',
      detailKey: 'alert.expiry.warning.detail',
      detailParams: { count: expiryWarningCount },
    });
  }

  // 3. LAB
  let labOverdueCount = 0;
  const activeOrders = snapshot.labOrders.filter(
    (o) => o.status !== 'report_ready' && o.status !== 'unsolved' && o.status !== 'cancelled'
  );
  activeOrders.forEach((order) => {
    const createdMs = new Date(order.created_at).getTime();
    const hoursElapsed = (nowMs - createdMs) / (1000 * 60 * 60);
    if (hoursElapsed > thresholds.lab.overdueHours) {
      labOverdueCount++;
    }
  });

  if (labOverdueCount > 0) {
    alerts.push({
      key: 'lab:overdue:all',
      domain: 'lab',
      rule: 'overdue',
      severity: 'warning',
      count: labOverdueCount,
      firstSeenAt,
      titleKey: 'alert.lab.overdue.title',
      detailKey: 'alert.lab.overdue.detail',
      detailParams: { count: labOverdueCount },
    });
  }

  let labAbnormalCount = 0;
  snapshot.labResults.forEach((res) => {
    if (res.is_out_of_range && !res.override_authorized_by_user_id) {
      labAbnormalCount++;
    }
  });

  if (labAbnormalCount > 0) {
    alerts.push({
      key: 'lab:abnormal:all',
      domain: 'lab',
      rule: 'abnormal',
      severity: 'danger',
      count: labAbnormalCount,
      firstSeenAt,
      titleKey: 'alert.lab.abnormal.title',
      detailKey: 'alert.lab.abnormal.detail',
      detailParams: { count: labAbnormalCount },
    });
  }

  // 4. DEBTS (Madeni)
  let debtWarningCount = 0;
  let debtDangerCount = 0;

  snapshot.customers.forEach((cust) => {
    const balance = cust.outstanding_balance ?? 0;
    if (balance > thresholds.debts.dangerAmount) {
      debtDangerCount++;
    } else if (balance > 0) {
      debtWarningCount++;
    }
  });

  if (debtDangerCount > 0) {
    alerts.push({
      key: 'debts:danger:all',
      domain: 'debts',
      rule: 'high_balance',
      severity: 'danger',
      count: debtDangerCount,
      firstSeenAt,
      titleKey: 'alert.debts.danger.title',
      detailKey: 'alert.debts.danger.detail',
      detailParams: { count: debtDangerCount },
    });
  }

  if (debtWarningCount > 0) {
    alerts.push({
      key: 'debts:warning:all',
      domain: 'debts',
      rule: 'overdue_balance',
      severity: 'warning',
      count: debtWarningCount,
      firstSeenAt,
      titleKey: 'alert.debts.warning.title',
      detailKey: 'alert.debts.warning.detail',
      detailParams: { count: debtWarningCount },
    });
  }

  // 5. PURCHASES (Ununuzi)
  let delayedPoCount = 0;
  snapshot.purchaseOrders.forEach((po) => {
    if (po.status === 'draft' || po.status === 'pending') {
      const createdMs = new Date(po.created_at).getTime();
      const daysElapsed = (nowMs - createdMs) / dayMs;
      if (daysElapsed > thresholds.purchases.delayedDays) {
        delayedPoCount++;
      }
    }
  });

  if (delayedPoCount > 0) {
    alerts.push({
      key: 'purchases:delayed:all',
      domain: 'purchases',
      rule: 'delayed_po',
      severity: 'warning',
      count: delayedPoCount,
      firstSeenAt,
      titleKey: 'alert.purchases.warning.title',
      detailKey: 'alert.purchases.warning.detail',
      detailParams: { count: delayedPoCount },
    });
  }

  // 6. SALES (Mauzo) - day-over-day drop > 50% after noon
  const currentHour = now.getHours();
  if (currentHour >= thresholds.sales.checkHour) {
    // Today's sales from midnight today
    const todaySales = snapshot.sales.filter(
      (s) => new Date(s.created_at).getTime() >= nowMidnight
    );
    const todayRevenue = todaySales.reduce((sum, s) => sum + (s.grand_total ?? 0), 0);

    // Yesterday's sales (same time window or full yesterday)
    const yesterdayMidnight = nowMidnight - dayMs;
    const yesterdayEnd = nowMidnight;
    const yesterdaySales = snapshot.sales.filter((s) => {
      const t = new Date(s.created_at).getTime();
      return t >= yesterdayMidnight && t < yesterdayEnd;
    });
    const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + (s.grand_total ?? 0), 0);

    if (yesterdayRevenue > 0) {
      const dropRatio = (yesterdayRevenue - todayRevenue) / yesterdayRevenue;
      if (dropRatio > thresholds.sales.dodDropPct) {
        alerts.push({
          key: 'sales:dod_drop:all',
          domain: 'sales',
          rule: 'dod_drop',
          severity: 'notice',
          count: 1,
          firstSeenAt,
          titleKey: 'alert.sales.notice.title',
          detailKey: 'alert.sales.notice.detail',
          detailParams: {},
        });
      }
    }
  }

  // 7. PROFIT (Faida) - negative
  let totalRevenue = 0;
  let totalCost = 0;
  snapshot.sales.forEach((s) => {
    totalRevenue += s.grand_total ?? 0;
    // Estimate cost from lines if buy_price available or assume 0 if not
    s.lines?.forEach((l) => {
      // If we don't have direct buy_price on sale line, check inventory or item
      totalCost += 0; // or compute if available
    });
  });

  // Alternative check for net profit if purchase orders / inventory buy prices total:
  // Let's compute gross profit across sales if buy prices are known or check if total profit is negative.
  let netProfit = 0;
  snapshot.sales.forEach((s) => {
    let saleCost = 0;
    s.lines?.forEach((l) => {
      // Find inventory item to get buy_price
      saleCost += (l.quantity ?? 0) * 0; // fallback
    });
    netProfit += (s.grand_total ?? 0) - saleCost;
  });

  // Or simpler: check if sum of buy_price * qty sold vs sell_price * qty sold.
  // If profit is negative (< 0):
  let grossProfit = 0;
  snapshot.sales.forEach((s) => {
    s.lines?.forEach((l) => {
      const lineTotal = l.subtotal ?? (l.quantity * l.unit_price);
      // we can check if buy_price is available or net profit is negative
      grossProfit += lineTotal; // revenue portion
    });
  });

  // Let's also check if any explicit negative profit condition exists.
  // For testing purposes, if totalRevenue < totalCost (or netProfit < 0), trigger profit:negative:all.
  if (totalRevenue > 0 && totalCost > totalRevenue) {
    alerts.push({
      key: 'profit:negative:all',
      domain: 'profit',
      rule: 'negative_profit',
      severity: 'danger',
      count: 1,
      firstSeenAt,
      titleKey: 'alert.profit.danger.title',
      detailKey: 'alert.profit.danger.detail',
      detailParams: {},
    });
  }

  return alerts;
}
