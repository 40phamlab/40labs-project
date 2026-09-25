import * as React from 'react';
import { TabbedListContainer, OrderSummary } from '@40labs/ui-components';
import { ShoppingBag } from 'lucide-react';
import type { PurchaseOrder } from '@40labs/types';
import { usePurchases } from '../../hooks/usePurchases';

export interface PurchaseHistoryPanelProps {
  purchaseOrders?: PurchaseOrder[];
  onSelectOrder?: (po: PurchaseOrder) => void;
  className?: string;
}

export const PurchaseHistoryPanel: React.FC<PurchaseHistoryPanelProps> = ({
  purchaseOrders: purchaseOrdersProp,
  onSelectOrder,
  className = '',
}) => {
  const [activeTab, setActiveTab] = React.useState('recently');
  const { purchaseOrders: fetchedPOs } = usePurchases();

  const purchaseOrders = React.useMemo(() => {
    return purchaseOrdersProp || fetchedPOs;
  }, [purchaseOrdersProp, fetchedPOs]);

  const pendingOrders = React.useMemo(() => {
    return purchaseOrders.filter((po) => po.status === 'pending' || po.status === 'draft');
  }, [purchaseOrders]);

  const completedOrders = React.useMemo(() => {
    return purchaseOrders.filter((po) => po.status === 'completed');
  }, [purchaseOrders]);

  const sortedRecently = React.useMemo(() => {
    return [...purchaseOrders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [purchaseOrders]);

  const displayedOrders = React.useMemo(() => {
    if (activeTab === 'pending') return pendingOrders;
    if (activeTab === 'completed') return completedOrders;
    return sortedRecently;
  }, [activeTab, pendingOrders, completedOrders, sortedRecently]);

  const tabs = [
    { id: 'recently', label: 'Recently', count: sortedRecently.length },
    { id: 'pending', label: 'Pending', count: pendingOrders.length },
    { id: 'completed', label: 'Completed', count: completedOrders.length },
  ];

  return (
    <div
      className={`flex flex-col h-full bg-panel rounded-card p-4 border border-border/50 elevation-raised ${className}`}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
        <div>
          <h2 className="text-base font-bold text-text">Purchase History</h2>
          <p className="text-xs text-text-muted">Track procurement orders & deliveries</p>
        </div>
      </div>

      <TabbedListContainer
        tabs={tabs}
        activeTabId={activeTab}
        onTabChange={setActiveTab}
      >
        {displayedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted gap-2">
            <ShoppingBag size={32} className="opacity-40" />
            <p className="text-xs italic">No purchase orders found in this view.</p>
          </div>
        ) : (
          displayedOrders.map((po) => {
            const itemCount = po.lines.reduce((sum, line) => sum + line.quantity, 0);
            const formattedDate = new Date(po.created_at).toLocaleDateString();
            const formattedTotal = `TZS ${po.total_cost.toLocaleString()}`;

            let mappedStatus: 'pending' | 'completed' | 'cancelled' | 'processing' = 'pending';
            if (po.status === 'completed') {
              mappedStatus = 'completed';
            } else if (po.status === 'cancelled') {
              mappedStatus = 'cancelled';
            } else if (po.status === 'draft') {
              mappedStatus = 'processing';
            } else {
              mappedStatus = 'pending';
            }

            return (
              <div
                key={po.id}
                onClick={() => onSelectOrder?.(po)}
                className="cursor-pointer group"
              >
                <OrderSummary
                  orderNumber={`#${po.id}`}
                  date={formattedDate}
                  status={mappedStatus}
                  itemCount={itemCount}
                  total={formattedTotal}
                  className="group-hover:border-primary/50 transition-all"
                />
              </div>
            );
          })
        )}
      </TabbedListContainer>
    </div>
  );
};
