import * as React from 'react';
import {
  PageViewport,
  PageHeader,
  PageToolbar,
  PageContent,
  Button,
  SearchInput,
} from '@40labs/ui-components';
import { Plus } from 'lucide-react';
import { CustomerStatsBar } from './components/CustomerStatsBar';
import { CustomerFilterBar } from './components/CustomerFilterBar';
import { CustomerList } from './components/CustomerList';
import { AddCustomerModal } from './components/AddCustomerModal';
import { CustomerDetailDrawer } from './components/CustomerDetailDrawer';
import { useCustomers } from '../../hooks/useCustomers';

export const CustomersScreen: React.FC = () => {
  const {
    customers,
    searchTerm,
    setSearchTerm,
    selectedCustomerId,
    setSelectedCustomerId,
    isAddModalOpen,
    setAddModalOpen,
    addCustomer,
  } = useCustomers();

  const [timeRange, setTimeRange] = React.useState('all');

  const filteredCustomers = React.useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm);

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

      return matchesSearch && matchesTime;
    });
  }, [customers, searchTerm, timeRange]);

  const selectedCustomer = React.useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const handleClearAll = React.useCallback(() => {
    setTimeRange('all');
    setSearchTerm('');
  }, [setSearchTerm]);

  return (
    <PageViewport>
      {/* Header */}
      <PageHeader
        title="Customer Management"
        subtitle="Manage customer profiles, directory search, and purchasing histories."
        actions={
          <Button
            intent="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setAddModalOpen(true)}
          >
            Add Customer
          </Button>
        }
      />

      {/* Toolbar */}
      <PageToolbar
        left={
          <CustomerFilterBar
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            onClearAll={handleClearAll}
          />
        }
        right={
          <SearchInput
            className="w-64"
            placeholder="Search name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
          />
        }
      />

      {/* Content - ONE controlled content scroll region */}
      <PageContent scrollable={true} padding="normal">
        <CustomerStatsBar
          customers={customers}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddClick={() => setAddModalOpen(true)}
        />

        <div className="flex-1 min-h-0">
          <CustomerList
            customers={filteredCustomers}
            onViewDetails={setSelectedCustomerId}
          />
        </div>
      </PageContent>

      {/* Modals & Drawers */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={(cust) =>
          addCustomer({
            fullName: cust.full_name,
            phone: cust.phone,
            email: cust.email || undefined,
            notes: cust.notes || undefined,
          })
        }
      />

      <CustomerDetailDrawer
        customer={selectedCustomer}
        isOpen={!!selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </PageViewport>
  );
};
