// [PHASE: marketplace-preview]
import * as React from 'react';
import { ShoppingBag } from 'lucide-react';
import { CartItemRow } from '../../sales/components/CartItemRow';
import { CartSummaryPanel } from '../../sales/components/CartSummaryPanel';
import { StorefrontCartItem } from './SupplierStorefront';

export interface SupplierCartTabProps {
  cart: StorefrontCartItem[];
  supplierName: string;
  subtotal: number;
  grandTotal: number;
  onQuantityChange: (id: string | number, qty: number) => void;
  onRemoveItem: (id: string | number) => void;
  onClearCart: () => void;
  onConfirmOrder: () => void;
}

export const SupplierCartTab: React.FC<SupplierCartTabProps> = ({
  cart,
  supplierName,
  subtotal,
  grandTotal,
  onQuantityChange,
  onRemoveItem,
  onClearCart,
  onConfirmOrder,
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full p-1 overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
            <ShoppingBag size={36} className="opacity-30" />
            <p className="text-xs italic">Your cart for {supplierName} is empty.</p>
          </div>
        ) : (
          cart.map((item) => (
            <CartItemRow
              key={item.id}
              item={{
                id: item.id,
                name: item.name,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                unitType: item.unitType,
                stockStatus: 'in-stock',
                currencyCode: 'TZS',
              }}
              onQuantityChange={onQuantityChange}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="w-full lg:w-80 shrink-0">
          <CartSummaryPanel
            payload={{
              subtotal,
              discounts: [],
              taxes: [],
              grandTotal,
              currencyCode: 'TZS',
            }}
            onConfirm={onConfirmOrder}
            onClear={onClearCart}
          />
        </div>
      )}
    </div>
  );
};
