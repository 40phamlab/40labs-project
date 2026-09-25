import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Customer } from '@40labs/types';
import { customersApi, AddCustomerPayload, UpdateCustomerPayload } from '../api';
import { customerKeys } from './queryKeys';

export type { AddCustomerPayload, UpdateCustomerPayload };

export function useCustomers() {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: customers = [],
    isLoading,
    isError,
    error,
  } = useQuery<Customer[]>({
    queryKey: customerKeys.list(),
    queryFn: async () => customersApi.list(),
  });

  // Mutations
  const addCustomerMutation = useMutation({
    mutationFn: async (payload: AddCustomerPayload) => {
      return customersApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateCustomerPayload }) => {
      return customersApi.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });

  const updateCustomerNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return customersApi.updateCustomerNotes(id, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      return customersApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });

  // UI State
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [isAddModalOpen, setAddModalOpen] = React.useState(false);

  return {
    customers,
    isLoading,
    isError,
    error,

    // UI state & setters
    searchTerm,
    setSearchTerm,
    selectedCustomerId,
    setSelectedCustomerId,
    isAddModalOpen,
    setAddModalOpen,

    // Actions via Mutations
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
