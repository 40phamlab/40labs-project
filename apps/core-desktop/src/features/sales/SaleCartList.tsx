import * as React from 'react';
import { CartItemRow, CartItemModel } from '@40labs/ui-components';
import { MedicineWithInventory } from '@40labs/types';

export interface SaleCartLine {
  item: MedicineWithInventory;
  quantity: number;
}

export interface SaleCartListProps {
  lines: SaleCartLine[];
  onQuantityChange: (inventoryItemId: string, qty: number) => void;
  onRemove: (inventoryItemId: string) => void;
}

export const SaleCartList: React.FC<SaleCartListProps> = ({
  lines,
  onQuantityChange,
  onRemove,
}) => {
  if (lines.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-text-muted italic">
        Cart is empty — search a medicine to begin.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
      {lines.map((line) => {
        const { item, quantity } = line;
        const stockQty = item.quantity;
        const threshold = item.low_stock_threshold;

        let stockStatus: CartItemModel['stockStatus'] = 'in-stock';
        if (stockQty <= 0) {
          stockStatus = 'out-of-stock';
        } else if (stockQty <= threshold) {
          stockStatus = 'low-stock';
        }

        const itemModel: CartItemModel = {
          id: item.id,
          name: item.medicine.name,
          unitPrice: item.sell_price,
          quantity: quantity,
          unitType: item.medicine.unit,
          stockStatus: stockStatus,
          currencyCode: 'TZS',
        };

        return (
          <CartItemRow
            key={item.id}
            item={itemModel}
            onQuantityChange={(id, qty) => onQuantityChange(id as string, qty)}
            onRemove={(id) => onRemove(id as string)}
          />
        );
      })}
    </div>
  );
};
