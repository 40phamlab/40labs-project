import React from 'react';
import { useInventoryList } from '../inventory/useInventory';
import { useSaleCart } from './useSales';
import { CustomerPanel } from './CustomerPanel';
import { ReceiptPreviewCard } from './ReceiptPreviewCard';
import { CartPanel } from './CartPanel';
import { MedicineSearchPanel } from './MedicineSearchPanel';

/**
 * SalesScreen Component
 * Root layout for the sales feature.
 *
 * [PHASE: MVP]
 * Layout: 3-column grid [Customer | Cart | Medicine]
 */
export default function SalesScreen() {
  // Reuse existing dependencies as required by the spec.
  // These hooks connect to the shared state used by the sub-panels (Tasks 2-4).
  const { data: _inventory } = useInventoryList();
  const _cart = useSaleCart();

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface">
      {/* Header Row */}
      <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-black/5">
        {/* Pharmacy Logo Placeholder */}
        <div
          className="w-8 h-8 bg-primary rounded-full shrink-0"
          aria-hidden="true"
        />

        <h1 className="font-heading text-xl font-bold text-accent">
          Sales
        </h1>
      </header>

      {/* Main Grid Layout: roughly 320px / 1fr / 320px */}
      <div className="flex-1 grid grid-cols-[320px_1fr_320px] overflow-hidden">

        {/* Column 1: Customer Panel Slot */}
        <div
          data-slot="customer"
          className="border-r border-black/5 flex flex-col overflow-y-auto bg-surface/20"
        >
          <CustomerPanel />
          <ReceiptPreviewCard />
        </div>

        {/* Column 2: Cart Panel Slot */}
        <div
          data-slot="cart"
          className="bg-white flex flex-col overflow-hidden"
        >
          <CartPanel />
        </div>

        {/* Column 3: Medicine Panel Slot */}
        <div
          data-slot="medicine"
          className="border-l border-black/5 flex flex-col overflow-hidden bg-surface/20"
        >
          <MedicineSearchPanel />
        </div>

      </div>
    </div>
  );
}
