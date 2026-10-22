// [PHASE: marketplace-preview — Purchases shell]
import * as React from 'react';
import { PurchaseOrder, Supplier, PurchaseOrderStatus } from '@40labs/types';
import { Modal, Button, StatusBadge } from '@40labs/ui-components';
import { AlertCircle, CheckCircle, Send } from 'lucide-react';

export interface OrderDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  supplier: Supplier | null;
  onUpdateStatus: (orderId: string, status: PurchaseOrderStatus) => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  isOpen,
  onClose,
  order,
  supplier,
  onUpdateStatus,
}) => {
  if (!order) return null;

  const shortCode = order.id.slice(0, 8);
  const totalFormatted = `TZS ${order.totalTzs.toLocaleString()}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Purchase Order #${shortCode}`} size="lg">
      <div className="flex flex-col gap-4 p-2 text-xs">
        <div className="p-3 bg-panel-strong rounded-card space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-text-muted uppercase text-[10px] font-bold">Supplier</span>
            <span className="font-bold text-text">{supplier?.name || order.sellerBusinessId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted uppercase text-[10px] font-bold">Status</span>
            <StatusBadge status="warning" label={order.status.toUpperCase()} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted uppercase text-[10px] font-bold">Total Amount</span>
            <span className="font-mono font-bold text-primary text-sm">{totalFormatted}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-bold text-text uppercase text-[10px] tracking-wider">Order Items</h4>
          <div className="border border-border/30 rounded-card divide-y divide-border/20 bg-panel">
            {order.lines.map((line, idx) => (
              <div key={idx} className="p-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-text">{line.name || line.productId}</p>
                  <span className="text-[10px] text-text-muted">Qty: {line.qty}</span>
                </div>
                <span className="font-mono font-bold text-text">
                  TZS {(line.qty * line.unitPriceTzsSnapshot).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Honest Caveat Text */}
        <div className="p-3 bg-accent/10 border border-accent/20 rounded-card flex items-start gap-2 text-text">
          <AlertCircle size={16} className="text-accent shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Sent via WhatsApp — confirm when the supplier replies.<br />
            <em>Imetumwa kupitia WhatsApp — thibitisha wakati msambazaji anapojibu.</em>
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/20">
          <Button intent="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          {order.status !== 'confirmed' && order.status !== 'completed' && (
            <Button
              intent="primary"
              size="sm"
              leftIcon={<CheckCircle size={14} />}
              onClick={() => {
                onUpdateStatus(order.id, 'confirmed');
                onClose();
              }}
            >
              Mark Confirmed
            </Button>
          )}
          {order.status !== 'completed' && (
            <Button
              intent="primary"
              size="sm"
              leftIcon={<Send size={14} />}
              onClick={() => {
                onUpdateStatus(order.id, 'completed');
                onClose();
              }}
            >
              Mark Completed
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
