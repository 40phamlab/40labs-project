// [PHASE: MVP]
import { useMemo } from 'react';
import type { PaymentMethod } from '@40labs/types';
import { Button, Input, Card } from '@40labs/ui-components';
import { useSaleCart } from './useSales';
import { CustomerSearch } from '../customers/CustomerSearch';

/**
 * Summary panel for the POS.
 * Handles customer selection, totals, payment details, and sale completion.
 */
export function SaleSummaryPanel() {
  const {
    lines,
    customer_id,
    payment_method,
    discount_amount,
    setCustomer,
    setPaymentMethod,
    setDiscountAmount,
    reset,
  } = useSaleCart();

  const subtotal = useMemo(() =>
    lines.reduce((sum, l) => sum + l.subtotal, 0),
    [lines]
  );

  const grandTotal = Math.max(0, subtotal - discount_amount);

  const handleCompleteSale = () => {
    const saleData = {
      lines,
      customer_id,
      payment_method,
      discount_amount,
      grand_total: grandTotal,
      timestamp: new Date().toISOString(),
    };

    console.log('Completing sale:', saleData);
    // Real persistence (sqlx/Tauri) will be wired here in a later task.
    reset();
    alert('Sale Completed (Mock)');
  };

  return (
    <div className="w-80 flex flex-col gap-6 bg-surface/30 p-4 border-l border-black/5">
      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-ui uppercase tracking-widest text-black/40 font-semibold">
          Customer
        </h3>
        {customer_id ? (
          <Card className="flex justify-between items-center py-2 px-3 border border-primary/20">
            <div className="flex flex-col">
              <span className="font-ui font-medium text-sm">Selected Customer</span>
              <span className="text-[10px] font-mono text-black/40">ID: {customer_id}</span>
            </div>
            <button
              onClick={() => setCustomer(null)}
              className="text-xs text-danger font-medium"
            >
              Clear
            </button>
          </Card>
        ) : (
          <div className="max-h-64 overflow-y-auto rounded-card border border-black/5 p-2 bg-white">
            <CustomerSearch onSelect={(c) => setCustomer(c ? c.id : null)} />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-ui uppercase tracking-widest text-black/40 font-semibold">
          Payment & Totals
        </h3>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-ui text-black/70">Payment Method</label>
          <select
            value={payment_method}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="rounded-input px-3 py-2 bg-surface elevation-inset font-ui focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="cash">Cash</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="card">Card</option>
            <option value="credit">Credit (Store Debt)</option>
          </select>
        </div>

        <Input
          label="Discount (TZS)"
          type="number"
          monospace
          value={discount_amount}
          onChange={(e) => setDiscountAmount(Number(e.target.value))}
        />
      </section>

      <div className="mt-auto pt-6 border-t border-black/5 flex flex-col gap-4">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-ui text-black/50">Grand Total</span>
          <div className="text-right">
            <span className="font-mono text-3xl font-bold text-primary">
              {grandTotal.toLocaleString()}
            </span>
            <span className="text-xs font-mono ml-1 text-primary/70">TZS</span>
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          disabled={lines.length === 0}
          onClick={handleCompleteSale}
        >
          Complete Sale
        </Button>
      </div>
    </div>
  );
}
