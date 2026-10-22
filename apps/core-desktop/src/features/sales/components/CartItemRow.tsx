import * as React from 'react';
import { CartLine } from '../../../shared/commerce';

export interface CartItemModel {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  maxStock?: number;
  unitType?: string;
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
  discountAmount?: number;
  currencyCode?: string;
}

export interface CartItemRowProps {
  item: CartItemModel;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  className?: string;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onQuantityChange,
  onRemove,
  className = '',
}) => {
  if (!item) return null;

  return (
    <CartLine
      id={item.id}
      name={item.name}
      unitPrice={item.unitPrice}
      quantity={item.quantity}
      maxStock={item.maxStock}
      unitType={item.unitType}
      discountAmount={item.discountAmount}
      mode="sale"
      isPriceEditable
      onQuantityChange={onQuantityChange}
      onRemove={onRemove}
      className={className}
    />
  );
};
