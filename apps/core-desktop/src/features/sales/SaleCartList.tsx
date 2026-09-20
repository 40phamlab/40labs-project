import * as React from 'react';
import { CartItemRow, CartItemModel } from '@40labs/ui-components';
import { MedicineWithInventory } from '@40labs/types';

export interface SaleCartLine {
  medicine: MedicineWithInventory;
  quantity: number;
}

export interface SaleCartListProps {
  lines: SaleCartLine[];
  onQuantityChange: (medicineId: string, qty: number) => void;
  onRemove: (medicineId: string) => void;
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
        const { medicine, quantity } = line;
        const inv = medicine.inventory;
        const stockQty = inv?.quantity ?? 0;
        const threshold = inv?.low_stock_threshold ?? 10;

        let stockStatus: CartItemModel['stockStatus'] = 'in-stock';
        if (stockQty <= 0) {
          stockStatus = 'out-of-stock';
        } else if (stockQty <= threshold) {
          stockStatus = 'low-stock';
        }

        const itemModel: CartItemModel = {
          id: medicine.id,
          name: medicine.name,
          unitPrice: inv?.sell_price ?? 0,
          quantity: quantity,
          unitType: medicine.unit,
          stockStatus: stockStatus,
          currencyCode: 'TZS',
        };

        return (
          <CartItemRow
            key={medicine.id}
            item={itemModel}
            onQuantityChange={(id, qty) => onQuantityChange(id as string, qty)}
            onRemove={(id) => onRemove(id as string)}
          />
        );
      })}
    </div>
  );
};
