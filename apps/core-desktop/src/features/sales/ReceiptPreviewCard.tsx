// [PHASE: MVP]
import { useMemo } from 'react';
import { Card } from '@40labs/ui-components';
import { useSaleCart } from './useSales';
import { mockBusiness } from '../../lib/mockData';
import { useInventoryList } from '../inventory/useInventory';

/**
 * Live receipt preview card.
 * Shows business info, active cart items, and sync status.
 * [SPEC: CONTEXT/SPEC/sales-pos.md]
 */
export function ReceiptPreviewCard() {
  const { lines } = useSaleCart();
  const { data: inventory } = useInventoryList();

  // Resolve medicine names for the lines
  const enrichedLines = useMemo(() => {
    return lines.map((line) => {
      const invItem = inventory?.find((i) => i.id === line.inventory_item_id);
      return {
        ...line,
        name: invItem?.medicine.name || 'Unknown Item',
      };
    });
  }, [lines, inventory]);

  const total = useMemo(() => lines.reduce((sum, l) => sum + l.subtotal, 0), [lines]);

  // Mock sync status per GOTCHAS.md #3 and DESIGN-TOKENS.md
  // In a real app, this would be derived from the fiscal sync engine.
  const isSynced = true;

  return (
    <div className="px-6 pb-6">
      <Card className="flex flex-col !p-0 overflow-hidden border-black/5 bg-white elevation-raised">
        {/* Receipt Header: Pharmacy Identity */}
        <div className="flex flex-col items-center text-center p-6 bg-surface/30 border-b border-dashed border-black/10">
          <h2 className="font-heading text-lg font-bold text-black/80">{mockBusiness.name}</h2>
          <div className="flex flex-col gap-0.5 mt-2 text-[10px] font-mono text-black/50">
            <span>{mockBusiness.contacts.mobile}</span>
            <span>{mockBusiness.contacts.email}</span>
          </div>
        </div>

        {/* Receipt Body: Items */}
        <div className="px-6 py-4 flex flex-col gap-3 min-h-[160px]">
          <div className="flex justify-between text-[10px] font-ui uppercase tracking-widest text-black/30 font-bold border-b border-black/5 pb-2">
            <span>Service / Item</span>
            <span>Cost</span>
          </div>

          {enrichedLines.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs font-ui text-black/20 italic py-8">
              No items in cart
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {enrichedLines.map((line) => (
                <div key={line.id} className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-ui text-xs font-medium text-black/70 leading-tight">
                      {line.name}
                    </span>
                    <span className="text-[10px] font-mono text-black/40">
                      Qty: {line.quantity}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-black/60">
                    {line.subtotal.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Receipt Footer: Total & Sync Status */}
        <div className="mt-auto flex flex-col border-t border-black/5">
          <div className="px-6 py-4 flex justify-between items-baseline bg-black/[0.02]">
            <span className="text-[10px] font-ui uppercase tracking-widest text-black/40 font-bold">Total</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl font-bold text-primary">{total.toLocaleString()}</span>
              <span className="text-[10px] font-mono text-primary/60">TZS</span>
            </div>
          </div>

          {/* Passive Sync Status Dot */}
          <div className="px-6 py-2 flex items-center gap-2 border-t border-black/5 bg-white">
            <div
              className={`w-1.5 h-1.5 rounded-full ${isSynced ? 'bg-primary' : 'bg-accent'}`}
              title={isSynced ? 'Synced' : 'Sync Pending'}
            />
            <span className="text-[9px] font-ui uppercase tracking-tighter text-black/30 font-bold">
              {isSynced ? 'Fiscal: Synced' : 'Fiscal: Sync Pending'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
