import { useMemo } from 'react';
import type { PaymentMethod } from '@40labs/types';
import { Button } from '@40labs/ui-components';
import { useSaleCart } from './useSales';

interface SaleSummaryPanelProps {
  onCompleteSale?: () => Promise<boolean> | boolean;
  completingSale?: boolean;
}

/** Bottom checkout summary for the customer-first POS layout. */
export function SaleSummaryPanel({ onCompleteSale, completingSale = false }: SaleSummaryPanelProps) {
  const { lines, payment_method, discount_amount, setPaymentMethod, setDiscountAmount, reset } = useSaleCart();
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.subtotal, 0), [lines]);
  const grandTotal = Math.max(0, subtotal - discount_amount);

  const handleCompleteSale = async () => {
    if (lines.length === 0) return;
    const completed = await onCompleteSale?.();
    if (completed === false) return;
    console.log('Completing sale:', { lines, payment_method, discount_amount, grand_total: grandTotal, timestamp: new Date().toISOString() });
    reset();
    alert('Sale Completed (Mock)');
  };

  return (
    <div className="shrink-0 border-t border-black/5 bg-surface px-6 py-5">
      <div className="grid grid-cols-[1fr_auto] gap-6">
        <div className="flex min-w-0 items-center gap-5">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/35">Subtotal</p><p className="mt-1 font-mono text-sm text-black/65">TZS {subtotal.toLocaleString()}</p></div>
          <div><label htmlFor="sale-discount" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/35">Discount</label><input id="sale-discount" type="number" min="0" value={discount_amount || ''} onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))} placeholder="0" className="mt-1 block h-9 w-28 rounded-input bg-surface-strong px-3 font-mono text-xs elevation-inset focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          <div><label htmlFor="sale-payment" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/35">Payment</label><select id="sale-payment" value={payment_method} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="mt-1 block h-9 rounded-input bg-surface-strong px-3 text-xs font-ui elevation-inset focus:outline-none focus:ring-2 focus:ring-primary/30"><option value="cash">Cash</option><option value="mobile_money">Mobile Money</option><option value="card">Card</option><option value="credit">Credit</option></select></div>
        </div>
        <div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40">Grand total</p><p className="mt-1 font-heading text-2xl font-bold text-primary">{grandTotal.toLocaleString()} <span className="font-mono text-xs font-medium text-primary/70">TZS</span></p></div>
      </div>
      <div className="mt-4 flex gap-3"><Button intent="danger" size="lg" className="min-w-36" disabled={lines.length === 0} onClick={reset}>Delete</Button><Button size="lg" fullWidth disabled={lines.length === 0 || completingSale} loading={completingSale} onClick={handleCompleteSale}>Confirm Sale</Button></div>
    </div>
  );
}
