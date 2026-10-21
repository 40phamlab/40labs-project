import * as React from 'react';
import {
  DataTable,
  Dropdown,
  DropdownMenuItem,
  IconButton,
  EmptyState,
  type ColumnDefinition,
} from '@40labs/ui-components';
import type { Customer } from '@40labs/types';
import { formatDate, formatPhoneTZ, formatNumberOrUnknown } from '@40labs/i18n';
import { MoreVertical, Eye, Edit, Archive } from 'lucide-react';
import { CustomerAvatar } from './CustomerAvatar';

export async function requirePin(action: string): Promise<boolean> {
  // TODO: [wire in auth phase] [phase: auth]
  console.warn(`[PIN Gated Action] ${action} requested.`);
  return true;
}

interface CustomerListProps {
  customers: Customer[];
  onViewDetails: (id: string) => void;
  onEditCustomer?: (customer: Customer) => void;
  onArchiveCustomer?: (id: string) => void;
  loading?: boolean;
  error?: string | Error | null;
  onRetry?: () => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onViewDetails,
  onEditCustomer,
  onArchiveCustomer,
  loading,
  error,
  onRetry,
}) => {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(50);

  // Reset to page 1 if customers list length changes or filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [customers.length]);

  const paginatedCustomers = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return customers.slice(start, start + pageSize);
  }, [customers, currentPage, pageSize]);

  const totalPages = Math.ceil(customers.length / pageSize) || 1;

  const columns: ColumnDefinition<Customer>[] = [
    {
      key: 'full_name',
      header: 'Customer',
      render: (item) => (
        <div className="flex items-center gap-3">
          <CustomerAvatar
            id={item.id}
            name={item.full_name}
            gender={item.gender || (item.sex === 'male' || item.sex === 'female' ? item.sex : null)}
            size="sm"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-text">{item.full_name}</span>
            <span className="text-xs text-text-muted">{formatPhoneTZ(item.phone)}</span>
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
        <span className={`text-xs font-mono font-bold ${item.outstanding_balance > 0 ? 'text-warning' : 'text-text'}`}>
          {formatNumberOrUnknown(item.outstanding_balance)} TZS
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (item) => (
        <span className="text-xs text-text-muted font-mono">
          {formatDate(item.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '100px',
      render: (item) => {
        const isOpen = activeMenuId === item.id;
        return (
          <div onClick={(e) => e.stopPropagation()} className="relative flex justify-end">
            <Dropdown
              isOpen={isOpen}
              onClose={() => setActiveMenuId(null)}
              trigger={
                <IconButton
                  icon={<MoreVertical size={16} />}
                  label="Actions"
                  intent="ghost"
                  size="sm"
                  onClick={() => setActiveMenuId(isOpen ? null : item.id)}
                />
              }
            >
              <DropdownMenuItem
                icon={<Eye size={14} />}
                label="View Profile"
                onClick={() => {
                  setActiveMenuId(null);
                  onViewDetails(item.id);
                }}
              />
              <DropdownMenuItem
                icon={<Edit size={14} />}
                label="Edit"
                onClick={() => {
                  setActiveMenuId(null);
                  onEditCustomer?.(item);
                }}
              />
              <DropdownMenuItem
                icon={<Archive size={14} />}
                label="Archive"
                onClick={async () => {
                  setActiveMenuId(null);
                  const authorized = await requirePin('customer.archive');
                  if (authorized) {
                    onArchiveCustomer?.(item.id);
                  }
                }}
              />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      data={paginatedCustomers}
      columns={columns}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyState={<EmptyState variant="filtered" />}
      keyExtractor={(item) => item.id}
      density="compact"
      onRowClick={(item) => onViewDetails(item.id)}
      pagination={{
        currentPage,
        totalPages,
        pageSize,
        totalItems: customers.length,
        pageSizeOptions: [25, 50, 100],
        onPageChange: setCurrentPage,
        onPageSizeChange: (sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        },
      }}
    />
  );
};
