import * as React from 'react';
import { Card, Badge } from '@40labs/ui-components';
import { Clock, CheckCircle2, X, AlertCircle } from 'lucide-react';

export interface OrderStatusProps {
  status: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'processing';
  className?: string;
}

export const OrderStatus: React.FC<OrderStatusProps> = ({ status, className = '' }) => {
  const configs = {
    pending: { variant: 'warning' as const, icon: Clock, label: 'Pending' },
    completed: { variant: 'success' as const, icon: CheckCircle2, label: 'Completed' },
    cancelled: { variant: 'danger' as const, icon: X, label: 'Cancelled' },
    refunded: { variant: 'neutral' as const, icon: AlertCircle, label: 'Refunded' },
    processing: { variant: 'info' as const, icon: Clock, label: 'Processing' },
  };

  const { variant, icon: Icon, label } = configs[status] || configs.pending;

  return (
    <Badge variant={variant} className={`flex items-center gap-1 !px-2 !py-0.5 ${className}`}>
      <Icon size={12} />
      <span className="uppercase tracking-tighter font-bold text-[10px]">{label}</span>
    </Badge>
  );
};

export interface OrderSummaryProps {
  orderNumber: string;
  date: string;
  status: OrderStatusProps['status'];
  itemCount: number;
  total: string | number;
  className?: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  orderNumber,
  date,
  status,
  itemCount,
  total,
  className = '',
}) => {
  return (
    <Card className={`p-4 bg-panel-strong border border-border/20 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Order Number</p>
          <p className="text-sm font-mono font-bold text-text">{orderNumber}</p>
        </div>
        <OrderStatus status={status} />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold opacity-70">Date</p>
          <p className="text-xs text-text mt-0.5">{date}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold opacity-70">Items</p>
          <p className="text-xs text-text mt-0.5">{itemCount}</p>
        </div>
      </div>
      <div className="pt-4 border-t border-border flex justify-between items-baseline">
        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Grand Total</span>
        <span className="text-xl font-bold text-primary font-mono">{total}</span>
      </div>
    </Card>
  );
};
