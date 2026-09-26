import * as React from 'react';
import {
  PageViewport,
  PageToolbar,
  PageContent,
  Button,
  SearchInput,
  IconButton,
} from '@40labs/ui-components';
import { Plus, RefreshCw } from 'lucide-react';
import { CustomerStatsBar } from './components/CustomerStatsBar';
import { CustomerFilterBar } from './components/CustomerFilterBar';
import { CustomerList } from './components/CustomerList';
import { AddCustomerModal } from './components/AddCustomerModal';
import { CustomerDetailDrawer } from './components/CustomerDetailDrawer';
import { useCustomers } from '../../hooks/useCustomers';

export const CustomersScreen: React.FC = () => {
  const {
    customers,
    isLoading,
    isError,
    error,
    refetch,
    searchTerm,
    setSearchTerm,
    selectedCustomerId,
    setSelectedCustomerId,
    isAddModalOpen,
    setAddModalOpen,
    addCustomer,
    isAdding,
  } = useCustomers();

  const [timeRange, setTimeRange] = React.useState('all');
  const [balanceFilter, setBalanceFilter] = React.useState('all');

  const filteredCustomers = React.useMemo(() => {
    return customers.filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q));

      let matchesTime = true;
      const createdAt = new Date(c.created_at);
      const now = new Date();

      if (timeRange === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        matchesTime = createdAt >= startOfToday;
      } else if (timeRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesTime = createdAt >= weekAgo;
      } else if (timeRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesTime = createdAt >= monthAgo;
      }

      let matchesBalance = true;
      if (balanceFilter === 'debtors') {
        matchesBalance = c.outstanding_balance > 0;
      } else if (balanceFilter === 'clear') {
        matchesBalance = c.outstanding_balance === 0;
      }

      return matchesSearch && matchesTime && matchesBalance;
    });
  }, [customers, searchTerm, timeRange, balanceFilter]);

  const selectedCustomer = React.useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const handleClearAll = React.useCallback(() => {
    setTimeRange('all');
    setBalanceFilter('all');
    setSearchTerm('');
  }, [setSearchTerm]);

  return (
    <PageViewport>
      {/* Toolbar */}
      <PageToolbar
        left={
          <CustomerFilterBar
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            balanceFilter={balanceFilter}
            onBalanceFilterChange={setBalanceFilter}
            onClearAll={handleClearAll}
          />
        }
        right={
          <div className="flex items-center gap-3">
            <Button
              type="button"
              intent="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setAddModalOpen(true)}
            >
              Add Customer
            </Button>
            <SearchInput
              className="w-64"
              placeholder="Search name, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
            <IconButton
              icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              label="Refresh customers"
              intent="ghost"
              size="sm"
              onClick={() => refetch()}
            />
          </div>
        }
      />

      {/* Content */}
      <PageContent scrollable={false} variant="transparent" padding="none">
        <div className="flex flex-col gap-3 h-full w-full overflow-hidden">
          {/* KPI Stats Bar */}
          <CustomerStatsBar customers={customers} />

          {/* Table Region */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <CustomerList
              customers={filteredCustomers}
              onViewDetails={setSelectedCustomerId}
              loading={isLoading}
              error={isError ? (error as Error) : null}
              onRetry={() => refetch()}
            />
          </div>
        </div>
      </PageContent>

      {/* Modals & Drawers */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={async (payload) => {
          await addCustomer(payload);
        }}
        isLoading={isAdding}
      />

      <CustomerDetailDrawer
        customer={selectedCustomer}
        isOpen={Boolean(selectedCustomerId)}
        onClose={() => setSelectedCustomerId(null)}
      />
    </PageViewport>
  );
};
