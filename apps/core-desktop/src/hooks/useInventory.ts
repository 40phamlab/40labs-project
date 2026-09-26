import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MedicineWithInventory, Medicine } from '@40labs/types';
import {
  inventoryApi,
  AddStockPayload,
  RecordStockActionPayload,
  StockActionType,
} from '../api';
import { inventoryKeys } from './queryKeys';

export type { AddStockPayload, RecordStockActionPayload, StockActionType };

export function useInventory() {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: items = [],
    isLoading: isLoadingItems,
    isError: isItemsError,
    error: itemsError,
    refetch,
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

  const recordStockActionMutation = useMutation({
    mutationFn: async (payload: RecordStockActionPayload) => {
      return inventoryApi.recordStockAction(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return inventoryApi.recordStockAction({
        inventoryItemId: id,
        action: 'deactivated',
        reason: 'Deactivated batch via action menu',
      });
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
  const [filterLowStock, setFilterLowStock] = React.useState(false);
  const [filterOutOfStock, setFilterOutOfStock] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const [isModalOpen, setModalOpen] = React.useState(false);
  const [graphVisible, setGraphVisible] = React.useState(true);
  const [searchPanelOpen, setSearchPanelOpen] = React.useState(true);

  // Active item and type for semantic stock action modal
  const [selectedActionItem, setSelectedActionItem] = React.useState<MedicineWithInventory | null>(null);
  const [actionModalType, setActionModalType] = React.useState<StockActionType | null>(null);

  // Derived data
  const filteredData = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = new Date();

    return items.filter((item) => {
      const medicineName = item.medicine.name.toLowerCase();
      const genericName = item.medicine.generic_name?.toLowerCase() || '';
      const batchNumber = item.batch_number.toLowerCase();

      const matchesSearch =
        normalizedSearch === '' ||
        medicineName.includes(normalizedSearch) ||
        genericName.includes(normalizedSearch) ||
        batchNumber.includes(normalizedSearch);

      const isExpired = new Date(item.expiry_date) < now;
      if (filterExpired && !isExpired) return false;

      const isLowStock = item.quantity > 0 && item.quantity <= item.low_stock_threshold;
      if (filterLowStock && !isLowStock) return false;

      const isOutOfStock = item.quantity === 0;
      if (filterOutOfStock && !isOutOfStock) return false;

      if (selectedCategory && item.medicine.category !== selectedCategory) return false;

      return matchesSearch;
    });
  }, [items, searchTerm, filterExpired, filterLowStock, filterOutOfStock, selectedCategory]);

  const openActionModal = React.useCallback(
    (item: MedicineWithInventory, action: StockActionType) => {
      setSelectedActionItem(item);
      setActionModalType(action);
    },
    []
  );

  const closeActionModal = React.useCallback(() => {
    setSelectedActionItem(null);
    setActionModalType(null);
  }, []);

  return {
    items,
    medicines,
    filteredData,
    isLoading: isLoadingItems || isLoadingMedicines,
    isError: isItemsError,
    error: itemsError,
    refetch,

    // UI state & setters
    searchTerm,
    setSearchTerm,
    filterExpired,
    setFilterExpired,
    filterLowStock,
    setFilterLowStock,
    filterOutOfStock,
    setFilterOutOfStock,
    selectedCategory,
    setSelectedCategory,
    isModalOpen,
    setModalOpen,
    graphVisible,
    setGraphVisible,
    searchPanelOpen,
    setSearchPanelOpen,

    // Action Modal State
    selectedActionItem,
    actionModalType,
    openActionModal,
    closeActionModal,

    // Actions via Mutations
    addItem: (payload: AddStockPayload) => addStockMutation.mutateAsync(payload),
    recordStockAction: (payload: RecordStockActionPayload) =>
      recordStockActionMutation.mutateAsync(payload),
    deleteItem: (id: string) => deleteItemMutation.mutateAsync(id),
    updateQuantity: (id: string, delta: number) =>
      updateQuantityMutation.mutateAsync({ id, delta }),

    isAdding: addStockMutation.isPending,
    isRecordingAction: recordStockActionMutation.isPending,
    isDeleting: deleteItemMutation.isPending,
    isUpdatingQuantity: updateQuantityMutation.isPending,
  };
}
