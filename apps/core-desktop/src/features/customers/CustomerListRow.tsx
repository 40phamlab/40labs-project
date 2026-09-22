import * as React from 'react';
import { Avatar, Button } from '@40labs/ui-components';
import { Customer } from '@40labs/types';

interface CustomerListRowProps {
  customer: Customer;
  onViewDetails: (id: string) => void;
}

/**
 * CustomerListRow
 *
 * Displays a single customer record inside its own lighter rounded chip.
 * Sits close to neighboring rows with a thin underline rule beneath the name only.
 */
export const CustomerListRow: React.FC<CustomerListRowProps> = ({
  customer,
  onViewDetails,
}) => {
  const hasBalance = customer.outstanding_balance > 0;

  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-panel-strong/40 rounded-card border border-border/5">
      <div className="flex items-center gap-3">
        <Avatar size="sm" name={customer.full_name} />
        <div className="flex flex-col">
          <span className="font-bold text-text border-b border-border/30 pb-0.5 w-fit">
            {customer.full_name}
          </span>
          <span className="text-xs text-text-muted mt-0.5">
            {customer.phone}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className={`w-2 h-2 rounded-full ${
            hasBalance ? 'bg-accent' : 'bg-panel-strong'
          }`}
        />
        <Button
          intent="neutral"
          size="sm"
          className="rounded-full px-4"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(customer.id);
          }}
        >
          more info
        </Button>
      </div>
    </div>
  );
};
