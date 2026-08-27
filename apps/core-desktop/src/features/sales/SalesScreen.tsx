import React, { useMemo, useState } from 'react';
import { Card } from '@40labs/ui-components';
import { useInventoryList } from '../inventory/useInventory';
import { CustomerSearch } from '../customers/CustomerSearch';
import { useCustomer, useCreateCustomer } from '../customers/useCustomers';
import { useSaleCart } from './useSales';
import { SaleCartTable } from './SaleCartTable';
import { SaleSummaryPanel } from './SaleSummaryPanel';
import type { Customer } from '@40labs/types';

/**
 * Sales/POS workspace.
 * Reference direction: customer-first left, cart center, inventory lookup right.
 * All surfaces use the project-wide soft/off-white palette rather than pure white.
 */
export default function SalesScreen() {
  const { data: inventory = [], isLoading } = useInventoryList();
  const { lines, customer_id, addLine, setCustomer } = useSaleCart();
  const [customerDraft, setCustomerDraft] = useState<{ full_name: string; phone: string } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [medicineSearch, setMedicineSearch] = useState('');
  const createCustomer = useCreateCustomer();

  const { data: persistedCustomer } = useCustomer(customer_id);
  const activeCustomer = selectedCustomer ?? persistedCustomer ?? null;

  const filteredInventory = useMemo(() => {
    const query = medicineSearch.trim().toLowerCase();
    if (!query) return inventory;
    return inventory.filter((item) =>
      item.medicine.name.toLowerCase().includes(query) ||
      item.medicine.generic_name.toLowerCase().includes(query) ||
      item.batch_number.toLowerCase().includes(query)
    );
  }, [inventory, medicineSearch]);

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    setCustomerDraft(null);
    setCustomer(customer?.id ?? null);
  };

  const handleGuestChange = (draft: { full_name: string; phone: string }) => {
    setSelectedCustomer(null);
    setCustomerDraft(draft);
    setCustomer(null);
  };

  const handleCompleteSale = async (): Promise<boolean> => {
    if (customer_id) return true;
    if (!customerDraft?.full_name.trim() && !customerDraft?.phone.trim()) return true;
    if (!customerDraft?.full_name.trim() || !customerDraft.phone.trim()) {
      alert('Enter both customer name and phone, or continue as walk-in.');
      return false;
    }

    const customer = await createCustomer.mutateAsync({
      full_name: customerDraft.full_name.trim(),
      phone: customerDraft.phone.trim(),
      email: null,
    });
    setSelectedCustomer(customer);
    setCustomerDraft(null);
    setCustomer(customer.id);
    return true;
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface">
      <header className="flex h-20 shrink-0 items-center gap-4 border-b border-black/5 bg-surface-strong px-7">
        <div className="h-10 w-10 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        <div>
          <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-black/40">Point of Sale</p>
          <h1 className="font-heading text-2xl font-bold text-accent">Sales</h1>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-ui font-medium text-primary">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Offline-ready
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(290px,25%)_minmax(430px,1fr)_minmax(300px,27%)]">
        <aside className="min-h-0 overflow-y-auto border-r border-black/5 bg-surface px-5 py-6">
          <div className="mb-5">
            <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">Customer identification</p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-black/80">Who is buying?</h2>
          </div>

          <CustomerSearch
            selectedCustomer={activeCustomer}
            guestDraft={customerDraft}
            onSelect={handleCustomerSelect}
            onGuestChange={handleGuestChange}
          />

          {activeCustomer && (
            <Card className="mt-5 border border-primary/10 bg-surface-strong p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-lg font-semibold text-black/80">{activeCustomer.full_name}</p>
                  <p className="mt-1 font-mono text-xs text-black/45">{activeCustomer.phone}</p>
                  {activeCustomer.email && <p className="mt-1 text-xs text-black/45">{activeCustomer.email}</p>}
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-ui font-semibold uppercase tracking-wider text-primary">Registered</span>
              </div>
              {activeCustomer.outstanding_balance > 0 && (
                <div className="mt-4 border-t border-black/5 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-ui text-black/45">Outstanding balance</span>
                    <span className="font-mono text-sm font-bold text-accent">TZS {activeCustomer.outstanding_balance.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card className="mt-5 bg-surface-strong p-4">
            <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">Sale customer rule</p>
            <p className="mt-2 text-sm leading-5 text-black/55">A quick buyer does not need registration. If name and phone are entered, 40Labs saves the customer when the sale is confirmed.</p>
          </Card>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col bg-surface-strong">
          <div className="flex h-20 shrink-0 items-center justify-between border-b border-black/5 px-7">
            <div className="flex items-center gap-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
                <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <h2 className="font-heading text-xl font-semibold text-black/75">Cart</h2>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-ui font-semibold text-primary">{lines.length} {lines.length === 1 ? 'item' : 'items'}</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <SaleCartTable />
          </div>

          <SaleSummaryPanel onCompleteSale={handleCompleteSale} completingSale={createCustomer.isPending} />
        </section>

        <aside className="min-h-0 overflow-hidden border-l border-black/5 bg-surface px-5 py-6">
          <div className="mb-5">
            <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">Inventory lookup</p>
            <div className="relative mt-3">
              <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/30" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
              <input value={medicineSearch} onChange={(e) => setMedicineSearch(e.target.value)} placeholder="Search medicine..." aria-label="Search medicine" className="h-12 w-full rounded-input bg-surface-strong pl-11 pr-4 font-ui text-sm text-black/75 elevation-inset placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
            {isLoading && <p className="py-8 text-center text-sm text-black/40">Loading inventory...</p>}
            {!isLoading && filteredInventory.length === 0 && <p className="py-8 text-center text-sm text-black/40">No medicines found.</p>}
            {filteredInventory.map((item) => {
              const lowStock = item.quantity <= item.low_stock_threshold;
              const expired = new Date(item.expiry_date) < new Date();
              return (
                <Card key={item.id} interactive className="p-4" onClick={() => !expired && addLine(item.id, 1)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate font-ui font-semibold text-black/80">{item.medicine.name}</p><p className="mt-1 text-xs italic text-black/35">{item.medicine.generic_name}</p></div>
                    <span className="shrink-0 rounded-full bg-black/5 px-2 py-1 font-mono text-[10px] text-black/45">{item.quantity} {item.medicine.unit}s</span>
                  </div>
                  <div className="mt-4 flex items-end justify-between border-t border-black/5 pt-3">
                    <div><p className="text-[10px] uppercase tracking-wider text-black/35">Batch</p><p className="mt-1 font-mono text-[11px] text-black/50">{item.batch_number}</p></div>
                    <p className="font-mono text-sm font-bold text-primary">TZS {item.sell_price.toLocaleString()}</p>
                  </div>
                  {(lowStock || expired) && <div className="mt-3 flex gap-2">{lowStock && <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent">Low stock</span>}{expired && <span className="rounded-full bg-danger/10 px-2 py-1 text-[10px] font-semibold text-danger">Expired</span>}</div>}
                </Card>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
