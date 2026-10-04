import * as React from 'react';
import { EmptyState } from '@40labs/ui-components';
import { CartItemRow, CartItemModel } from './CartItemRow';
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
      <div className="flex items-center justify-center h-full">
        <EmptyState
          variant="empty"
          title="Active Cart is Empty"
          description="Search and click any medicine from the right panel to add it to this sale."
          compact
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
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
          quantity,
          maxStock: stockQty,
          unitType: item.medicine.unit,
          stockStatus,
        };

        return (
          <CartItemRow
            key={item.id}
            item={itemModel}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
          />
        );
      })}
    </div>
  );
};
