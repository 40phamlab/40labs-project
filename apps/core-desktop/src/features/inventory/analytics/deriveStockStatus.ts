import type { MedicineWithInventory } from '@40labs/types';
import { DEFAULT_ALERT_THRESHOLDS, type AlertThresholds } from '../../alerts/alertThresholds';

export type StockStatusType = 'in_stock' | 'low' | 'out' | 'expired';

export function deriveStockStatus(
  item: MedicineWithInventory,
  thresholds: AlertThresholds = DEFAULT_ALERT_THRESHOLDS,
  currentTime: Date = new Date()
): StockStatusType {
  const qty = item.quantity ?? 0;
  const threshold = item.low_stock_threshold ?? 10;

  if (item.expiry_date) {
    const expDate = new Date(item.expiry_date);
    const nowMidnight = new Date(currentTime);
    nowMidnight.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    const daysToExpiry = Math.round((expDate.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24));
    if (daysToExpiry < 0 && qty > 0) {
      return 'expired';
    }
  }

  if (qty <= thresholds.stock.criticalQty) {
    return 'out';
  }

  if (qty <= threshold) {
    return 'low';
  }

  return 'in_stock';
}
