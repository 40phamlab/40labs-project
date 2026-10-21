import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Customer } from '@40labs/types';
import { customersApi, AddCustomerPayload, UpdateCustomerPayload } from '../api';
import { customerKeys, dashboardKeys } from './queryKeys';
import { useCustomerSelectionStore } from '../features/customers/state/customerSelectionSlice';

export type { AddCustomerPayload, UpdateCustomerPayload };

export function useCustomers() {
  const queryClient = useQueryClient();
  const clearSelection = useCustomerSelectionStore((s) => s.clearOnFilterChange);

  // Filter states
  const [searchTerm, setSearchTerm] = React.useState('');
  const [timeRange, setTimeRange] = React.useState('all');
  const [balanceFilter, setBalanceFilter] = React.useState('all');
  const [sexFilter, setSexFilter] = React.useState('all');

  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [isAddModalOpen, setAddModalOpen] = React.useState(false);

  // Clear selection whenever filters or search change
  const handleSetSearchTerm = (term: string) => {
    setSearchTerm(term);
    clearSelection();
  };

  const handleSetTimeRange = (range: string) => {
    setTimeRange(range);
    clearSelection();
  };

  const handleSetBalanceFilter = (balance: string) => {
    setBalanceFilter(balance);
    clearSelection();
  };

  const handleSetSexFilter = (sex: string) => {
    setSexFilter(sex);
    clearSelection();
  };

  // Queries
  const {
    data: allCustomers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Customer[]>({
    queryKey: customerKeys.list(),
    queryFn: async () => customersApi.list(),
  });

  // Filter non-archived and apply filters
  const filteredCustomers = React.useMemo(() => {
    const active = allCustomers.filter((c) => !c.archived_at);

    return active.filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const qDigits = q.replace(/\D/g, '');
      const phoneDigits = c.phone.replace(/\D/g, '');

      const matchesSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (qDigits.length >= 3 && phoneDigits.includes(qDigits)) ||
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

      let matchesSex = true;
      const custSex = c.gender || c.sex;
      if (sexFilter === 'male') {
        matchesSex = custSex === 'male';
      } else if (sexFilter === 'female') {
        matchesSex = custSex === 'female';
      } else if (sexFilter === 'blank') {
        matchesSex = !custSex;
      }

      return matchesSearch && matchesTime && matchesBalance && matchesSex;
    });
  }, [allCustomers, searchTerm, timeRange, balanceFilter, sexFilter]);

  // Mutations
  const addCustomerMutation = useMutation({
    mutationFn: async (payload: AddCustomerPayload) => customersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateCustomerPayload }) =>
      customersApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });

  const updateCustomerNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) =>
      customersApi.updateCustomerNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });

  return {
    customers: filteredCustomers,
    allCustomers,
    isLoading,
    isError,
    error,
    refetch,

    searchTerm,
    setSearchTerm: handleSetSearchTerm,
    timeRange,
    setTimeRange: handleSetTimeRange,
    balanceFilter,
    setBalanceFilter: handleSetBalanceFilter,
    sexFilter,
    setSexFilter: handleSetSexFilter,

    selectedCustomerId,
    setSelectedCustomerId,
    isAddModalOpen,
    setAddModalOpen,

    addCustomer: (payload: AddCustomerPayload) => addCustomerMutation.mutateAsync(payload),
    updateCustomer: (id: string, updates: UpdateCustomerPayload) =>
      updateCustomerMutation.mutateAsync({ id, updates }),
    updateCustomerNotes: (id: string, notes: string) =>
      updateCustomerNotesMutation.mutateAsync({ id, notes }),
    deleteCustomer: (id: string) => deleteCustomerMutation.mutateAsync(id),

    isAdding: addCustomerMutation.isPending,
    isUpdating: updateCustomerMutation.isPending,
  };
}
