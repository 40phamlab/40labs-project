import { useState, useMemo } from 'react';
import { Input, Card } from '@40labs/ui-components';
import { useSaleCart } from './useSales';
import { CustomerSearch } from '../customers/CustomerSearch';
import { useCustomer } from '../customers/useCustomers';

/**
 * Customer identification panel for the Sales POS.
 * Features two inputs that trigger a shared search component.
 * [PHASE: MVP]
 */
export function CustomerPanel() {
  const { customer_id, setCustomer } = useSaleCart();
  const { data: customer } = useCustomer(customer_id);

  const [nameQuery, setNameQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');

  // Combined search string for the underlying CustomerSearch logic
  const combinedQuery = useMemo(() => {
    return `${nameQuery} ${phoneQuery}`.trim();
  }, [nameQuery, phoneQuery]);

  const isSearching = !customer_id && combinedQuery.length > 0;

  // Selected state: Show summary and a "Change" action
  if (customer) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <h3 className="text-[10px] font-ui uppercase tracking-widest text-black/40 font-bold">
          Customer Details
        </h3>
        <Card className="flex flex-col gap-3 !p-4 border-primary/20 bg-primary/5">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="font-ui font-bold text-black/80">{customer.full_name}</span>
              <span className="font-mono text-xs text-black/40">{customer.phone}</span>
            </div>
            <button
              onClick={() => {
                setCustomer(null);
                setNameQuery('');
                setPhoneQuery('');
              }}
              className="text-[10px] font-ui font-bold text-primary uppercase tracking-wider hover:underline"
            >
              Change
            </button>
          </div>

          {customer.outstanding_balance > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-black/5">
              <span className="text-[9px] font-ui uppercase text-accent font-semibold">Debt Owed</span>
              <span className="font-mono text-sm font-bold text-accent">
                TZS {customer.outstanding_balance.toLocaleString()}
              </span>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Initial/Searching state: Two inputs that reveal results
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-[10px] font-ui uppercase tracking-widest text-black/40 font-bold">
          Customer Identification
        </h3>
        <div className="flex flex-col gap-3">
          <Input
            label="Customer's name"
            placeholder="Search by name..."
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            autoComplete="off"
          />
          <Input
            label="Customer's phone/email"
            placeholder="Search by contact..."
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {isSearching && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="h-px bg-black/5" />
          <CustomerSearch
            query={combinedQuery}
            hideInput
            onSelect={(c) => {
              setCustomer(c ? c.id : null);
              if (c) {
                setNameQuery(c.full_name);
                setPhoneQuery(c.phone);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
