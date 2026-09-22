import * as React from 'react';
import { Card } from '@40labs/ui-components';
import { mockCustomers } from '../../lib/mockData';
import { CustomerStatsBar } from './CustomerStatsBar';
import { CustomerFilterBar } from './CustomerFilterBar';
import { CustomerList } from './CustomerList';
import { AddCustomerModal } from './AddCustomerModal';
import { CustomerDetailDrawer } from './CustomerDetailDrawer';
import { Customer } from '@40labs/types';

export const CustomersScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [timeRange, setTimeRange] = React.useState('all');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [customers, setCustomers] = React.useState(mockCustomers);

  // Filter logic for the list
  const filteredCustomers = React.useMemo(() => {
    return customers.filter((c) => {
      // 1. Search filter
      const matchesSearch =
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm);

      // 2. Time range filter (Secondary CRM segmentation)
      let matchesTime = true;
      const createdAt = new Date(c.created_at);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (timeRange === 'today') {
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
  }, []);

  const handleViewDetails = React.useCallback((id: string) => {
    setSelectedCustomerId(id);
  }, []);

  const handleAddCustomer = React.useCallback((newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  }, []);

  return (
    <div className="p-6 h-full w-full overflow-hidden">
      <Card className="elevation-raised rounded-card h-full w-full p-6 flex flex-col gap-6 overflow-hidden bg-panel">
        <CustomerStatsBar
          customers={customers}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddClick={() => setIsModalOpen(true)}
        />

        <CustomerFilterBar
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onClearAll={handleClearAll}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <CustomerList
            customers={filteredCustomers}
            onViewDetails={handleViewDetails}
          />
        </div>
      </Card>

      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddCustomer}
      />

      <CustomerDetailDrawer
        customer={selectedCustomer}
        isOpen={!!selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
};
