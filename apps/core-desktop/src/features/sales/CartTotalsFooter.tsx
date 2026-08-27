// [PHASE: MVP]
import { Button } from '@40labs/ui-components';
import { useSaleCart, useCompleteSale } from './useSales';

/**
 * Footer for the CartPanel.
 * Displays totals and terminal actions (Confirm/Delete).
 */
export function CartTotalsFooter() {
  const { reset } = useSaleCart();
  const { complete, subtotal, grandTotal, discountAmount, canComplete } = useCompleteSale();

  // MVP: Tax is 0 until tax engine is scoped
  const taxAmount = 0;

  return (
    <div className="flex flex-col gap-4 mt-auto p-6 bg-white border-t border-black/5">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs font-ui text-black/40 uppercase tracking-widest font-semibold">Subtotal</span>
          <span className="font-mono text-sm text-black/60">{subtotal.toLocaleString()}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between items-baseline text-accent">
            <span className="text-xs font-ui uppercase tracking-widest font-semibold">Discount</span>
            <span className="font-mono text-sm font-bold">-{discountAmount.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline">
          <span className="text-xs font-ui text-black/40 uppercase tracking-widest font-semibold">Tax (0%)</span>
          <span className="font-mono text-sm text-black/60">{taxAmount.toLocaleString()}</span>
        </div>

        <div className="h-px bg-black/5 my-1" />

        <div className="flex justify-between items-baseline">
          <span className="text-sm font-ui text-black/80 font-bold uppercase tracking-widest">Grand Total</span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-primary">{grandTotal.toLocaleString()}</span>
            <span className="text-xs font-mono text-primary/60">TZS</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          intent="danger"
          variant="secondary"
          className="flex-1"
          onClick={() => {
            if (confirm('Clear the entire cart?')) {
              reset();
            }
          }}
        >
          Delete
        </Button>
        <Button
          intent="primary"
          className="flex-[2]"
          disabled={!canComplete}
          onClick={complete}
        >
          Confirm Sale
        </Button>
      </div>
    </div>
  );
}
