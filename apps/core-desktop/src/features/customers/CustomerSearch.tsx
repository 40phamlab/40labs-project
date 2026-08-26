// [PHASE: MVP]
// [SPEC: CONTEXT/SPEC/customers.md, CONTEXT/SPEC/sales-pos.md, CONTEXT/SPEC/lab-module.md]
// THIS IS THE ONLY CUSTOMER SEARCH COMPONENT IN THE APP — GOTCHAS.md #2.
// Sales/POS and Lab module both import this same component, never fork it.

import { useState, useMemo } from 'react';
import type { Customer } from '@40labs/types';
import { Input, Card } from '@40labs/ui-components';
import { useCustomerList } from './useCustomers';

interface CustomerSearchProps {
  onSelect: (customer: Customer | null) => void;
}

/**
 * Single shared Customer Search component for the entire app.
 * Used in Sales/POS and Lab modules to identify or select a customer.
 */
export function CustomerSearch({ onSelect }: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: customers, isLoading } = useCustomerList();

  const filteredCustomers = useMemo(() => {
    if (!customers || !searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(query) ||
        c.phone.includes(query)
    );
  }, [customers, searchQuery]);

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Search Customer"
        placeholder="Enter name or phone number..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        autoComplete="off"
      />

      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {/* Explicit Walk-in Option */}
        <Card
          interactive
          className="flex justify-between items-center py-2 px-3"
          onClick={() => onSelect(null)}
        >
          <span className="font-ui font-medium">Walk-in Customer</span>
          <span className="text-xs text-black/40">No registration</span>
        </Card>

        {isLoading ? (
          <div className="p-4 text-center font-ui text-black/50">Loading customers...</div>
        ) : (
          filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              interactive
              className="flex justify-between items-center py-2 px-3"
              onClick={() => onSelect(customer)}
            >
              <div className="flex flex-col">
                <span className="font-ui font-medium">{customer.full_name}</span>
                <span className="font-mono text-xs text-black/50">{customer.phone}</span>
              </div>

              {customer.outstanding_balance > 0 && (
                <div className="text-right">
                  <span className="text-accent font-ui font-bold">
                    TZS {customer.outstanding_balance.toLocaleString()}
                  </span>
                  <div className="text-[10px] text-accent/70 uppercase font-ui tracking-wider">
                    Debt
                  </div>
                </div>
              )}
            </Card>
          ))
        )}

        {!isLoading && searchQuery && filteredCustomers.length === 0 && (
          <div className="p-4 text-center font-ui text-black/50">
            No customers found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
