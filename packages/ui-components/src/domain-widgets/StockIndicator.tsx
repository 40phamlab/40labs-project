import * as React from 'react';
import { Badge } from '../primitives/Badge';

export interface StockIndicatorProps {
  quantity: number;
  lowStockThreshold?: number;
  reorderLevel?: number;
  status?: 'auto' | 'in-stock' | 'low' | 'out';
  showQuantity?: boolean;
  showLabel?: boolean;
}

/**
 * StockIndicator
 * A domain-specific widget for displaying stock levels with status badges.
 * Reuses existing Badge primitives and follows centralized threshold rules.
 */
export function StockIndicator({
  quantity,
  lowStockThreshold = 10,
  status = 'auto',
  showQuantity = true,
  showLabel = true,
}: StockIndicatorProps) {
  // Threshold evaluation logic centralized here
  const getStatusInfo = () => {
    let resolvedStatus = status;

    if (status === 'auto') {
      if (quantity === 0) {
        resolvedStatus = 'out';
      } else if (quantity <= lowStockThreshold) {
        resolvedStatus = 'low';
      } else {
        resolvedStatus = 'in-stock';
      }
    }

    switch (resolvedStatus) {
      case 'out':
        return { label: 'Out of stock', variant: 'danger' as const };
      case 'low':
        return { label: 'Low stock', variant: 'warning' as const };
      case 'in-stock':
      default:
        return { label: 'In stock', variant: 'success' as const };
    }
  };

  const { label, variant } = getStatusInfo();

  return (
    <div className="inline-flex items-center gap-2">
      <Badge variant={variant} size="sm" className="!normal-case !tracking-normal">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
          {showLabel && <span>{label}</span>}
        </div>
      </Badge>
      {showQuantity && (
        <span className="text-[11px] font-mono font-bold text-text-muted">
          {quantity.toLocaleString()}
        </span>
      )}
    </div>
  );
}
