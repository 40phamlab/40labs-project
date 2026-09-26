import * as React from 'react';
import {
  DataTable,
  Button,
  MoneyDisplay,
  Avatar,
  type ColumnDefinition,
} from '@40labs/ui-components';
import type { Customer } from '@40labs/types';

interface CustomerListProps {
  customers: Customer[];
  onViewDetails: (id: string) => void;
  loading?: boolean;
  error?: string | Error | null;
  onRetry?: () => void;
}

/**
 * CustomerList
 *
 * Renders a data table of customer records with loading, error, and empty states.
 */
export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onViewDetails,
  loading,
  error,
  onRetry,
}) => {
  const columns: ColumnDefinition<Customer>[] = [
    {
      key: 'full_name',
      header: 'Customer',
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar size="sm" name={item.full_name} />
          <div className="flex flex-col">
            <span className="font-semibold text-text">{item.full_name}</span>
            <span className="text-xs text-text-muted">{item.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email Address',
      render: (item) => (
        <span className="text-xs text-text-muted">{item.email || '—'}</span>
      ),
    },
    {
      key: 'outstanding_balance',
      header: 'Balance',
      align: 'right',
      render: (item) => (
        <MoneyDisplay
          amount={item.outstanding_balance}
          colorize={item.outstanding_balance > 0}
          emphasis="strong"
          className="text-xs"
        />
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (item) => (
        <span className="text-xs text-text-muted font-mono">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '120px',
      render: (item) => (
        <Button
          intent="neutral"
          size="sm"
          onClick={() => onViewDetails(item.id)}
        >
          View Profile
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      data={customers}
      columns={columns}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyMessage="No customers found matching your current search or filters."
      keyExtractor={(item) => item.id}
      density="compact"
    />
  );
};
