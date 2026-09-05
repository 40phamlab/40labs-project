import React, { useMemo, useState } from 'react';
import {
  Card,
  Button,
  Input,
  ProductCard,
  InfoDetail,
  EntitySummaryPanel,
} from '@40labs/ui-components';
import { useInventoryList } from '../inventory/useInventory';
import {
  useCustomerList,
  useCustomer,
  useCreateCustomer,
} from '../customers/useCustomers';
import { useSaleCart } from './useSales';
import { SaleCartTable } from './SaleCartTable';
import { SaleSummaryPanel } from './SaleSummaryPanel';
import type { Customer } from '@40labs/types';

export default function SalesScreen() {
  const { data: inventory = [], isLoading } = useInventoryList();
  const { data: customers = [] } = useCustomerList();
  const { lines, customer_id, addLine, setCustomer } = useSaleCart();

  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [draft, setDraft] = useState<{ full_name: string; phone: string } | null>(
    null,
  );
  const [medicineSearch, setMedicineSearch] = useState('');

  const createCustomer = useCreateCustomer();
  const { data: persisted } = useCustomer(customer_id);
  const customer = selected ?? persisted ?? null;

  const matches = useMemo(
    () =>
      customers.filter((c) => {
        const name = customerName.trim().toLowerCase(),
          contact = customerContact.trim().toLowerCase();
        const nameOk = !name || c.full_name.toLowerCase().includes(name);
        const contactOk =
          !contact ||
          c.phone.toLowerCase().includes(contact) ||
          (c.email ?? '').toLowerCase().includes(contact);
        return (name || contact) && nameOk && contactOk;
      }),
    [customers, customerName, customerContact],
  );

  const filteredInventory = useMemo(() => {
    const q = medicineSearch.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(
      (i) =>
        i.medicine.name.toLowerCase().includes(q) ||
        i.medicine.generic_name.toLowerCase().includes(q) ||
        i.batch_number.toLowerCase().includes(q),
    );
  }, [inventory, medicineSearch]);

  const selectCustomer = (c: Customer) => {
    setSelected(c);
    setDraft(null);
    setCustomerName(c.full_name);
    setCustomerContact(c.phone);
    setCustomer(c.id);
  };

  const changeCustomer = () => {
    setSelected(null);
    setDraft(null);
    setCustomer(null);
    setCustomerName('');
    setCustomerContact('');
  };

  const updateName = (v: string) => {
    setSelected(null);
    setCustomer(null);
    setCustomerName(v);
    setDraft({ full_name: v, phone: customerContact });
  };

  const updateContact = (v: string) => {
    setSelected(null);
    setCustomer(null);
    setCustomerContact(v);
    setDraft({ full_name: customerName, phone: v });
  };

  const complete = async () => {
    if (customer_id) return true;
    if (!draft?.full_name.trim() && !draft?.phone.trim()) return true;
    if (!draft?.full_name.trim() || !draft.phone.trim()) {
      alert('Enter both customer name and phone, or continue as walk-in.');
      return false;
    }
    const c = await createCustomer.mutateAsync({
      full_name: draft.full_name.trim(),
      phone: draft.phone.trim(),
      email: null,
    });
    selectCustomer(c);
    return true;
  };

  return (
    <div className="h-full bg-surface text-text p-3 flex flex-col gap-2 overflow-hidden">
      <header className="h-10 shrink-0 flex items-center gap-3 px-1">
        <div className="w-8 h-8 rounded-full bg-primary elevation-raised" />
        <h1 className="font-heading text-sm font-bold text-accent">Sales</h1>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(205px,24%)_minmax(360px,1fr)_minmax(230px,27%)] gap-1.5">
        <aside className="min-h-0 overflow-hidden rounded-card bg-panel p-2 elevation-raised flex flex-col">
          <div className="shrink-0 space-y-2">
            <Input
              value={customerName}
              onChange={(e) => updateName(e.target.value)}
              placeholder="Customer’s name"
              className="!h-8 !text-xs"
            />
            <Input
              value={customerContact}
              onChange={(e) => updateContact(e.target.value)}
              placeholder="Customer’s phone/email"
              className="!h-8 !text-xs"
            />
            {matches.length > 0 && !customer && (
              <div className="space-y-1">
                {matches.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="w-full rounded-input bg-panel-strong p-2 text-left elevation-raised hover:bg-panel transition-colors"
                  >
                    <p className="text-xs text-text">{c.full_name}</p>
                    <p className="text-tiny font-mono text-text-muted">
                      {c.phone}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <EntitySummaryPanel title="Customer Info" className="mt-2">
            {customer ? (
              <>
                <InfoDetail label="Full Name" value={customer.full_name} />
                <InfoDetail label="Phone" value={customer.phone} monospace />
                {customer.email && (
                  <InfoDetail label="Email" value={customer.email} />
                )}
                <InfoDetail label="Service" value="Sales / Pharmacy" />
                <InfoDetail
                  label="Outstanding Balance"
                  value={`TZS ${customer.outstanding_balance.toLocaleString()}`}
                  monospace
                />
              </>
            ) : (
              <>
                <InfoDetail label="Status" value="Walk-in Customer" />
                {draft?.full_name && (
                  <InfoDetail label="Draft Name" value={draft.full_name} />
                )}
                {draft?.phone && (
                  <InfoDetail
                    label="Draft Contact"
                    value={draft.phone}
                    monospace
                  />
                )}
              </>
            )}
          </EntitySummaryPanel>

          <div className="mt-2 shrink-0 flex gap-1.5">
            <Button
              intent="neutral"
              size="sm"
              fullWidth
              onClick={changeCustomer}
              className="!text-tiny"
            >
              {customer ? 'Change' : 'Walk-in'}
            </Button>
            <Button
              intent="neutral"
              size="sm"
              fullWidth
              onClick={() => alert('Feature coming soon')}
              className="!text-tiny"
            >
              Send Report
            </Button>
          </div>
        </aside>

        <section className="min-h-0 flex flex-col rounded-card bg-panel elevation-raised overflow-hidden">
          <div className="h-10 shrink-0 px-3 flex items-center justify-between border-b border-border">
            <span className="font-heading text-sm font-semibold text-text">
              Cart
            </span>
            <span className="rounded-full bg-primary px-2 py-0.5 text-tiny text-surface font-semibold">
              {lines.length} ITEMS
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <SaleCartTable />
          </div>
          <SaleSummaryPanel
            onCompleteSale={complete}
            completingSale={createCustomer.isPending}
          />
        </section>

        <aside className="min-h-0 rounded-card bg-panel elevation-raised p-2 flex flex-col overflow-hidden">
          <Input
            value={medicineSearch}
            onChange={(e) => setMedicineSearch(e.target.value)}
            placeholder="Search medicine..."
            className="!h-8 !text-xs"
          />
          <div className="min-h-0 flex-1 overflow-y-auto mt-2 space-y-2">
            {isLoading ? (
              <p className="p-4 text-xs text-text-muted">Loading...</p>
            ) : (
              filteredInventory.map((item) => (
                <ProductCard
                  key={item.id}
                  name={item.medicine.name}
                  subtitle={item.medicine.generic_name}
                  stock={item.quantity}
                  price={item.sell_price.toLocaleString()}
                  info={`Batch: ${item.batch_number}`}
                  onClick={() => addLine(item.id, 1)}
                />
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
