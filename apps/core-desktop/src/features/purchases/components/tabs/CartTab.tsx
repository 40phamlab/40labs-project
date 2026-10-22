// [PHASE: marketplace-preview — Supplier profile]
import * as React from 'react';
import { SupplierCart } from '@40labs/types';
import { ShoppingBag } from 'lucide-react';
import { CartLine, CartSummary } from '../../../../shared/commerce';

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
          return (
            <CartLine
              key={line.productId}
              id={line.productId}
              name={line.productId}
              unitPrice={line.unitPriceTzsSnapshot}
              quantity={line.qty}
              mode="purchase"
              onQuantityChange={(_id, qty) => onUpdateQty(line.productId, qty)}
              onRemove={onRemoveLine}
            />
          );
        })}
      </div>

      <div className="w-full lg:w-96 shrink-0">
        <CartSummary
          subtotal={subtotal}
          grandTotal={subtotal}
          onConfirm={onSendOrder}
          onDelete={() => {
            cart.lines.forEach((l) => onRemoveLine(l.productId));
          }}
          disabled={cart.lines.length === 0}
          mode="purchase"
          ctaLabel="Send Order (WhatsApp)"
          deliveryNote="Calculated on dispatch"
        />
      </div>
    </div>
  );
};
