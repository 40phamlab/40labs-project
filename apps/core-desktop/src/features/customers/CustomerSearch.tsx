import { useMemo, useState } from 'react';
import type { Customer } from '@40labs/types';
import { Card } from '@40labs/ui-components';
import { useCustomerList } from './useCustomers';

interface GuestDraft { full_name: string; phone: string; }
interface CustomerSearchProps {
  onSelect: (customer: Customer | null) => void;
  selectedCustomer?: Customer | null;
  guestDraft?: GuestDraft | null;
  onGuestChange?: (draft: GuestDraft) => void;
}

/** Canonical customer search shared by POS and future Lab flows. */
export function CustomerSearch({ onSelect, selectedCustomer = null, guestDraft = null, onGuestChange }: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: customers = [], isLoading } = useCustomerList();
  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return customers.filter((customer) => customer.full_name.toLowerCase().includes(query) || customer.phone.toLowerCase().includes(query) || customer.email?.toLowerCase().includes(query));
  }, [customers, searchQuery]);
  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/30" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search customer by name or phone..." aria-label="Search customer by name or phone" className="h-12 w-full rounded-input bg-surface-strong pl-11 pr-4 font-ui text-sm text-black/75 elevation-inset placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {selectedCustomer ? (
        <Card className="border border-primary/15 bg-primary/[0.04] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-ui font-semibold text-black/80">{selectedCustomer.full_name}</p><p className="mt-1 font-mono text-xs text-black/45">{selectedCustomer.phone}</p></div><button type="button" onClick={() => onSelect(null)} className="text-xs font-semibold text-black/40 hover:text-danger">Change</button></div></Card>
      ) : (
        <>
          {!hasSearch && <div className="rounded-card border border-dashed border-black/10 px-4 py-5 text-center"><p className="text-sm font-medium text-black/55">Start with a customer search</p><p className="mt-1 text-xs leading-5 text-black/35">Existing customers appear with their saved details and balance.</p><button type="button" onClick={() => onSelect(null)} className="mt-4 rounded-full bg-surface-strong px-4 py-2 text-xs font-semibold text-black/50 elevation-raised hover:text-black/75">Continue as walk-in</button></div>}
          {isLoading && hasSearch && <p className="py-5 text-center text-sm text-black/40">Looking up customers...</p>}
          {!isLoading && hasSearch && filteredCustomers.map((customer) => <Card key={customer.id} interactive className="p-4" onClick={() => onSelect(customer)}><div className="flex items-center justify-between gap-3"><div><p className="font-ui font-semibold text-black/80">{customer.full_name}</p><p className="mt-1 font-mono text-xs text-black/45">{customer.phone}</p></div>{customer.outstanding_balance > 0 && <div className="text-right"><p className="font-mono text-xs font-bold text-accent">TZS {customer.outstanding_balance.toLocaleString()}</p><p className="mt-0.5 text-[10px] uppercase tracking-wider text-accent/70">Debt</p></div>}</div></Card>)}
          {!isLoading && hasSearch && filteredCustomers.length === 0 && onGuestChange && <div className="rounded-card border border-primary/10 bg-surface-strong p-4 elevation-raised"><div className="mb-4"><p className="font-ui font-semibold text-black/75">New / walk-in customer</p><p className="mt-1 text-xs leading-5 text-black/40">No record found. Enter details if the customer wants to leave a contact.</p></div><div className="space-y-3"><input value={guestDraft?.full_name ?? ''} onChange={(e) => onGuestChange({ full_name: e.target.value, phone: guestDraft?.phone ?? '' })} placeholder="Customer name" className="h-11 w-full rounded-input bg-surface px-3 font-ui text-sm text-black/75 elevation-inset placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-primary/30" /><input value={guestDraft?.phone ?? ''} onChange={(e) => onGuestChange({ full_name: guestDraft?.full_name ?? '', phone: e.target.value })} placeholder="Phone number" inputMode="tel" className="h-11 w-full rounded-input bg-surface px-3 font-mono text-sm text-black/75 elevation-inset placeholder:font-ui placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-primary/30" /><div className="flex items-center justify-between gap-3 pt-1"><button type="button" onClick={() => onSelect(null)} className="text-xs font-semibold text-black/40 hover:text-black/65">Walk-in only</button><span className="text-[10px] font-medium uppercase tracking-wider text-black/30">Saved after sale</span></div></div></div>}
        </>
      )}
    </div>
  );
}
