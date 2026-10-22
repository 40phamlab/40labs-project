// [PHASE: marketplace-preview — Supplier profile]
import * as React from 'react';
import { PurchaseOrder } from '@40labs/types';
import { StatusBadge } from '@40labs/ui-components';
import { Tag, Package } from 'lucide-react';

export interface DealsTabProps {
  orders: PurchaseOrder[];
  onSelectOrder: (orderId: string) => void;
}

export const DealsTab: React.FC<DealsTabProps> = ({ orders, onSelectOrder }) => {
  const totalSpent = orders.reduce((sum, o) => sum + o.totalTzs, 0);
  const totalSpentFormatted = `TZS ${totalSpent.toLocaleString()}`;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-text-muted gap-3">
        <Tag size={40} className="opacity-30" />
        <p className="text-xs italic">No deals yet with this supplier.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* All-time totals strip */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-panel-strong border border-border/30 rounded-card shrink-0">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Orders</span>
          <p className="font-sora text-base font-bold text-text">{orders.length}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Spent</span>
          <p className="font-mono text-base font-bold text-primary">{totalSpentFormatted}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2">
        {orders.map((o) => {
          const shortCode = o.id.slice(0, 8);
          const dateStr = new Date(o.updatedAt).toLocaleDateString();
          const totalFormatted = `TZS ${o.totalTzs.toLocaleString()}`;
          return (
            <div
              key={o.id}
              onClick={() => onSelectOrder(o.id)}
              className="p-3 bg-panel border border-border/30 rounded-card flex items-center justify-between gap-3 cursor-pointer hover:bg-panel-strong/60 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Package size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-text">#{shortCode}</span>
                    <span className="text-xs text-text-muted">{dateStr}</span>
                  </div>
                  <span className="text-[11px] text-text-muted">{o.lines.length} items</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-text text-xs">{totalFormatted}</span>
                <StatusBadge status="success" label={o.status.toUpperCase()} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
