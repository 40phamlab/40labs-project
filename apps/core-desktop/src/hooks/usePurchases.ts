import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PurchaseOrder, Supplier } from '@40labs/types';
import { purchasesApi, CreatePurchaseOrderLine } from '../api';
import { purchaseKeys } from './queryKeys';

export type { CreatePurchaseOrderLine };

export function usePurchases() {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: purchaseOrders = [],
    isLoading: isLoadingPOs,
  } = useQuery<PurchaseOrder[]>({
    queryKey: purchaseKeys.list(),
    queryFn: async () => purchasesApi.list(),
  });

  const {
    data: suppliers = [],
    isLoading: isLoadingSuppliers,
  } = useQuery<Supplier[]>({
    queryKey: purchaseKeys.suppliers(),
    queryFn: async () => purchasesApi.listSuppliers(),
  });

  // Mutations
  const createPurchaseOrderMutation = useMutation({
    mutationFn: async ({
      supplierId,
      lines,
    }: {
      supplierId: string;
      lines: CreatePurchaseOrderLine[];
    }) => {
      return purchasesApi.create(supplierId, lines);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
    },
  });

  const approvePurchaseOrderMutation = useMutation({
    mutationFn: async (poId: string) => {
      return purchasesApi.approve(poId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
    },
  });

  const updatePurchaseOrderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PurchaseOrder> }) => {
      return purchasesApi.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
    },
  });

  const deletePurchaseOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      return purchasesApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
    },
  });

  // UI state
  const [selectedPOId, setSelectedPOId] = React.useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<string | null>(null);

  return {
    purchaseOrders,
    suppliers,
    isLoading: isLoadingPOs || isLoadingSuppliers,

    // UI state
    selectedPOId,
    setSelectedPOId,
    selectedSupplierId,
    setSelectedSupplierId,

    // Actions via Mutations
    createPurchaseOrder: (supplierId: string, lines: CreatePurchaseOrderLine[]) =>
      createPurchaseOrderMutation.mutateAsync({ supplierId, lines }),
    approvePurchaseOrder: (poId: string) => approvePurchaseOrderMutation.mutateAsync(poId),
    updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) =>
      updatePurchaseOrderMutation.mutateAsync({ id, updates }),
    deletePurchaseOrder: (id: string) => deletePurchaseOrderMutation.mutateAsync(id),

    isCreating: createPurchaseOrderMutation.isPending,
    isApproving: approvePurchaseOrderMutation.isPending,
  };
}
