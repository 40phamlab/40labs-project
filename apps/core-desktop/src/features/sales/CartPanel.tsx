// [PHASE: MVP]
import { useSaleCart } from './useSales';
import { CartLineRow } from './CartLineRow';
import { CartTotalsFooter } from './CartTotalsFooter';

/**
 * Main Cart Panel for the Sales POS.
 * Composes individual line rows and the totals footer.
 */
export function CartPanel() {
  const { lines } = useSaleCart();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-surface/10">
        <h2 className="font-heading text-base font-bold text-black/70 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          Cart
        </h2>
        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {lines.length} Items
        </span>
      </div>

      {/* Line Items Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            <p className="mt-4 font-ui text-sm font-medium">Cart is empty</p>
          </div>
        ) : (
          lines.map((line) => (
            <CartLineRow key={line.id} line={line} />
          ))
        )}
      </div>

      {/* Footer / Totals */}
      <CartTotalsFooter />
    </div>
  );
}
