// [PHASE: MVP]
import type { SaleLine } from '@40labs/types';
import { Button } from '@40labs/ui-components';
import { useSaleCart } from './useSales';
import { useInventoryList } from '../inventory/useInventory';

/**
 * Cart table for the POS.
 * Displays line items, quantity management, and pricing.
 */
export function SaleCartTable() {
  const { lines, setQty, removeLine } = useSaleCart();
  const { data: inventory } = useInventoryList();

  if (lines.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-black/5 rounded-card p-12">
        <div className="text-center">
          <p className="font-ui text-black/40">Cart is empty</p>
          <p className="font-ui text-xs text-black/30 mt-1">Select medicines from the left to start</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left border-separate border-spacing-y-2">
        <thead className="sticky top-0 bg-white z-10">
          <tr className="text-xs uppercase tracking-wider text-black/40 font-ui">
            <th className="px-4 py-2 font-medium">Item</th>
            <th className="px-4 py-2 font-medium">Qty</th>
            <th className="px-4 py-2 font-medium text-right">Unit Price</th>
            <th className="px-4 py-2 font-medium text-right">Subtotal</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const invItem = inventory?.find((i) => i.id === line.inventory_item_id);
            return (
              <tr key={line.id} className="bg-surface/50 elevation-raised rounded-card group">
                <td className="px-4 py-3 rounded-l-card">
                  <div className="flex flex-col">
                    <span className="font-ui font-medium text-sm">
                      {invItem?.medicine.name || 'Unknown Item'}
                    </span>
                    <span className="text-[10px] font-mono text-black/40">
                      Batch: {invItem?.batch_number || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      intent="secondary"
                      className="!p-1 h-6 w-6 flex items-center justify-center"
                      onClick={() => setQty(line.id, line.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="font-mono text-sm w-8 text-center">{line.quantity}</span>
                    <Button
                      size="sm"
                      intent="secondary"
                      className="!p-1 h-6 w-6 flex items-center justify-center"
                      onClick={() => setQty(line.id, line.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm">
                  {line.unit_price.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm font-bold">
                  {line.subtotal.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right rounded-r-card">
                  <button
                    onClick={() => removeLine(line.id)}
                    className="text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
