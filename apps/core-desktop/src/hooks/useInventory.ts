import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MedicineWithInventory, Medicine } from '@40labs/types';
import { inventoryApi, AddStockPayload } from '../api';
import { inventoryKeys } from './queryKeys';

export type { AddStockPayload };

export function useInventory() {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: items = [],
    isLoading: isLoadingItems,
    isError: isItemsError,
    error: itemsError,
  } = useQuery<MedicineWithInventory[]>({
    queryKey: inventoryKeys.list(),
    queryFn: async () => inventoryApi.list(),
  });

  const {
    data: medicines = [],
    isLoading: isLoadingMedicines,
  } = useQuery<Medicine[]>({
    queryKey: inventoryKeys.medicines(),
    queryFn: async () => inventoryApi.listMedicines(),
  });

  // Mutations
  const addStockMutation = useMutation({
    mutationFn: async (payload: AddStockPayload) => {
      return inventoryApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return inventoryApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      return inventoryApi.updateQuantity(id, delta);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });

  // UI State
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterExpired, setFilterExpired] = React.useState(false);
  const [isModalOpen, setModalOpen] = React.useState(false);
  const [graphVisible, setGraphVisible] = React.useState(true);
  const [searchPanelOpen, setSearchPanelOpen] = React.useState(false);

  // Derived data
  const filteredData = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = new Date();

    return items.filter((item) => {
      const medicineName = item.medicine.name.toLowerCase();
      const matchesSearch = normalizedSearch === '' || medicineName.includes(normalizedSearch);
      const isExpired = new Date(item.expiry_date) < now;
      const matchesExpired = !filterExpired || isExpired;
      return matchesSearch && matchesExpired;
    });
  }, [items, searchTerm, filterExpired]);

  return {
    items,
    medicines,
    filteredData,
    isLoading: isLoadingItems || isLoadingMedicines,
    isError: isItemsError,
    error: itemsError,

    // UI state & setters
    searchTerm,
    setSearchTerm,
    filterExpired,
    setFilterExpired,
    isModalOpen,
    setModalOpen,
    graphVisible,
    setGraphVisible,
    searchPanelOpen,
    setSearchPanelOpen,

    // Actions via Mutations
    addItem: (payload: AddStockPayload) => addStockMutation.mutateAsync(payload),
    deleteItem: (id: string) => deleteItemMutation.mutateAsync(id),
    updateQuantity: (id: string, delta: number) => updateQuantityMutation.mutateAsync({ id, delta }),

    isAdding: addStockMutation.isPending,
    isDeleting: deleteItemMutation.isPending,
    isUpdatingQuantity: updateQuantityMutation.isPending,
  };
}
