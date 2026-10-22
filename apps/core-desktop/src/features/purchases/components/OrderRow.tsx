// [PHASE: marketplace-preview — Purchases shell]
import * as React from 'react';
import { PurchaseOrder } from '@40labs/types';
import { StatusBadge } from '@40labs/ui-components';
import { Package, ChevronRight } from 'lucide-react';

export interface OrderRowProps {
  order: PurchaseOrder;
  supplierName?: string;
  onClick: () => void;
}

export const OrderRow: React.FC<OrderRowProps> = ({
  order,
  supplierName = 'Supplier',
  onClick,
}) => {
  const shortCode = order.id.slice(0, 8);
  const itemCount = order.lines.reduce((sum, l) => sum + l.qty, 0);
  const totalFormatted = `TZS ${order.totalTzs.toLocaleString()}`;
  const relativeTime = new Date(order.updatedAt).toLocaleDateString();

  let statusVariant: 'success' | 'warning' | 'neutral' | 'error' = 'neutral';
  if (order.status === 'completed') statusVariant = 'success';
  else if (order.status === 'sent' || order.status === 'confirmed') statusVariant = 'warning';
  else if (order.status === 'cancelled') statusVariant = 'error';

  return (
    <div
      onClick={onClick}
      className="p-3.5 bg-panel border border-border/40 rounded-card flex items-center justify-between gap-3 cursor-pointer hover:bg-panel-strong/60 transition-all elevation-raised"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Package size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-text truncate">{supplierName}</h4>
            <span className="text-[10px] font-mono bg-panel-strong px-1.5 py-0.5 rounded text-text-muted">
              #{shortCode}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
            <span>{itemCount} items</span>
            <span>•</span>
            <span className="font-mono font-bold text-text">{totalFormatted}</span>
            <span>•</span>
            <span>{relativeTime}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <StatusBadge status={statusVariant} label={order.status.toUpperCase()} />
        <ChevronRight size={16} className="text-text-muted" />
      </div>
    </div>
  );
};
