// [PHASE: marketplace-preview — Purchases shell]
import * as React from 'react';
import { PurchaseOrder, Supplier } from '@40labs/types';
import { OrderRow } from './OrderRow';
import { Package } from 'lucide-react';

export interface OrderListProps {
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  onSelectOrder: (orderId: string) => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  suppliers,
  onSelectOrder,
}) => {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-text-muted gap-2">
        <Package size={36} className="opacity-30" />
        <p className="text-xs italic">No purchase orders found in this view.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 p-1 pb-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
      {orders.map((order) => {
        const sup = suppliers.find((s) => s.businessId === order.sellerBusinessId);
        return (
          <OrderRow
            key={order.id}
            order={order}
            supplierName={sup?.name || order.sellerBusinessId}
            onClick={() => onSelectOrder(order.id)}
          />
        );
      })}
    </div>
  );
};
