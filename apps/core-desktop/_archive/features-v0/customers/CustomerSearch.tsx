import { useMemo, useState } from 'react';
import type { Customer } from '@40labs/types';
import { Card, Input } from '@40labs/ui-components';
import { useCustomerList } from './useCustomers';

interface GuestDraft {
  full_name: string;
  phone: string;
}

interface Props {
  onSelect: (customer: Customer | null) => void;
  selectedCustomer?: Customer | null;
  guestDraft?: GuestDraft | null;
  onGuestChange?: (draft: GuestDraft) => void;
}

export function CustomerSearch({
  onSelect,
  selectedCustomer = null,
  guestDraft = null,
  onGuestChange
}: Props) {
  const [q, setQ] = useState('');
  const { data: customers = [], isLoading } = useCustomerList();

  const matches = useMemo(() => {
    const x = q.trim().toLowerCase();
    if (!x) return [];
    return customers.filter(c =>
      c.full_name.toLowerCase().includes(x) ||
      c.phone.toLowerCase().includes(x) ||
      (c.email ?? '').toLowerCase().includes(x)
    );
  }, [customers, q]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search customer by name or phone..."
      />

      {selectedCustomer ? (
        <Card className="bg-panel-strong p-3">
          <p className="text-xs font-semibold">{selectedCustomer.full_name}</p>
          <p className="mt-1 font-mono text-[10px] text-text-muted">{selectedCustomer.phone}</p>
          <button
            onClick={() => onSelect(null)}
            className="mt-2 text-[10px] text-accent"
          >
            Change
          </button>
        </Card>
      ) : q && (
        <>
          {isLoading ? (
            <p className="text-xs text-text-muted">Looking up customers...</p>
          ) : (
            matches.map(c => (
              <Card
                key={c.id}
                interactive
                className="bg-panel-strong p-3"
                onClick={() => onSelect(c)}
              >
                <p className="text-xs font-semibold">{c.full_name}</p>
                <p className="mt-1 font-mono text-[10px] text-text-muted">{c.phone}</p>
              </Card>
            ))
          )}
          {!isLoading && !matches.length && onGuestChange && (
            <div className="rounded-card bg-panel-strong p-3 elevation-raised">
              <p className="text-xs font-semibold">New / walk-in customer</p>
              <Input
                className="mt-2"
                value={guestDraft?.full_name ?? ''}
                onChange={e => onGuestChange({
                  full_name: e.target.value,
                  phone: guestDraft?.phone ?? ''
                })}
                placeholder="Customer name"
              />
              <Input
                className="mt-2"
                value={guestDraft?.phone ?? ''}
                onChange={e => onGuestChange({
                  full_name: guestDraft?.full_name ?? '',
                  phone: e.target.value
                })}
                placeholder="Phone number"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
