import * as React from 'react';
import { EmptyState } from '@40labs/ui-components';
import { Customer } from '@40labs/types';
import { CustomerListRow } from './CustomerListRow';
import { Users } from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  onViewDetails: (id: string) => void;
}

/**
 * CustomerList
 *
 * Renders a vertical list of customer rows tightly packed as independent chips.
 */
export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onViewDetails,
}) => {
  if (customers.length === 0) {
    return (
      <EmptyState
        icon={<Users size={32} className="opacity-20" />}
        title="No customers found"
        message="We couldn't find any customers matching your current search or filters. Try adjusting them or add a new customer."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {customers.map((customer) => (
        <CustomerListRow
          key={customer.id}
          customer={customer}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};
