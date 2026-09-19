import { CartItem } from '@40labs/ui-components';
import { useSaleCart } from './useSales';
import { useInventoryList } from '../inventory/useInventory';

export function SaleCartTable() {
  const { lines, setQty, removeLine } = useSaleCart();
  const { data: inventory = [] } = useInventoryList();

  if (!lines.length) {
    return (
      <div className="h-full min-h-[128px] rounded-card bg-panel-strong flex items-center justify-center text-xs text-text-muted">
        Cart is empty
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lines.map((line) => {
        const item = inventory.find((i) => i.id === line.inventory_item_id);
        if (!item) return null;

        return (
          <CartItem
            key={line.id}
            name={item.medicine.name}
            unitPrice={line.unit_price.toLocaleString()}
            quantity={line.quantity}
            subtotal={line.subtotal.toLocaleString()}
            onIncrement={() => setQty(line.id, line.quantity + 1)}
            onDecrement={() => setQty(line.id, line.quantity - 1)}
            onRemove={() => removeLine(line.id)}
          />
        );
      })}
    </div>
  );
}
