// [PHASE: MVP]
import { useMemo } from 'react';
import type { SaleLine } from '@40labs/types';
import { Button } from '@40labs/ui-components';
import { useSaleCart } from './useSales';
import { useInventoryList } from '../inventory/useInventory';

interface CartLineRowProps {
  line: SaleLine;
}

/**
 * Individual row in the CartPanel.
 * Features item details, quantity adjustment, and removal.
 */
export function CartLineRow({ line }: CartLineRowProps) {
  const { setQty, removeLine } = useSaleCart();
  const { data: inventory } = useInventoryList();

  const itemName = useMemo(() => {
    const item = inventory?.find((i) => i.id === line.inventory_item_id);
    return item?.medicine.name || 'Unknown Item';
  }, [inventory, line.inventory_item_id]);

  return (
    <div className="flex items-center gap-4 p-3 bg-white border border-black/5 rounded-card elevation-raised hover:elevation-hover transition-all duration-200">
      {/* Image Placeholder */}
      <div className="w-12 h-12 rounded-lg bg-surface/50 elevation-inset flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/10"><path d="m2 9 3 3 3-3"/><path d="m9 18 3 3 3-3"/><path d="m22 15-3-3-3 3"/><path d="m15 6-3-3-3 3"/><circle cx="12" cy="12" r="2"/></svg>
      </div>

      {/* Item Info */}
      <div className="flex-1 flex flex-col min-w-0">
        <span className="font-ui font-semibold text-sm text-black/80 truncate">
          {itemName}
        </span>
        <span className="font-mono text-[10px] text-black/40">
          Unit: {line.unit_price.toLocaleString()}
        </span>
      </div>

      {/* Qty Stepper */}
      <div className="flex items-center gap-1 bg-surface/30 rounded-full p-1 border border-black/5">
        <Button
          size="sm"
          variant="ghost"
          className="!p-0 w-6 h-6 rounded-full"
          onClick={() => setQty(line.id, line.quantity - 1)}
        >
          -
        </Button>
        <span className="w-8 text-center font-mono text-sm font-bold text-black/70">
          {line.quantity}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="!p-0 w-6 h-6 rounded-full"
          onClick={() => setQty(line.id, line.quantity + 1)}
        >
          +
        </Button>
      </div>

      {/* Subtotal */}
      <div className="w-24 text-right">
        <span className="font-mono text-sm font-bold text-primary">
          {line.subtotal.toLocaleString()}
        </span>
      </div>

      {/* Remove Action */}
      <Button
        size="sm"
        variant="ghost"
        intent="danger"
        className="text-black/20 hover:text-danger"
        onClick={() => removeLine(line.id)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
      </Button>
    </div>
  );
}
