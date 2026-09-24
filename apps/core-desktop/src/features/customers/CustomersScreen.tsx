import * as React from 'react';
import { Card } from '@40labs/ui-components';
import { CustomerStatsBar } from './CustomerStatsBar';
import { CustomerFilterBar } from './CustomerFilterBar';
import { CustomerList } from './CustomerList';
import { AddCustomerModal } from './AddCustomerModal';
import { CustomerDetailDrawer } from './CustomerDetailDrawer';
import { useCustomersStore } from '../../stores/useCustomersStore';

export const CustomersScreen: React.FC = () => {
  const customers = useCustomersStore((s) => s.customers);
  const searchTerm = useCustomersStore((s) => s.searchTerm);
  const selectedCustomerId = useCustomersStore((s) => s.selectedCustomerId);
  const isAddModalOpen = useCustomersStore((s) => s.isAddModalOpen);

  const setSearchTerm = useCustomersStore((s) => s.setSearchTerm);
  const setSelectedCustomerId = useCustomersStore((s) => s.setSelectedCustomerId);
  const setAddModalOpen = useCustomersStore((s) => s.setAddModalOpen);
  const addCustomer = useCustomersStore((s) => s.addCustomer);

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
    <div className="p-6 h-full w-full overflow-hidden">
      <Card className="elevation-raised rounded-card h-full w-full p-6 flex flex-col gap-6 overflow-hidden bg-panel">
        <CustomerStatsBar
          customers={customers}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddClick={() => setAddModalOpen(true)}
        />

        <CustomerFilterBar
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onClearAll={handleClearAll}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <CustomerList
            customers={filteredCustomers}
            onViewDetails={setSelectedCustomerId}
          />
        </div>
      </Card>

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
    </div>
  );
};
