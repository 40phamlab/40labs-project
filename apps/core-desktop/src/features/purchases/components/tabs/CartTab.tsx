// [PHASE: marketplace-preview — Supplier profile]
import * as React from 'react';
import { SupplierCart } from '@40labs/types';
import { Button } from '@40labs/ui-components';
import { ShoppingBag, Trash2, Plus, Minus, Send } from 'lucide-react';

export interface CartTabProps {
  cart: SupplierCart;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemoveLine: (productId: string) => void;
  onSendOrder: () => void;
}

export const CartTab: React.FC<CartTabProps> = ({
  cart,
  onUpdateQty,
  onRemoveLine,
  onSendOrder,
}) => {
  const subtotal = cart.lines.reduce((sum, l) => sum + l.qty * l.unitPriceTzsSnapshot, 0);
  const subtotalFormatted = `TZS ${subtotal.toLocaleString()}`;

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-text-muted gap-3">
        <ShoppingBag size={40} className="opacity-30" />
        <p className="text-xs italic">Your cart for this supplier is empty.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
        {cart.lines.map((line) => {
          const lineTotal = line.qty * line.unitPriceTzsSnapshot;
          return (
            <div key={line.productId} className="p-3 bg-panel border border-border/30 rounded-card flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-text">{line.productId}</h4>
                <span className="font-mono text-xs text-text-muted">TZS {line.unitPriceTzsSnapshot.toLocaleString()} each</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-panel-strong p-1 rounded border border-border/30">
                  <button
                    onClick={() => onUpdateQty(line.productId, line.qty - 1)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-panel text-text"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-mono text-xs font-bold px-2">{line.qty}</span>
                  <button
                    onClick={() => onUpdateQty(line.productId, line.qty + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-panel text-text"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <span className="font-mono font-bold text-text text-xs w-24 text-right">
                  TZS {lineTotal.toLocaleString()}
                </span>

                <button
                  onClick={() => onRemoveLine(line.productId)}
                  className="text-danger hover:text-danger/80 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="w-full lg:w-80 shrink-0 p-4 bg-panel-strong border border-border/30 rounded-card flex flex-col justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-bold text-text text-sm border-b border-border/20 pb-2">Order Summary</h3>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Subtotal</span>
            <span className="font-mono font-bold text-text">{subtotalFormatted}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Delivery</span>
            <span className="font-medium text-text">Calculated on dispatch</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-border/20 font-bold">
            <span className="text-text">Grand Total</span>
            <span className="font-mono text-primary">{subtotalFormatted}</span>
          </div>
        </div>

        <Button
          intent="primary"
          leftIcon={<Send size={16} />}
          onClick={onSendOrder}
          className="w-full"
        >
          Send Order (WhatsApp)
        </Button>
      </div>
    </div>
  );
};
